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
            var appbar = document.getElementById("appbar").winControl;

            appbar.disabled = false;
            $(".pagetitle").text(hub.selectedItem.header);
            $(".icons").on("click", "a", function (event) {
                var target = $(event.target);
                var index = target.data("index");
                if (hub.selectedIndex != parseInt(index)) {
                    hub.selectedIndex = index;
                }
            });

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
                $(".icons a[data-index=" + args.detail.index + "]").addClass("selected").siblings().removeClass("selected");

                var peek_pivot = document.getElementById("peek_pivot");

                if (peek_pivot.winControl && peek_pivot.winControl.zoomedOut) {
                    peek_pivot.winControl.zoomedOut = false;
                }

                switch (args.detail.index) {
                    case 0:
                        appbar.showOnlyCommands(["post", "sortby", "settings"]);
                        break;
                    case 1:
                        var peek_pivot_in = document.getElementById("peek_pivot_in");
                        if (!peek_pivot_in.winControl) {
                            $(peek_pivot_in).attr("data-win-options", function (i, val) {
                                return val.slice(0, -1) + ",indexOfFirstVisible: Yodel.peek_pivot_last_index }";
                            });
                        }
                        else {
                            peek_pivot_in.winControl.indexOfFirstVisible = Yodel.last_index.peek_pivot;
                        }
                    // Intentional fallthrough
                    case 2:
                        appbar.showOnlyCommands(["settings"]);
                }
            }

            if (nav.history.forwardStack.length > 0) {
                hub.selectedIndex = Yodel.last_index.pivot;
                Yodel.pivot_init();
            }
        },

        unload: function () {
            Yodel.last_index.nearby = $("#nearby_yaks").scrollTop();
            Yodel.last_index.pivot = $(".hub")[0].winControl.selectedIndex;
        },

        updateLayout: function (element) {
            // TODO: Respond to changes in layout.
        }
    });
})();
