/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * pages/feed/feed.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var appbar = document.getElementById("appbar").winControl;

    WinJS.UI.Pages.define("/pages/feed/feed.html", {
        processed: function (element) {
            $("span.pagetitle").text(nav.state.title);

            return WinJS.Resources.processAll(element);
        },
        ready: function (element, options) {
            this.method = nav.state.method;

            var feed = new Yodel.feed();
            feed.load(this.method, "yak_feed").done(function () {
                var ptr = new Yodel.UI.PTR();
                ptr.init();
            });

            if (!nav.state.can_submit) {
                $("#yak_feed").addClass("no_submit");
            }

            appbar.disabled = true;
        },
        unload: function () {
            Yodel.last_index[this.method] = document.getElementById("yak_feed").scrollTop;
        }
    });
})();
