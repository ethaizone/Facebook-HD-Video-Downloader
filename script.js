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
// @version 0.1.0
// @namespace https://greasyfork.org/users/3747
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==


//download.js v4.2, by dandavis; 2008-2016. [CCBY2] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.download = factory();
  }
}(this, function () {

    return function download(data, strFileName, strMimeType) {

        var self = window, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function(a){return String(a);},
            myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
            fileName = strFileName || "download",
            blob,
            reader;
            myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
      
        if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload=[payload, mimeType];
            mimeType=payload[0];
            payload=payload[1];
        }


        if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
            fileName = url.split("/").pop().split("?")[0];
            anchor.href = url; // assign href prop to temp anchor
            if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
                var ajax=new XMLHttpRequest();
                ajax.open( "GET", url, true);
                ajax.responseType = 'blob';
                ajax.onload= function(e){ 
                  download(e.target.response, fileName, defaultMime);
                };
                setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
                return ajax;
            } // end if valid url?
        } // end if url?


        //go ahead and download dataURLs right away
        if(/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)){
        
            if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
                payload=dataUrlToBlob(payload);
                mimeType=payload.type || defaultMime;
            }else{          
                return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
                    navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
                    saver(payload) ; // everyone else can save dataURLs un-processed
            }
            
        }//end if dataURL passed?

        blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], {type: mimeType}) ;


        function dataUrlToBlob(strUrl) {
            var parts= strUrl.split(/[:;,]/),
            type= parts[1],
            decoder= parts[2] == "base64" ? atob : decodeURIComponent,
            binData= decoder( parts.pop() ),
            mx= binData.length,
            i= 0,
            uiArr= new Uint8Array(mx);

            for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

            return new myBlob([uiArr], {type: type});
         }

        function saver(url, winMode){

            if ('download' in anchor) { //html5 A[download]
                anchor.href = url;
                anchor.setAttribute("download", fileName);
                anchor.className = "download-js-link";
                anchor.innerHTML = "downloading...";
                anchor.style.display = "none";
                document.body.appendChild(anchor);
                setTimeout(function() {
                    anchor.click();
                    document.body.removeChild(anchor);
                    if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
                }, 66);
                return true;
            }

            // handle non-a[download] safari as best we can:
            if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
                url=url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
                if(!window.open(url)){ // popup blocked, offer direct download:
                    if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
                }
                return true;
            }

            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);

            if(!winMode){ // force a mime that will download:
                url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src=url;
            setTimeout(function(){ document.body.removeChild(f); }, 333);

        }//end saver




        if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
        }

        if(self.URL){ // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
        }else{
            // handle non-Blob()+non-URL browsers:
            if(typeof blob === "string" || blob.constructor===toString ){
                try{
                    return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
                }catch(y){
                    return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
                }
            }

            // Blob but not URL support:
            reader=new FileReader();
            reader.onload=function(e){
                saver(this.result);
            };
            reader.readAsDataURL(blob);
        }
        return true;
    }; /* end download() */
}));

(function () {

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
    
    if (typeof jQuery == 'undefined') {
        alert('[Facebook HD Video Downloader]\n\nYour greasemonkey or tampermonkey is too old. Please update.');
        return;
    }

    jQuery('head').append('<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">');

var css = "\
.dl {\
    display: inline-block;\
    width: 1em;\
    height: 1em;\
}\
.dl_container {\
    z-index: 9999;\
    position: relative;\
    float: right;\
    margin: 5px 5px 0 0;\
    padding: 2px 4px 2px 4px;\
    background: white;\
    border-radius: 4px;\
    opacity: 0.3;\
    transition: opacity .25s ease-in-out;\
    -moz-transition: opacity .25s ease-in-out;\
    -webkit-transition: opacity .25s ease-in-out;\
    color: black !important;\
    text-decoration: none;\
}\
.dl_container:hover {\
    opacity: 1;\
    text-decoration: none;\
}\
";

    jQuery('head').append('<style type="text/css">' + css + '</style>');

    // add svg icon download definition
    // jQuery('body').prepend('<symbol id="icon-cloud-download" viewBox="0 0 32 32">'
    //     + '<path class="path1" d="M27.844 11.252c-0.101-4.022-3.389-7.252-7.433-7.252-2.369 0-4.477 1.109-5.839 2.835-0.764-0.987-1.959-1.624-3.303-1.624-2.307 0-4.176 1.871-4.176 4.179 0 0.201 0.015 0.399 0.043 0.592-0.351-0.063-0.711-0.098-1.080-0.098-3.344-0-6.054 2.712-6.054 6.058s2.71 6.058 6.054 6.058h2.868l7.078 7.328 7.078-7.328 3.484-0c3.004-0.006 5.438-2.444 5.438-5.451 0-2.565-1.771-4.716-4.156-5.296zM16 26l-6-6h4v-6h4v6h4l-6 6z"></path>'
    //     +'</symbol>');

    var iconDownload = jQuery('<div/>');
    // // iconDownload.attr('src', 'https://cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/svgs/fi-download.svg');
    // iconDownload.css('background-color', 'white');
    // iconDownload.css('-webkit-mask-image', 'url(//cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/svgs/fi-download.svg)');
    // iconDownload.css('mask-image', 'url(//cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/svgs/fi-download.svg)');

    iconDownload = jQuery('<i class="fa fa-download dl"></i>');
    // iconDownload.css('display', 'inline-block');
    // iconDownload.css('width', '1em');
    // iconDownload.css('height', '1em');

     // src="" style="display: inline-block; width: 1em; height: 1em; stroke-width: 0; stroke: currentColor; fill: currentColor;">');
    
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

        /*
         * NOTE: Don't use jquery on <video>, it will broke them.
         */

        // Get all the <embed> elements
        var videoElements = document.querySelectorAll('video');
        var embedElements = document.querySelectorAll('embed[flashvars]');

        // Flag if we found the video url or not
        var found = false;

        for (var i = 0; i < videoElements.length; i++) {

            var embed = videoElements[i].querySelectorAll('embed[flashvars]');

            if (embed.length === 0) {
                continue;
            }

            embed = embed[0];

            // Get the flashvars attribute and decode it
            var flashvars = decodeURIComponent(embed.getAttribute('flashvars'));

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

                // thank css style from fork of nhtera.
                var link = jQuery('<a/>');
                link.addClass('dl_container');
                link.addClass('fbPhotosPhotoActionsItem');
                link.addClass('fb_download_link_ethaizone');
                link.attr('fb_download_link_ethaizone');
                link.append(iconDownload[0].outerHTML);
                link.append('&nbsp;');
                //var sidebar = document.getElementById('fbPhotoPageActions');

                // High Def
                if (video_data.hd_src)
                {
                    console.log(iconDownload.html());
                    // var hd_link = document.createElement('a');
                    // hd_link.href = video_data.hd_src;
                    // hd_link.onclick = "window.open('"+ video_data.hd_src +"');";
                    // hd_link.innerHTML = 'Download (HD)';
                    // hd_link.className = 'fbPhotosPhotoActionsItem fb_download_link_ethaizone';
                    link.append('<span class="status">Download (HD)</span>');
                    // link.attr('href',  video_data.hd_src);
                    // link.attr('download',  title + '_hd.mp4');
                    link.on('click', function(){
                        if (link.data('dl') == true) {
                            alert('It\'s downloading. Please wait.');
                            return;
                        }
                        link.find('.status').text('Downloading...');
                        alert('Download in backgrond. Please wait a minute...');
                        link.data('dl', true);
                        var x=new XMLHttpRequest();
                            x.open("GET", video_data.hd_src, true);
                            x.responseType = 'blob';
                            x.onload=function(e){
                                link.data('dl', false);
                                link.find('.status').text('Download (HD)');
                                download(x.response, title + '_hd.mp4', x.response.type );
                            };
                            x.send();
                        // download(video_data.hd_src, title + '_hd.mp4');
                    });
                    insertAfter(link[0], videoElements[i]);
                } else if (video_data.sd_src)
                {
                // Low Def
                    // var sd_link = document.createElement('a');
                    sd_link.href = video_data.sd_src;
                    // sd_link.onclick = "window.open('"+ video_data.sd_src +"');";
                    // sd_link.innerHTML = 'Download (SD)';
                    // sd_link.className = 'fbPhotosPhotoActionsItem fb_download_link_ethaizone';
                    link.append('Download (SD)');
                    // link.attr('href',  video_data.sd_src);
                    // link.attr('download',  title + '_sd.mp4');
                    link.on('click', function(){
                        if (link.data('dl') == true) {
                            alert('It\'s downloading. Please wait.');
                            return;
                        }
                        link.find('.status').text('Downloading...');
                        alert('Download in backgrond. Please wait a minute...');
                        link.data('dl', true);
                        var x=new XMLHttpRequest();
                            x.open("GET", video_data.sd_src, true);
                            x.responseType = 'blob';
                            x.onload=function(e){
                                link.data('dl', false);
                                link.find('.status').text('Download (SD)');
                                download(x.response, title + '_sd.mp4', x.response.type );
                            };
                            x.send();
                        // download(video_data.sd_src, title + '_hd.mp4');
                    });
                    // sd_link.download = title + '_sd.mp4';
                    insertAfter(link[0], videoElements[i]);
                }

                found = true;
            } // end if

        } // end loop

        // if (!found && counter > 20) {            
        //     var not_found = document.createElement('span');
        //     not_found.innerHTML = 'No download link :(';
        //     base.appendChild(not_found);
        // }
        
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