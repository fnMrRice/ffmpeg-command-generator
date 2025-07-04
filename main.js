function populateProfileSelect(vcodec) {
    const row = document.getElementById('profile-row');
    const select = document.getElementById('profile_select');
    select.innerHTML = '';
    if (profiles[vcodec]) {
        row.style.display = '';
        profiles[vcodec].forEach(function (opt) {
            let option = document.createElement('option');
            option.value = opt.value;
            option.text = opt.text;
            select.appendChild(option);
        });
        // 默认选main(如果有)
        if (profiles[vcodec].some(x => x.value === "main")) {
            select.value = "main";
        } else {
            select.selectedIndex = 0;
        }
        syncProfile();
    } else {
        row.style.display = 'none';
    }
}

// 标签页切换（不修改命令）
function showTab(tab, noGenerate) {
    if (tab === 'video' && document.getElementById('enable_video').checked) {
        document.getElementById('tabVideo').style.display = '';
        document.getElementById('tabAudio').style.display = 'none';
        document.getElementById('tabVideoBtn').classList.add('active');
        document.getElementById('tabAudioBtn').classList.remove('active');
    } else if (tab === 'audio' && document.getElementById('enable_audio').checked) {
        document.getElementById('tabVideo').style.display = 'none';
        document.getElementById('tabAudio').style.display = '';
        document.getElementById('tabAudioBtn').classList.add('active');
        document.getElementById('tabVideoBtn').classList.remove('active');
    }
    // 默认generateCommand会在oninput里触发，这里切tab时不触发
    if (!noGenerate) generateCommand();
}

function toggleAVTabs() {
    const enableVideo = document.getElementById('enable_video').checked;
    const enableAudio = document.getElementById('enable_audio').checked;
    document.getElementById('tabVideoBtn').style.display = enableVideo ? '' : 'none';
    document.getElementById('tabAudioBtn').style.display = enableAudio ? '' : 'none';
    if (enableVideo && !enableAudio) {
        document.getElementById('tabVideo').style.display = '';
        document.getElementById('tabAudio').style.display = 'none';
        document.getElementById('tabVideoBtn').classList.add('active');
        document.getElementById('tabAudioBtn').classList.remove('active');
    } else if (!enableVideo && enableAudio) {
        document.getElementById('tabVideo').style.display = 'none';
        document.getElementById('tabAudio').style.display = '';
        document.getElementById('tabAudioBtn').classList.add('active');
        document.getElementById('tabVideoBtn').classList.remove('active');
    } else if (enableVideo && enableAudio) {
        if (document.getElementById('tabVideoBtn').classList.contains('active')) {
            showTab('video', true); // 不触发generateCommand
        } else {
            showTab('audio', true);
        }
    } else {
        document.getElementById('tabVideo').style.display = 'none';
        document.getElementById('tabAudio').style.display = 'none';
        document.getElementById('tabVideoBtn').classList.remove('active');
        document.getElementById('tabAudioBtn').classList.remove('active');
    }
    generateCommand();
}

// 输入/输出文件名联动
document.getElementById('inputFile').addEventListener('input', function () {
    const v = this.value;
    const a = document.getElementById('inputFile_audio');
    if (a) a.value = v;
});
document.getElementById('outputFile').addEventListener('input', function () {
    const v = this.value;
    const a = document.getElementById('outputFile_audio');
    if (a) a.value = v;
});

// 高级项显示隐藏控制
function onVCodecChange() {
    const vcodec = document.getElementById('vcodec').value;
    document.getElementById('video-advanced').style.display = (vcodec === 'libx264' || vcodec === 'libx265') ? '' : 'none';
    populateProfileSelect(vcodec);
}
function onACodecChange() {
    const acodec = document.getElementById('acodec_audio').value;
    document.getElementById('audio-advanced').style.display = (acodec !== 'copy') ? '' : 'none';
}

// 分辨率输入框
function syncResolution() {
    const sel = document.getElementById('resolution_select');
    const res = document.getElementById('resolution');
    if (sel.value === "custom") {
        res.style.display = '';
        res.value = "";
        res.disabled = false;
        res.focus();
    } else {
        res.style.display = 'none';
        res.value = sel.value;
        res.disabled = sel.value !== "";
    }
    generateCommand();
}

// profile配置项及profile版本动态
function syncProfile() {
    const vcodec = document.getElementById('vcodec').value;
    const sel = document.getElementById('profile_select');
    const profileConfig = document.getElementById('profile_config');
    const profile = document.getElementById('profile');
    const pv = document.getElementById('profile_version');
    // 动态配置profile版本选项
    let profileVerOpts = [];
    if (profileVersions[vcodec] && profileVersions[vcodec][sel.value]) {
        profileVerOpts = profileVersions[vcodec][sel.value];
    }
    pv.innerHTML = "";
    if (profileVerOpts.length) {
        for (let v of profileVerOpts) {
            let opt = document.createElement('option');
            opt.value = v;
            opt.text = v ? "版本 " + v : "版本";
            pv.appendChild(opt);
        }
        pv.style.display = "";
        pv.disabled = false;
    } else {
        let opt = document.createElement('option');
        opt.value = "";
        opt.text = "版本";
        pv.appendChild(opt);
        pv.style.display = "none";
        pv.disabled = true;
    }

    if (sel.value === "other") {
        profileConfig.style.display = "";
        profile.style.display = "";
        profile.disabled = false;
        pv.style.display = "none";
        pv.disabled = true;
        profile.value = "";
        profile.focus();
    } else {
        profileConfig.style.display = "";
        profile.style.display = "none";
        pv.style.display = "";
        pv.disabled = false;
    }
    generateCommand();
}

// 码控模式配置展示
function updateRateControlConfig() {
    const rc_mode = document.getElementById('ratecontrol_mode').value;
    const vcodec = document.getElementById('vcodec').value;
    const container = document.getElementById('rc_config');
    let defaultCrf = "";
    if (rc_mode === "crf") {
        if (vcodec === "libx264") defaultCrf = 23;
        else if (vcodec === "libx265") defaultCrf = 28;
        else defaultCrf = 23;
    }
    container.innerHTML = '';
    switch (rc_mode) {
        case "crf":
            container.innerHTML = `<input type="text" id="crf" class="small" placeholder="CRF值(如23)" value="${defaultCrf}" oninput="generateCommand()">`;
            break;
        case "cbr":
            container.innerHTML = '<input type="text" id="cbr_bitrate" class="small" placeholder="码率 如2M" oninput="generateCommand()">';
            break;
        case "abr":
            container.innerHTML = '<input type="text" id="abr_bitrate" class="small" placeholder="平均码率 如2M" oninput="generateCommand()">';
            break;
        case "vbr":
            container.innerHTML = '最小码率: <input type="text" id="vbr_min" class="small" placeholder="如1M" oninput="generateCommand()"> 最大码率: <input type="text" id="vbr_max" class="small" placeholder="如4M" oninput="generateCommand()">';
            break;
        case "qp":
            container.innerHTML = '<input type="text" id="qp" class="small" placeholder="QP值(如28)" oninput="generateCommand()">';
            break;
        case "other":
            container.innerHTML = '<input type="text" id="rc_other" class="small" placeholder="自定义参数" oninput="generateCommand()">';
            break;
    }
    generateCommand();
}

// 码控模式crf根据编码类型更新默认值
function updateCrfDefault() {
    if (document.getElementById('ratecontrol_mode').value === 'crf') {
        updateRateControlConfig();
    }
}

// tune自定义
document.getElementById('tune').addEventListener('change', function () {
    const val = this.value;
    document.getElementById('tune_custom').style.display = val === 'other' ? '' : 'none';
    generateCommand();
});

// 判断是否为默认项
function isDefault(value, def) {
    return value === def || value === "" || value === undefined || value === null;
}

// 获取视频码控参数
function getRateControlArgs(mode) {
    if (!mode) return { args: '', rcval: '' };
    switch (mode) {
        case "crf":
            var crf = document.getElementById('crf')?.value.trim();
            return { args: crf ? ` -crf ${crf}` : '', rcval: crf || '' };
        case "cbr":
            var br = document.getElementById('cbr_bitrate')?.value.trim();
            return { args: br ? ` -b:v ${br} -minrate ${br} -maxrate ${br} -bufsize ${parseInt(parseFloat(br) || 0) * 2 || '4M'}` : '', rcval: br || '' };
        case "abr":
            var abr = document.getElementById('abr_bitrate')?.value.trim();
            return { args: abr ? ` -b:v ${abr}` : '', rcval: abr || '' };
        case "vbr":
            var vmin = document.getElementById('vbr_min')?.value.trim();
            var vmax = document.getElementById('vbr_max')?.value.trim();
            let args = '';
            if (vmin) args += ` -minrate ${vmin}`;
            if (vmax) args += ` -maxrate ${vmax}`;
            return { args: args, rcval: (vmin || '') + "-" + (vmax || '') };
        case "qp":
            var qp = document.getElementById('qp')?.value.trim();
            return { args: qp ? ` -qp ${qp}` : '', rcval: qp || '' };
        case "other":
            var other = document.getElementById('rc_other')?.value.trim();
            return { args: other ? ` ${other}` : '', rcval: other || '' };
    }
    return { args: '', rcval: '' };
}

// 复制命令
function copyCommand() {
    const command = document.getElementById('command').innerText;
    if (!command) return;
    navigator.clipboard.writeText(command).then(function () {
        const btn = document.getElementById('copy-btn');
        btn.classList.add('copied');
        btn.innerText = '已复制!';
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerText = '复制';
        }, 1200);
    });
}

function onCopyVideoChange() {
    const copy = document.getElementById('copy_video');
    const enable = document.getElementById('enable_video');
    if (copy.checked) {
        enable.checked = false;
    }
}

function onEnableVideoChange() {
    const copy = document.getElementById('copy_video');
    const enable = document.getElementById('enable_video');
    if (enable.checked) {
        copy.checked = false;
    }
}

function onCopyAudioChange() {
    const copy = document.getElementById('copy_audio');
    const enable = document.getElementById('enable_audio');
    if (copy.checked) {
        enable.checked = false;
    }
}

function onEnableAudioChange() {
    const copy = document.getElementById('copy_audio');
    const enable = document.getElementById('enable_audio');
    if (enable.checked) {
        copy.checked = false;
    }
}
