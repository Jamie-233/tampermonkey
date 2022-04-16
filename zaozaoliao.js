
// ==UserScript==
// @name         zzl
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.zaozao.run/video/*
// @require      https://cdn.staticfile.org/jquery/3.6.0/jquery.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const $ = window.$ || $;

    const oldReplaceState = history.replaceState;
    history.replaceState = function replaceState(...args) {
        const ret = oldReplaceState.apply(this, args);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    };

    class ZaoZaoLiao {
        constructor() {
            this.timer = null;
            this.interval = 1000;
            this.locker = false;
        }

        _addGlobalEvent() {
            window.addEventListener('locationchange', () => {
                console.log('location changed');
                this.handleLocationChange()
            });
        }

        _getLocker() {
            if (this.locker) {
                return false;
            }

            this.locker = true;
            return true;
        }

        _releaseLock() {
            this.locker = false;
        }

        handleLocationChange() {
            this.startDownload();
        }

        async downloadVideo() {
            const src = $('video source:first').attr('src');
            const file_name = $('h4:first').text().trim();
            const $link = document.createElement('a');

            console.log(`正在下载: ${file_name}`);

            const data = await fetch(src)
                .then(res => res.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    $link.href = url;
                    $link.download = `${file_name}.mp4`;
                    $link.style.display = 'none';

                    $('#root').append($link);
                    $link.click();

                    window.URL.revokeObjectURL(url);
                    return { file_name };
                })
                .catch(ex => {
                    throw new Error(`文件下载失败 ${ex}`);
                });

            return data;
        }

        async checkVideoLoadedStat() {
            return await new Promise(resolve => {
                this.timer = setInterval(() => {
                    const video_load_stat = $('video').length;
                    if (video_load_stat) {
                        $('video').attr('autoplay', false);
                        resolve(true);
                        clearInterval(this.timer);
                    }
                }, this.interval);
            });
        }

        async startDownload() {
            const video_loaded = await this.checkVideoLoadedStat();
            if (video_loaded) {
                if (!this._getLocker()) {
                    console.log('当前任务未下载完成...');
                    return;
                }
                const { file_name } = await this.downloadVideo();
                alert(`${file_name}下载完成`);
                this._releaseLock();
            }
        }

        initPage() {
            this._addGlobalEvent();
            this.startDownload();
        }
    }

    const url = location.href;
    if (url.indexOf('.zaozao.run/video/') > 0) {
        const zzl = new ZaoZaoLiao();
        zzl.initPage();
    }
})();
