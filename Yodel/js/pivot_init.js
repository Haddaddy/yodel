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
                WinJS.Utilities.markSupportedForProcessing(Yodel.to_peek_feed);

                var peek_list_json = Yodel.handle.get_peek_locations(json);

                // Original grouped list
                var peek_list = new WinJS.Binding.List(peek_list_json);
                var peek_list_grouped = peek_list.createGrouped(getGroupKey, getGroupData, compareGroups);
                Yodel.data.peek_pivot = peek_list_grouped;

                // Sorts the groups.
                function compareGroups(leftKey, rightKey) {
                    return leftKey.toString().charAt(0).charCodeAt(0) - rightKey.toString().charAt(0).charCodeAt(0);
                }

                // Returns the group key that an item belongs to.
                function getGroupKey(dataItem) {
                    return dataItem.name.toString().charAt(0);
                }

                // Returns the title for a group.
                function getGroupData(dataItem) {
                    return {
                        name: dataItem.name.toString().charAt(0),
                        disabled: dataItem.disabled
                    }
                }

                if (peek_list_grouped.length > 30) {
                    // Full zoomed-out alphabet:
                    // https://gist.github.com/pimpreneil/4714483

                    /* We create the headers group */
                    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    var headers = [];
                    var curLetter = 0;

                    // We fill in the headers array with the letters repeated as many time as there are occurences of them in the array (to keep the ponderation)
                    peek_list_json.forEach(function (item) {
                        var letter = item.name.toString().charAt(0);
                        headers.push({ 'name': letter, 'disabled': 'semanticzoom_block' });
                        alphabet = alphabet.replace(letter, '');
                    });

                    // For all the letters that are not included in the array, we add them with a disabled attribute
                    for (var k = 0; k < alphabet.length; k++) {
                        headers.push({ 'name': alphabet.charAt(k), 'disabled': 'semanticzoom_block disabled' })
                    }

                    // Special grouped list for the headers
                    var headers = new WinJS.Binding.List(headers);
                    var headers_grouped = headers.createGrouped(getGroupKey, getGroupData, compareGroups);
                    Yodel.data.peek_pivot_headers = headers_grouped;

                    // We tweak the groups header's parameters not to take into account the empty items
                    // To do so, we set the empty groups with a group size of 0 (instead of 1) and we set their firtItemIndex to the previous letter's one
                    for (var k = 'A'.charCodeAt(0) ; k <= 'Z'.charCodeAt(0) ; k++) {
                        var letter = String.fromCharCode(k);
                        var originalListItem = peek_list_grouped.groups._groupItems[letter];
                        if (originalListItem) {
                            headers_grouped.groups._groupItems[letter].firstItemIndexHint = originalListItem.firstItemIndexHint;
                        } else {
                            headers_grouped.groups._groupItems[letter].groupSize = 0;
                            if (k != 'A'.charCodeAt(0)) {
                                var previousLetter = String.fromCharCode(k - 1);
                                var originalPreviousLetter = peek_list_grouped.groups._groupItems[previousLetter];
                                if (originalPreviousLetter) {
                                    headers_grouped.groups._groupItems[letter].firstItemIndexHint = originalPreviousLetter.firstItemIndexHint;
                                    headers_grouped.groups._groupItems[letter].firstItemKey = originalPreviousLetter.firstItemKey;
                                } else {
                                    headers_grouped.groups._groupItems[letter].firstItemIndexHint = headers_grouped.groups._groupItems[previousLetter].firstItemIndexHint;
                                    headers_grouped.groups._groupItems[letter].firstItemKey = headers_grouped.groups._groupItems[previousLetter].firstItemKey;
                                }
                            }
                        }
                    }

                    Yodel.bind_list(peek_pivot_in, {
                        itemDataSource: "Yodel.data.peek_pivot.dataSource",
                        groupDataSource: "Yodel.data.peek_pivot.groups.dataSource",
                        oniteminvoked: "Yodel.to_peek_feed"
                    });

                    Yodel.bind_list(peek_pivot_out, {
                        itemDataSource: "Yodel.data.peek_pivot_headers.groups.dataSource"
                    });

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
                else {
                    Yodel.bind_list(peek_pivot_in, {
                        itemDataSource: "Yodel.data.peek_pivot.dataSource",
                        oniteminvoked: "Yodel.to_peek_feed"
                    });
                }
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

                Yodel.bind_list(me_pivot, {
                    itemDataSource: "Yodel.data.me_pivot.dataSource"
                });
            } 
        }
    });
})();
