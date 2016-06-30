// ==UserScript==
// @name            Facebook HD Video Downloader
// @description     Adds a download link for Facebook videos. Works for HD videos. Fork from styfle version.
// @author          EThaiZone
// @include     http://facebook.com/video.php*
// @include     http://*.facebook.com/video.php*
// @include     https://facebook.com/video.php*
// @include     https://*.facebook.com/video.php*
// @include     http://facebook.com/video/*
// @include     http://*.facebook.com/video/*
// @include     https://facebook.com/video/*
// @include     https://*.facebook.com/video/*
// @include     http://facebook.com/*/videos/*
// @include     http://*.facebook.com/*/videos/*
// @include     https://facebook.com/*/videos/*
// @include     https://*.facebook.com/*/videos/*
// @version 0.0.1.20151109032224
// @namespace https://greasyfork.org/users/3747
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==


(function () {

    if (typeof jQuery == 'undefined') {
        alert('[Facebook HD Video Downloader]\n\nYour greasemonkey or tampermonkey is too old. Please update.');
        return;
    }
    
    function renderFBDownloader(counter) {

        // Get the base so we can append to it later
        var base = jQuery('.comment_link').parent('span').parent('div');
        if (base.length === 0) {
            base = jQuery('.UFILikeLink').parent('div').parent('span').parent('div'); // check link like 
        }
        if (base.length === 0) {
            base = jQuery('.userContent'); // or else I will attach to userContent.
        }
        base = base[0];

        // Get all the <embed> elements
        var embedElements = document.querySelectorAll('embed[flashvars]');

        // Flag if we found the video url or not
        var found = false;

        for (var i = 0; i < embedElements.length; i++) {
            // Get the flashvars attribute and decode it
            var flashvars = decodeURIComponent(embedElements[i].getAttribute('flashvars'));

            // Check if this string contains the code we're looking for
            var hd_src_index = flashvars.indexOf('hd_src');
            var p_width_index = flashvars.indexOf('&width=');
            if (hd_src_index > -1 && p_width_index > -1) {
                // This string contains the payload we are looking for so parse it
                var obj = JSON.parse(flashvars.slice(7, p_width_index));
                var video_data = obj.video_data.progressive;

                //console.log(video_data);
                
                var title = video_data.video_id;
                //var title = document.querySelectorAll('h2.uiHeaderTitle')[0].innerText;


                //var sidebar = document.getElementById('fbPhotoPageActions');

                // High Def
                if (video_data.hd_src)
                {
                    var hd_link = document.createElement('a');
                    hd_link.href = video_data.hd_src;
                    hd_link.innerHTML = 'Download HD Video';
                    hd_link.className = 'fbPhotosPhotoActionsItem fb_download_link_ethaizone';
                    hd_link.download = title + '_hd.mp4';
                    base.appendChild(document.createElement('span').appendChild(hd_link));
                }

                // Low Def
                if (video_data.sd_src)
                {
                    var sd_link = document.createElement('a');
                    sd_link.href = video_data.sd_src;
                    sd_link.innerHTML = 'Download SD Video';
                    sd_link.className = 'fbPhotosPhotoActionsItem fb_download_link_ethaizone';
                    sd_link.download = title + '_sd.mp4';
                    base.appendChild(document.createElement('span').appendChild(sd_link));
                }

                found = true;
            } // end if

        } // end loop

        if (!found && counter > 20) {            
            var not_found = document.createElement('span');
            not_found.innerHTML = 'No download link :(';
            base.appendChild(not_found);
        }
        
        return checkDownloadLinkExists();
    }

    function checkDownloadLinkExists() {
        return (document.getElementsByClassName("fb_download_link_ethaizone").length > 0);
    }

    var counter = 0;
    function doExec() {
        if (checkDownloadLinkExists()) {
            log("Video links rendered. (Last check!)");
            return true;
        }
        counter++;
        try {
            log("Find flashvars. " + counter);
            if (renderFBDownloader(counter) == true) {
                log("Video links rendered.");
            } else {
                log("Try again.");
            }
            setTimeout(doExec, 1000);
        } catch(e) {
            log("Found error!");
            console.log(e);
            //setTimeout(doExec, 1000);
        }
    }

    function log(msg) {
        //alert(msg);
        console.log("[FB Video Downloader] " + msg);
    }
    log("First Start.");
    doExec();
})();