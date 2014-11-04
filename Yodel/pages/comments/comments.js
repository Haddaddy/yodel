(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var appbar = document.getElementById("appbar").winControl;

    WinJS.UI.Pages.define("/pages/comments/comments.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, options) {
            this.method = nav.state.method;
            var yak = nav.state.yak;

            var feed = new Yodel.feed;
            feed.load("comments", "yak_comments", {
                "yak": yak
            });

            if (nav.state.can_submit === false) {
                $("#yak_comments, #yak_detail").addClass("no_submit");
                //$(".comments_reply").text("this feed is read-only");
            }
            else {
                //$(".comments_reply").click(Yodel.to_reply);
            }

            appbar.disabled = true;
            
        },
        unload: function () {
            Yodel.last_index.comments = document.getElementById("yak_comments").scrollTop;
        }
    });
})();