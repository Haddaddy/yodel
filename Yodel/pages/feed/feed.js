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
            feed.load(this.method, "yak_feed");

            if (!nav.state.can_submit) {
                $("#yak_feed").addClass("no_submit");
            }
        },
        unload: function () {
            Yodel.last_index[this.method] = document.getElementById("yak_feed").scrollTop;
        }
    });
})();