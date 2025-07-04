function GenerateVideoCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile }) {
    // ...复制 generateCommand 里 mode === "video" 的实现...
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
    return cmd;
}

function GenerateAudioCommand({ enableVideo, enableAudio, time_start, time_end, inputFile, outputFile }) {
    // ...复制 generateCommand 里 mode === "audio" 的实现...
    const acodec = document.getElementById('acodec_audio').value;
    const abitrate = document.getElementById('abitrate').value.trim();
    const achannels = document.getElementById('achannels').value.trim();
    const asample = document.getElementById('asample').value.trim();
    const aextra = document.getElementById('aextra').value.trim();

    if (!inputFile) {
        return '请输入输入文件名';
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

    let cmd = `ffmpeg`;
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
    return cmd;
}
