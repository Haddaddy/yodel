/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * js/pivot_init.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    WinJS.Namespace.define("Yodel", {
        pivot_init: function () {
            WinJS.Navigation.state = { method: "nearby", can_submit: true };

            function init_lists() {
                //var peek_pivot = document.getElementById("peek_pivot");
                var peek_pivot_in = document.getElementById("peek_pivot_in");
                //var peek_pivot_out = document.getElementById("peek_pivot_out");

                if (!peek_pivot_in || !("winControl" in peek_pivot_in) || peek_pivot_in.winControl.itemDataSource.list.length == 0) {
                    WinJS.Utilities.markSupportedForProcessing(Yodel.to_peek_feed);

                    var peek_list_json = Yodel.handle.get_peek_locations(Yodel.data.pivot);
                    Yodel.data.peek_pivot = new WinJS.Binding.List(peek_list_json);

                    Yodel.bind_options(peek_pivot_in, {
                        itemDataSource: "Yodel.data.peek_pivot.dataSource",
                        oniteminvoked: "Yodel.to_peek_feed"
                    });
                }

                var me_pivot = document.getElementById("me_pivot");
                var me_list = new WinJS.Binding.List([
                    { "title": "Yakarma", "value": Yodel.data.pivot.yakarma },
                    { "title": "My Recent Yaks", "link": "my_recent_yaks", "value": "" },
                    { "title": "My Recent Replies", "link": "my_recent_replies", "value": "" },
                    { "title": "My Top Yaks", "link": "my_top_yaks", "value": "" }
                ]);
                WinJS.Utilities.markSupportedForProcessing(Yodel.to_me_feed);

                Yodel.data.me_pivot = me_list;

                Yodel.bind_options(me_pivot, {
                    itemDataSource: "Yodel.data.me_pivot.dataSource",
                    oniteminvoked: "Yodel.to_me_feed"
                });
            }

            var feed = new Yodel.feed();
            var promise = feed.load("nearby", "nearby_yaks");
            if ("pivot" in Yodel.data && Yodel.data.pivot) {
                promise.done(function () {
                    var ptr = new Yodel.UI.PTR();
                    ptr.init();
                });

                init_lists();
            }
            else {
                promise.done(function () {
                    var ptr = new Yodel.UI.PTR();
                    ptr.init();

                    init_lists();
                });
            }
        }
    });

})();
