(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.UI.Pages.define("/pages/peek/peek.html", {
        processed: function (element) {
            $("span.pagetitle").text(nav.state.name);

            return WinJS.Resources.processAll(element);
        },
        ready: function(element, options) {
            if (nav.history.forwardStack.length > 0) {
                var last_yaks = Yodel.peek_last;
                var feed = new Yodel.feed;
                if (last_yaks) {
                    feed.load("peek", { "prev": last_yaks, "peek_id": nav.state.id });
                }
                else {
                    feed.load("peek", { "peek_id": nav.state.id });
                }
            }
        },
        unload: function () {
            Yodel.peek_last_index = $("#peek_feed").scrollTop();
            //var appbar = $("#appbar")[0].winControl;
            //appbar.disabled = false;
        }
    });
})();