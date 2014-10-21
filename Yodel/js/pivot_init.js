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
                var peek_pivot_in = document.getElementById("peek_pivot_in");
                var peek_pivot_out = document.getElementById("peek_pivot_out");

                var yakker = new Yakker(appData.roamingSettings.values["yakker_id"], new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
                var peek_list = new WinJS.Binding.List(yakker.get_peek_locations(json));

                // Sorts the groups.
                function compareGroups(leftKey, rightKey) {
                    return leftKey.charCodeAt(0) - rightKey.charCodeAt(0);
                }

                // Returns the group key that an item belongs to.
                function getGroupKey(dataItem) {
                    return dataItem.name.toUpperCase().charAt(0);
                }

                // Returns the title for a group.
                function getGroupData(dataItem) {
                    return {
                        name: dataItem.name.toUpperCase().charAt(0)
                    };
                }

                var peek_list_grouped = peek_list.createGrouped(getGroupKey, getGroupData, compareGroups);
                Yodel.data.peek_pivot = peek_list_grouped;

                if (!peek_pivot.winControl) {
                    $(peek_pivot_in).attr("data-win-options", function (i, val) {
                        return val.slice(0, -1) + ",itemDataSource:Yodel.data.peek_pivot.dataSource, groupDataSource:Yodel.data.peek_pivot.groups.dataSource }";
                    });
                    $(peek_pivot_out).attr("data-win-options", function (i, val) {
                        return val.slice(0, -1) + ",itemDataSource:Yodel.data.peek_pivot.groups.dataSource }";
                    });
                }
                else {
                    peek_pivot_in.winControl.itemDataSource = peek_list_grouped.dataSource;
                    peek_pivot_in.winControl.groupDataSource = peek_list_grouped.groups.dataSource;
                    peek_pivot_out.winControl.itemDataSource = peek_list_grouped.groups.dataSource;
                }

                peek_pivot_in.addEventListener("iteminvoked", Yodel.to_peek_feed);

                // If SemanticZoom is zoomed out, hijack back button event and zoom in
                WinJS.Application.addEventListener("backclick", function (event) {
                    if (peek_pivot.winControl && peek_pivot.winControl.zoomedOut) {
                        peek_pivot.winControl.zoomedOut = false;
                        return true;
                    }
                    else {
                        return false;
                    }
                });
            }

            if (me) {
                var me_pivot = document.getElementById("me_pivot");
                var me_list = new WinJS.Binding.List([
                    { "title": "Yakarma", "value": json["yakarma"] },
                    //{ "title": "My Recent Yaks", "link": "recent_yaks", "value": "" },
                    //{ "title": "My Recent Replies", "link": "recent_replies", "value": "" },
                    //{ "title": "My Top Yaks", "link": "my_top_yaks", "value": "" }
                ]);

                Yodel.data.me_pivot = me_list;
                if (!me_pivot.winControl) {
                    $(me_pivot).attr("data-win-options", function (i, val) {
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
