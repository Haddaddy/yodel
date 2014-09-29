(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;

    function load_comments(message_id, yak_index) {
        $("#comments_progress").css("display", "inline");

        var yakker = new Yakker(appData.roamingSettings.values["yakker_id"]);

        yakker.update_location(new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"], appData.localSettings.values["gl_accuracy"]));

        var datasource = Yodel.nearby_last;
        var promise = yakker.get_comments(message_id);
        promise.then(function (response) {
            response.content.readAsStringAsync().then(function (res) {
                var comments = JSON.parse(res);
                console.log(comments);
                var comments_proc = yakker.parse_comments(comments, message_id);
                var comments_list = [];
                for (var com in comments_proc) {
                    com = comments_proc[com];

                    com.upvote = "yak_up";
                    com.downvote = "yak_down";
                    switch (com.liked) {
                        case 1:
                            com.upvote = "yak_up yak_voted";
                            break;
                        case -1:
                            com.downvote = "yak_down yak_voted";
                            break;
                    }

                    comments_list.push(com);
                }

                var yak_comments = new WinJS.Binding.List(comments_list);
                var ny_listview = document.getElementById("yak_comments");
                ny_listview.winControl.itemDataSource = yak_comments.dataSource;

                $(ny_listview).on("click", ".yak_up", Yodel.vote.bind({ client: yakker, type: "comment", vote: "up" }));
                $(ny_listview).on("click", ".yak_down", Yodel.vote.bind({ client: yakker, type: "comment", vote: "down" }));

                $("#comments_progress").css("display", "none");
            });
        });

        //Microsoft.Maps.loadModule("Microsoft.Maps.Map", {
        //    callback: function () {
        //        var map = new Microsoft.Maps.Map(document.getElementById("map"), {
        //            credentials: appData.localSettings.values["maps_appid"],
        //            center: new Microsoft.Maps.Location(datasource[yak_index].latitude, datasource[yak_index].longitude),
        //            mapTypeId: Microsoft.Maps.MapTypeId.road,
        //            zoom: 9
        //        });
        //    }
        //});
    }

    WinJS.Namespace.define("Yodel", {
        load_comments: load_comments
    });

    WinJS.UI.Pages.define("/pages/comments/comments.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        unload: function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = false;
        }
    });
})();