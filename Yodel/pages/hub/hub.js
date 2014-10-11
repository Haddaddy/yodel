(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var session = WinJS.Application.sessionState;
    var util = WinJS.Utilities;

    WinJS.UI.Pages.define("/pages/hub/hub.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var hub = element.querySelector(".hub").winControl;
            $(".pagetitle").text(hub.selectedItem.header);

            hub.onheaderinvoked = function (args) {
                args.detail.section.onheaderinvoked(args);
            };
            hub.onloadingstatechanged = function (args) {
                if (args.srcElement === hub.element && args.detail.loadingState === "complete") {
                    hub.onloadingstatechanged = null;
                    hub.element.focus();
                }
            }
            hub.onselectionchanged = function (args) {
                $(".pagetitle").text(args.detail.item.header);
            }

            if (nav.history.forwardStack.length > 0) {
                var last_yaks = Yodel.nearby_last;
                var feed = new Yodel.feed;
                if (last_yaks) {
                    feed.load("nearby", { "prev": last_yaks });
                }
                else {
                    feed.load("nearby");
                }
            }
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
            Yodel.last_index = $("#nearby_yaks").scrollTop();
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        }
    });
})();
