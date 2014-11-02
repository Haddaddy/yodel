(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var appbar = document.getElementById("appbar").winControl;

    WinJS.UI.Pages.define("/pages/comments/comments.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, options) {
            if (nav.history.forwardStack.length > 0) {
                var message_id = nav.state.message_id;
                var yak = Yodel.data.yak_detail[0];
                var last_comments = Yodel.data.yak_comments;
                var feed = new Yodel.feed;
                if (last_comments) {
                    feed.load("comments", { "message_id": message_id, "yak": yak, "prev": last_comments });
                }
                else {
                    feed.load("comments", { "message_id": message_id, "yak": yak });
                }
            }

            appbar.disabled = true;
            document.querySelector(".comments_reply").addEventListener("click", Yodel.to_reply);
        }
    });
})();