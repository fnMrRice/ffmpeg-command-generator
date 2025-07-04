// 支持的profile字典（main10/main10p/HDR等）
const profiles = {
    'libx264': [
        { value: 'baseline', text: 'Baseline' },
        { value: 'main', text: 'Main' },
        { value: 'high', text: 'High' }
    ],
    'libx265': [
        { value: 'main', text: 'Main' },
        { value: 'main10', text: 'Main10p' },
        { value: 'mainstillpicture', text: 'MainStillPicture' },
        { value: 'rext', text: 'Rext' }
    ]
};

// profile version字典
const profileVersions = {
    'libx264': {
        'baseline': ["", "3.0", "3.1", "4.0"],
        'main': ["", "3.0", "3.1", "4.0"],
        'high': ["", "4.0"]
    },
    'libx265': {
        'main': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'main10': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'mainstillpicture': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'rext': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"]
    }
};

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

// 自动输出名逻辑
function getDefaultOutputName(options) {
    const {
        vcodec, acodec, resolution, pix_fmt, profileSel, profile, profileVer,
        ratecontrol, rcVal, tune, bframes, preset, gop, framerate, hdr, time_start, time_end
    } = options;

    let parts = [];
    if (!isDefault(vcodec, 'copy')) parts.push(vcodec);
    if (!isDefault(acodec, 'copy')) parts.push(acodec);
    if (!isDefault(resolution, '')) parts.push(resolution.replace(/[^\w\-x]/g, ''));
    if (!isDefault(pix_fmt, '')) parts.push(pix_fmt);
    if (!isDefault(profileSel, '') || !isDefault(profile, '')) {
        let prof = profileSel === "other" ? profile : profileSel;
        if (prof) parts.push(prof);
        if (!isDefault(profileVer, '')) parts.push("L" + profileVer.replace(/[^\w\-\.]/g, ''));
    }
    if (!isDefault(ratecontrol, '')) {
        let rcPart = ratecontrol;
        if (!isDefault(rcVal, '')) rcPart += "_" + rcVal.replace(/[^\w\-\.]/g, '');
        parts.push(rcPart);
    }
    if (!isDefault(tune, '')) parts.push(tune.replace(/[^\w\-]/g, ''));
    if (!isDefault(bframes, '')) parts.push(bframes === "disable" ? 'noB' : 'B');
    if (!isDefault(preset, '')) parts.push(preset);
    if (!isDefault(gop, '')) parts.push("gop" + gop);
    if (!isDefault(framerate, '')) parts.push(framerate + "fps");
    if (!isDefault(hdr, '')) parts.push(hdr);
    if (!isDefault(time_start, '') || !isDefault(time_end, '')) {
        let tstr = (time_start ? ("from" + time_start.replace(/:/g, "")) : "") + (time_end ? ("to" + time_end.replace(/:/g, "")) : "");
        parts.push(tstr);
    }

    return (parts.length > 0 ? parts.join('_') : "output") + ".mp4";
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

function generateCommand() {
    const enableVideo = document.getElementById('enable_video').checked;
    const enableAudio = document.getElementById('enable_audio').checked;
    const time_start = document.getElementById('time_start').value.trim();
    const time_end = document.getElementById('time_end').value.trim();
    const inputFile = document.getElementById('inputFile').value.trim();
    let outputFile = document.getElementById('outputFile').value.trim();

    // 决定主模式
    let mode = "none";
    if (enableVideo && !enableAudio) mode = "video";
    else if (!enableVideo && enableAudio) mode = "audio";
    else if (enableVideo && enableAudio) {
        // 取当前激活tab
        mode = document.getElementById('tabVideoBtn').classList.contains('active') ? "video" : "audio";
    }

    let cmd = "";

    // 视频
    if (mode === "video") {
        const vcodec = document.getElementById('vcodec').value;
        const acodec = enableAudio ? (document.getElementById('acodec_audio').value || 'copy') : 'none';
        const resSel = document.getElementById('resolution_select').value;
        const resolution = resSel === 'custom'
            ? document.getElementById('resolution').value.trim()
            : resSel;
        const pix_fmt = document.getElementById('pix_fmt').value.trim();
        const profileSel = profiles[vcodec] ? document.getElementById('profile_select').value : '';
        const profile = document.getElementById('profile') ? document.getElementById('profile').value.trim() : '';
        const profileVer = (profiles[vcodec] && profileSel !== "other") ? document.getElementById('profile_version').value : '';
        const ratecontrol = document.getElementById('ratecontrol_mode').value;
        const extra = document.getElementById('extra').value.trim();
        const gop = document.getElementById('gop').value.trim();
        const framerate = document.getElementById('framerate').value.trim();
        const hdr = document.getElementById('hdr_config').value;
        let tune = document.getElementById('tune').value;
        if (tune === "other") {
            tune = document.getElementById('tune_custom').value.trim();
        }
        let bframes = document.getElementById('bframes').value;
        let preset = document.getElementById('preset').value;
        const rc = getRateControlArgs(ratecontrol);

        const options = {
            vcodec, acodec, resolution, pix_fmt, profileSel, profile, profileVer,
            ratecontrol, rcVal: rc.rcval, tune, bframes, preset, gop, framerate, hdr, extra,
            time_start, time_end
        };

        if (!inputFile) {
            document.getElementById('command').innerText = '请输入输入文件名';
            return;
        }
        if (!outputFile) {
            outputFile = getDefaultOutputName(options);
        }

        cmd = `ffmpeg`;

        // 时间参数
        if (time_start) { cmd += ` -ss ${time_start}`; }
        cmd += ` -i "${inputFile}"`;
        if (time_end) { cmd += ` -to ${time_end}`; }

        // 视频编码器
        if (enableVideo) {
            if (vcodec === "copy") {
                cmd += " -c:v copy";
            } else if (vcodec) {
                cmd += ` -c:v ${vcodec}`;
            }
        } else {
            cmd += " -vn";
        }

        // 音频编码器
        if (enableAudio) {
            if (acodec === "copy") {
                cmd += " -c:a copy";
            } else if (acodec) {
                cmd += ` -c:a ${acodec}`;
            }
        } else {
            cmd += " -an";
        }

        // 只有 x264/x265 显示高级项
        if (vcodec === "libx264" || vcodec === "libx265") {
            if (resolution && resolution.toLowerCase() !== "custom") {
                cmd += ` -s ${resolution}`;
            }
            if (pix_fmt) {
                cmd += ` -pix_fmt ${pix_fmt}`;
            }
            // profile
            let useProfile = "";
            if (profileSel) {
                if (profileSel === "other" && profile) {
                    useProfile = profile;
                } else if (profileSel && profileSel !== "other") {
                    useProfile = profileSel;
                }
            }
            if (useProfile) {
                cmd += ` -profile:v ${useProfile}`;
                if (profileVer) {
                    cmd += ` -level ${profileVer}`;
                }
            }
            // HDR
            if (hdr) {
                if (hdr === "main10" && vcodec === "libx265") {
                    cmd += " -profile:v main10";
                } else if (hdr === "main10-hdr" && vcodec === "libx265") {
                    cmd += " -profile:v main10 -color_primaries 9 -color_trc 16 -colorspace 9 -master_display 'G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1)' -max_cll 1000,400";
                } else if (hdr === "hlg" && vcodec === "libx265") {
                    cmd += " -color_primaries 9 -color_trc 18 -colorspace 9";
                } else if (hdr === "dv" && vcodec === "libx265") {
                    cmd += " -profile:v main10 -dolby_vision_profile 8";
                }
            }
            if (preset) { cmd += ` -preset ${preset}`; }
            if (tune) { cmd += ` -tune ${tune}`; }
            if (bframes === "disable") { cmd += ` -bf 0`; }
            if (gop) { cmd += ` -g ${gop}`; }
            if (framerate) { cmd += ` -r ${framerate}`; }
            if (rc.args) cmd += rc.args;
            if (extra) cmd += ' ' + extra;
        }

        cmd += ` "${outputFile}"`;
        document.getElementById('command').innerText = cmd;
    } else if (mode === "audio") {
        const acodec = document.getElementById('acodec_audio').value;
        const abitrate = document.getElementById('abitrate').value.trim();
        const achannels = document.getElementById('achannels').value.trim();
        const asample = document.getElementById('asample').value.trim();
        const aextra = document.getElementById('aextra').value.trim();

        if (!inputFile) {
            document.getElementById('command').innerText = '请输入输入文件名';
            return;
        }
        if (!outputFile) {
            let parts = [];
            if (!isDefault(acodec, 'copy')) parts.push(acodec);
            if (!isDefault(abitrate, '')) parts.push(abitrate.replace(/[^\w\-\.]/g, ''));
            if (!isDefault(achannels, '')) parts.push(achannels + "ch");
            if (!isDefault(asample, '')) parts.push(asample + "hz");
            if (!isDefault(time_start, '') || !isDefault(time_end, '')) {
                let tstr = (time_start ? ("from" + time_start.replace(/:/g, "")) : "") + (time_end ? ("to" + time_end.replace(/:/g, "")) : "");
                parts.push(tstr);
            }
            outputFile = (parts.length > 0 ? parts.join('_') : "output") + ".mp3";
        }

        cmd = `ffmpeg`;
        if (time_start) { cmd += ` -ss ${time_start}`; }
        cmd += ` -i "${inputFile}"`;
        if (time_end) { cmd += ` -to ${time_end}`; }

        // 视频禁用
        cmd += " -vn";
        // 音频
        if (acodec === "copy") {
            cmd += " -c:a copy";
        } else if (acodec) {
            cmd += ` -c:a ${acodec}`;
            if (abitrate) cmd += ` -b:a ${abitrate}`;
            if (achannels) cmd += ` -ac ${achannels}`;
            if (asample) cmd += ` -ar ${asample}`;
            if (aextra) cmd += ' ' + aextra;
        }
        cmd += ` "${outputFile}"`;
        document.getElementById('command').innerText = cmd;
    } else {
        document.getElementById('command').innerText = '请至少启用视频或音频转码';
    }
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
