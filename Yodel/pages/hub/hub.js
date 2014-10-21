(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var session = WinJS.Application.sessionState;
    var util = WinJS.Utilities;

    WinJS.UI.Pages.define("/pages/hub/hub.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },

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
                var appbar = document.getElementById("appbar").winControl;
                var peek_pivot = document.getElementById("peek_pivot");

                if (peek_pivot.winControl && peek_pivot.winControl.zoomedOut) {
                    peek_pivot.winControl.zoomedOut = false;
                }

                switch (args.detail.index) {
                    case 0:
                        appbar.closedDisplayMode = "compact";
                        break;
                    default:
                        appbar.closedDisplayMode = "minimal";
                }
            }

            if (nav.history.forwardStack.length > 0) {
                hub.selectedIndex = Yodel.pivot_last_index;
                Yodel.pivot_init(Yodel.data.pivot, true, true, true);
            }
        },

        unload: function () {
            Yodel.nearby_last_index = $("#nearby_yaks").scrollTop();
            Yodel.pivot_last_index = $(".hub")[0].winControl.selectedIndex;
        },

        updateLayout: function (element) {
            // TODO: Respond to changes in layout.
        }
    });
})();
