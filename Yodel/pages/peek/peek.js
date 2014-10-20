(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.UI.Pages.define("/pages/peek/peek.html", {
        processed: function (element) {
            $("span.pagetitle").text(nav.state.name);

            return WinJS.Resources.processAll(element);
        },
        ready: function(element, options) {
            //if (nav.history.forwardStack.length > 0) {
            //    var last_yaks = Yodel.nearby_last;
            //    var feed = new Yodel.feed;
            //    if (last_yaks) {
            //        feed.load("nearby", { "prev": last_yaks });
            //    }
            //    else {
            //        feed.load("peek");
            //    }
            //}
        },
        unload: function () {
            //var appbar = $("#appbar")[0].winControl;
            //appbar.disabled = false;
        }
    });
})();