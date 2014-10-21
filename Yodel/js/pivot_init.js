(function () {
    "use strict";

    WinJS.Namespace.define("Yodel", {
        pivot_init: function (json, nearby, peek, me) {
            WinJS.Namespace.define("Yodel.data", {
                pivot: {
                    featuredLocations: json.featuredLocations,
                    otherLocations: json.otherLocations,
                    yakarma: json.yakarma
                }
            });

            if (nearby) {
                var last_yaks = Yodel.data.nearby_yaks;
                var feed = new Yodel.feed;
                if (last_yaks) {
                    feed.load("nearby", { "prev": last_yaks });
                }
                else {
                    feed.load("nearby");
                }
            }

            if (peek) {
                var peek_pivot = document.getElementById("peek_pivot");
                var yakker = new Yakker(appData.roamingSettings.values["yakker_id"], new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
                var peek_list = new WinJS.Binding.List(yakker.get_peek_locations(json));

                Yodel.data.peek_pivot = peek_list;
                if (!peek_pivot.winControl) {
                    $("#peek_pivot").attr("data-win-options", function (i, val) {
                        return val.slice(0, -1) + ",itemDataSource:Yodel.data.peek_pivot.dataSource }";
                    });
                }
                else {
                    peek_pivot.winControl.itemDataSource = peek_list.dataSource;
                }
                setImmediate(function () {
                    peek_pivot.addEventListener("iteminvoked", Yodel.to_peek_feed);
                });
            }

            if (me) {
                var me_pivot = document.getElementById("me_pivot");
                var me_list = new WinJS.Binding.List([
                    { "title": "Yakarma", "value": json["yakarma"] },
                    { "title": "My Recent Yaks", "link": "recent_yaks", "value": "" },
                    { "title": "My Recent Replies", "link": "recent_replies", "value": "" },
                    { "title": "My Top Yaks", "link": "my_top_yaks", "value": "" }
                ]);

                Yodel.data.me_pivot = me_list;
                if (!me_pivot.winControl) {
                    $("#me_pivot").attr("data-win-options", function (i, val) {
                        return val.slice(0, -1) + ",itemDataSource:Yodel.data.me_pivot.dataSource }";
                    });
                }
                else {
                    me_pivot.winControl.itemDataSource = me_list.dataSource;
                }
            } 
        }
    });
})();
