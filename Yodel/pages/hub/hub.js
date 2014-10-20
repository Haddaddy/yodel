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
                switch (args.detail.index) {
                    case 1:
                        var peek_pivot = document.getElementById("peek_pivot");
                        if (!peek_pivot.winControl) {
                            console.log("REFRESHHHHHHHHH");
                            var yakker = new Yakker(appData.roamingSettings.values["yakker_id"], new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
                            var peek_list = new WinJS.Binding.List(yakker.get_peek_locations(Yodel.nearby_last_all));
                            setImmediate(function () {
                                peek_pivot.winControl.itemDataSource = peek_list.dataSource;
                                peek_pivot.addEventListener("iteminvoked", Yodel.to_peek_feed);
                            });
                        }
                        break;
                    case 2:
                        var me_pivot = document.getElementById("me_pivot");
                        if (!me_pivot.winControl) {
                            console.log("REFRESHHHHHHHHH");
                            var me_list = new WinJS.Binding.List([
                                { "title": "Yakarma", "value": Yodel.nearby_last_all["yakarma"] },
                                { "title": "My Recent Yaks", "link": "recent_yaks", "value": "" },
                                { "title": "My Recent Replies", "link": "recent_replies", "value": "" },
                                { "title": "My Top Yaks", "link": "my_top_yaks", "value": "" }
                            ]);
                            setImmediate(function () {
                                me_pivot.winControl.itemDataSource = me_list.dataSource;
                                //me_pivot.addEventListener("iteminvoked", Yodel.to_feed);
                            });
                        }
                        break;
                }
            }

            if (nav.history.forwardStack.length > 0) {
                switch(nav.history.forwardStack[0].location) {
                    case "/pages/comments/comments.html":
                        var last_yaks = Yodel.nearby_last;
                        var feed = new Yodel.feed;
                        if (last_yaks) {
                            feed.load("nearby", { "prev": last_yaks });
                        }
                        else {
                            feed.load("nearby");
                        }
                        break;
                    case "/pages/peek/peek.html":
                        hub.selectedIndex = 1;
                        setImmediate(function () {
                            document.getElementById("peek_pivot").winControl.scrollPosition = nav.history.forwardStack[0].state.scroll;
                        });
                        break;
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
