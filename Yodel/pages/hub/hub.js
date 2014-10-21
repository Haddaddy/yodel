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
            }

            if (nav.history.forwardStack.length > 0) {
                Yodel.pivot_init(Yodel.data.pivot, true, true, true);
                switch(nav.history.forwardStack.slice(-1)[0].location) {
                    case "/pages/peek/peek.html":
                        hub.selectedIndex = 1;
                        setImmediate(function () {
                            var peek_pivot = document.getElementById("peek_pivot").winControl;
                            peek_pivot.ensureVisible = Yodel.peek_pivot_last_index;
                            peek_pivot.indexOfFirstVisible = Yodel.peek_pivot_last_index;
                        });
                        break;
                }
            }
        },

        unload: function () {
            Yodel.nearby_last_index = $("#nearby_yaks").scrollTop();
            //Yodel.pivot_last_index = element.querySelector(".hub").winControl.selectedIndex;
        },

        updateLayout: function (element) {
            // TODO: Respond to changes in layout.
        }
    });
})();
