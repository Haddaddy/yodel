(function () {
    "use strict";

    var ControlConstructor = WinJS.UI.Pages.define("/pages/hub/nearby.html", {
        // This function is called after the page control contents 
        // have been loaded, controls have been activated, and 
        // the resulting elements have been parented to the DOM. 
        ready: function (element, options) {
            options = options || {};
            
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
                            for (var yak in yaks_proc) {
                                yak = yaks_proc[yak];
                                var comments = "";
                                if (yak.comments > 0) {
                                    comments = "<span class='yak_comments'>" + yak.comments;
                                    if (yak.comments > 1) {
                                        comments += " replies</span>";
                                    }
                                    else {
                                        comments += " reply</span>";
                                    }
                                }
                                var handle = "";
                                if (yak.handle) {
                                    handle = "<span class='yak_handle'>" + yak.handle + "</span>";
                                }
                                var upvote = "";
                                var downvote = "";
                                switch (yak.liked) {
                                    case 1:
                                        upvote = "yak_voted";
                                        break;
                                    case -1:
                                        downvote = "yak_voted";
                                        break;
                                }
                                $(".section1page section").append(" \
                                    <div class='yak_container' data-mid='" +  yak.message_id + "'>\
                                        <p class='yak_text'>" + handle + yak.message + "</p> \
                                        <span class='yak_time'>" + moment.unix(yak.time).twitter() + "</span> \
                                        " + comments + " \
                                        <div class='yak_vote'> \
                                            <span class='yak_up " + upvote + "'>&#xE018;</span> \
                                            <span class='yak_votecount'>" + yak.likes + "</span> \
                                            <span class='yak_down " + downvote + "'>&#xE019;</span> \
                                        </div> \
                                        <div class='clear'></div> \
                                    </div>"
                                );
                            }
                            $(".section1page section").on("click", ".yak_up", yak_vote.bind({vote: "up"}));
                            $(".section1page section").on("click", ".yak_down", yak_vote.bind({vote: "down"}));
                            function yak_vote(event) {
                                var target = $(event.target);
                                if (!target.hasClass("yak_voted")) {
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
    });

    // The following lines expose this control constructor as a global. 
    // This lets you use the control as a declarative control inside the 
    // data-win-control attribute. 

    WinJS.Namespace.define("HubApps_SectionControls", {
        Section1Control: ControlConstructor
    });
})();