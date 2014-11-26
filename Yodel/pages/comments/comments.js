/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * pages/comments/comments.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var lang = WinJS.Resources;
    var nav = WinJS.Navigation;
    var appbar = document.getElementById("appbar").winControl;

    WinJS.UI.Pages.define("/pages/comments/comments.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, options) {
            //this.method = nav.state.method;
            var yak = nav.state.yak;

            var feed = new Yodel.feed();
            feed.load("comments", "yak_comments", {
                "yak": yak
            });

            if (nav.state.can_submit === false) {
                $("#yak_comments, #yak_detail").addClass("no_submit");
                $(".comments_reply").text(lang.getString("comments_read-only").value);
            }
            else {
                $(".comments_reply").click(Yodel.to_reply);
            }

            appbar.disabled = true;
            
        },
        unload: function () {
            Yodel.last_index.comments = document.getElementById("yak_comments").scrollTop;
        }
    });
})();