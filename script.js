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
// ==/UserScript==

(function () {

    function renderFBDownloader(counter) {

        // Get the side bar so we can append to it later
        var sidebar = document.getElementById('fbPhotoPageActions');

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
                var video_data = obj.video_data[0];

                //var title = video_data.video_id;
                var title = document.querySelectorAll('h2.uiHeaderTitle')[0].innerText;

                // High Def
                if (video_data.hd_src)
                {
                    var hd_link = document.createElement('a');
                    hd_link.href = video_data.hd_src;
                    hd_link.innerHTML = 'Download HD Video';
                    hd_link.className = 'fbPhotosPhotoActionsItem';
                    hd_link.download = title + '_hd.mp4';
                    sidebar.appendChild(hd_link);
                }

                // Low Def
                if (video_data.sd_src)
                {
                    var sd_link = document.createElement('a');
                    sd_link.href = video_data.sd_src;
                    sd_link.innerHTML = 'Download SD Video';
                    sd_link.className = 'fbPhotosPhotoActionsItem';
                    sd_link.download = title + '_sd.mp4';
                    sidebar.appendChild(sd_link);
                }

                found = true;
            } // end if

        } // end loop

        if (!found && counter > 20) {
            var not_found = document.createElement('span');
            not_found.innerHTML = 'No download link :(';
            sidebar.appendChild(not_found);
        }
        
        return found;
    }

    var counter = 0;
    function doExec() {
        counter++;
        try {
            log("Find flashvars. " + counter);
            if (renderFBDownloader(counter) == true) {
                log("Video links rendered.");
            } else {
                setTimeout(doExec, 1000);
                log("Try again.");
            }
        } catch(e) {
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