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
            }

            var yakker_id = Windows.Storage.ApplicationData.current.roamingSettings.values["yakker_id"];
            var yakker = new Yakker(yakker_id);
            console.log("Registered user with id " + yakker.id);

            var loc = null;
            if (loc == null) {
                loc = new Windows.Devices.Geolocation.Geolocator();
            }
            if (loc != null) {
                loc.getGeopositionAsync().then(function (pos) {
                    yakker.update_location(new Location(pos.coordinate.point.position.latitude, pos.coordinate.point.position.longitude, pos.coordinate.accuracy));

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

                            $("#nearby_yaks").on("click", ".yak_up", yak_vote.bind({ vote: "up" }));
                            $("#nearby_yaks").on("click", ".yak_down", yak_vote.bind({ vote: "down" }));
                            function yak_vote(event) {
                                var target = $(event.target);
                                var sibling = target.siblings(".yak_voted");
                                if (!target.hasClass("yak_voted") && !sibling.length) {
                                    target.addClass("yak_voted");
                                    var vote_count_ele = target.siblings(".yak_votecount");
                                    var orig_vote_count = parseInt(vote_count_ele.text());
                                    var message_id = target.parents(".yak_container").data("mid");
                                    if (this.vote == "up") {
                                        var promise = yakker.upvote_yak(message_id);
                                        vote_count_ele.text(orig_vote_count + 1);
                                    }
                                    else if (this.vote == "down") {
                                        var promise = yakker.downvote_yak(message_id);
                                        vote_count_ele.text(orig_vote_count - 1);
                                    }
                                    if (typeof promise != undefined) {
                                        promise.then(function (response) {
                                            console.log(response);
                                            if (!response.isSuccessStatusCode) {
                                                target.removeClass("yak_voted");
                                                vote_count_ele.text(orig_vote_count);
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    });
                });
            }
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        },
    });
})();