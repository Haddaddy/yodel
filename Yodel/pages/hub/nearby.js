(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;

    function nearby_yaks_load() {
        var yakker = new Yakker(appData.roamingSettings.values["yakker_id"]);
        console.log("Registered user with id " + yakker.id);

        yakker.update_location(new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"], appData.localSettings.values["gl_accuracy"]));

        var promise = yakker.get_yaks();
        promise.then(function (response) {
            response.content.readAsStringAsync().then(function (res) {
                var yaks = JSON.parse(res);
                console.log(yaks);
                var yaks_proc = yakker.parse_yaks(yaks);
                var yak_list = [];
                for (var yak in yaks_proc) {
                    yak = yaks_proc[yak];

                    if (yak.handle == null) {
                        yak.handle = "";
                    }

                    yak.replies = "";
                    if (yak.comments > 0) {
                        yak.replies = yak.comments;
                        if (yak.comments > 1) {
                            yak.replies += " replies";
                        }
                        else {
                            yak.replies += " reply";
                        }
                    }

                    yak.upvote = "yak_up";
                    yak.downvote = "yak_down";
                    switch (yak.liked) {
                        case 1:
                            yak.upvote = "yak_up yak_voted";
                            break;
                        case -1:
                            yak.downvote = "yak_down yak_voted";
                            break;
                    }

                    yak.time_pretty = moment.unix(yak.time).twitter();

                    yak_list.push(yak);
                }

                var nearby_yaks = new WinJS.Binding.List(yak_list);
                var ny_listview = document.getElementById("nearby_yaks").winControl;
                ny_listview.itemDataSource = nearby_yaks.dataSource;

                $("#nearby_yaks").on("click", ".yak_up", Yodel.vote.bind({ client: yakker, vote: "up" }));
                $("#nearby_yaks").on("click", ".yak_down", Yodel.vote.bind({ client: yakker, vote: "down" }));
            });
        });
    }

    WinJS.Namespace.define("Yodel", {
        load_nearby: nearby_yaks_load,
    });
})();