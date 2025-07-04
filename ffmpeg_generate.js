// 自动输出名逻辑
function getInputFileExt(inputFile) {
    const m = inputFile.match(/\.([a-zA-Z0-9]+)$/);
    return m ? ("." + m[1].toLowerCase()) : ".mp4";
}

function getDefaultOutputName(options) {
    const {
        vcodec, acodec, resolution, pix_fmt, profileSel, profile, profileVer,
        ratecontrol, rcVal, tune, bframes, preset, gop, framerate, hdr, time_start, time_end,
        enableVideo, enableAudio, copyVideo, copyAudio, inputFile
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

    let ext = ".mp4";
    if (enableVideo) {
        if (copyVideo) {
            ext = getInputFileExt(inputFile);
        } else {
            ext = ".mp4";
        }
    } else if (enableAudio) {
        if (copyAudio) {
            ext = getInputFileExt(inputFile);
        } else if (acodec === "mp3") {
            ext = ".mp3";
        } else if (acodec === "aac") {
            ext = ".m4a";
        } else if (acodec === "wav" || acodec === "pcm_s16le") {
            ext = ".wav";
        } else {
            ext = ".mp3";
        }
    }
    return (parts.length > 0 ? parts.join('_') : "output") + ext;
}

function GenerateVideoCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile }) {
    const copyVideo = document.getElementById('copy_video').checked;
    const copyAudio = document.getElementById('copy_audio').checked;
    const vcodec = copyVideo ? "copy" : document.getElementById('vcodec').value;
    const acodec = enableAudio ? (copyAudio ? "copy" : (document.getElementById('acodec_audio').value || 'aac')) : 'none';
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
        time_start, time_end, enableVideo, enableAudio, copyVideo, copyAudio, inputFile
    };

    if (!inputFile) {
        return '请输入输入文件名';
    }
    if (!outputFile) {
        outputFile = getDefaultOutputName(options);
    }

    let cmd = `ffmpeg`;

    // 时间参数
    if (time_start) { cmd += ` -ss ${time_start}`; }
    cmd += ` -i "${inputFile}"`;
    if (time_end) { cmd += ` -to ${time_end}`; }

    // 视频编码器
    if (enableVideo) {
        if (copyVideo) {
            cmd += " -c:v copy";
        } else if (vcodec) {
            cmd += ` -c:v ${vcodec}`;
        }
    } else {
        cmd += " -vn";
    }

    // 音频编码器
    if (enableAudio) {
        if (copyAudio) {
            cmd += " -c:a copy";
        } else if (acodec) {
            cmd += ` -c:a ${acodec}`;
        }
    } else {
        cmd += " -an";
    }

    // 只有 x264/x265 显示高级项
    if (!copyVideo && (vcodec === "libx264" || vcodec === "libx265")) {
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
    return cmd;
}

function GenerateAudioCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile }) {
    const copyAudio = document.getElementById('copy_audio').checked;
    const acodecSel = copyAudio ? "copy" : document.getElementById('acodec_audio').value;
    let acodec = acodecSel;
    const abitrate = document.getElementById('abitrate').value.trim();
    const achannels = document.getElementById('achannels').value.trim();
    const asample = document.getElementById('asample').value.trim();
    const aextra = document.getElementById('aextra').value.trim();

    // wav特殊处理
    let forceExt = null;
    if (acodecSel === "wav" || acodecSel === "pcm_s16le") {
        acodec = "pcm_s16le";
        forceExt = ".wav";
    }

    if (!inputFile) {
        return '请输入输入文件名';
    }
    if (!outputFile) {
        let parts = [];
        if (!isDefault(acodecSel, 'copy')) parts.push(acodecSel);
        if (!isDefault(abitrate, '')) parts.push(abitrate.replace(/[^\w\-\.]/g, ''));
        if (!isDefault(achannels, '')) parts.push(achannels + "ch");
        if (!isDefault(asample, '')) parts.push(asample + "hz");
        if (!isDefault(time_start, '') || !isDefault(time_end, '')) {
            let tstr = (time_start ? ("from" + time_start.replace(/:/g, "")) : "") + (time_end ? ("to" + time_end.replace(/:/g, "")) : "");
            parts.push(tstr);
        }
        let ext;
        if (copyAudio) {
            ext = getInputFileExt(inputFile);
        } else if (forceExt) {
            ext = forceExt;
        } else if (acodecSel === "mp3") {
            ext = ".mp3";
        } else if (acodecSel === "aac") {
            ext = ".m4a";
        } else {
            ext = ".mp3";
        }
        outputFile = (parts.length > 0 ? parts.join('_') : "output") + ext;
    } else if (forceExt && !outputFile.endsWith(forceExt)) {
        // 如果用户手动填写但没加扩展名，自动补全
        outputFile = outputFile.replace(/\.\w+$/, "") + forceExt;
    }

    let cmd = `ffmpeg`;
    if (time_start) { cmd += ` -ss ${time_start}`; }
    cmd += ` -i "${inputFile}"`;
    if (time_end) { cmd += ` -to ${time_end}`; }

    // 视频禁用
    cmd += " -vn";
    // 音频
    if (acodecSel === "copy") {
        cmd += " -c:a copy";
    } else if (acodecSel) {
        cmd += ` -c:a ${acodec}`;
        if (abitrate && acodecSel !== "wav" && acodecSel !== "pcm_s16le") cmd += ` -b:a ${abitrate}`;
        if (achannels) cmd += ` -ac ${achannels}`;
        if (asample) cmd += ` -ar ${asample}`;
        if (aextra) cmd += ' ' + aextra;
    }
    cmd += ` "${outputFile}"`;
    return cmd;
}


function generateCommand() {
    const enableVideo = document.getElementById('enable_video').checked;
    const enableAudio = document.getElementById('enable_audio').checked;
    const copyVideo = document.getElementById('copy_video').checked;
    const copyAudio = document.getElementById('copy_audio').checked;
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

    if (mode === "video") {
        cmd = GenerateVideoCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile });
        document.getElementById('command').innerText = cmd;
    } else if (mode === "audio") {
        cmd = GenerateAudioCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile });
        document.getElementById('command').innerText = cmd;
    } else {
        document.getElementById('command').innerText = '请至少启用视频或音频转码';
    }
}
