(function () {
    "use strict";

    var ControlConstructor = WinJS.UI.Pages.define("/pages/hub/nearby.html", {
        // This function is called after the page control contents 
        // have been loaded, controls have been activated, and 
        // the resulting elements have been parented to the DOM. 
        ready: function (element, options) {
            options = options || {};
            
            var yakker = new Yakker("BD8947C1AD926F2C9754966F6CCFA88E");
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
                                $(".section1page section").append(" \
                                    <div class='yak_container'>\
                                        <p class='yak_text'>" + yak.message + "</p> \
                                        <span class='yak_time'>" + moment.unix(yak.time).twitter() + "</span> \
                                        " + comments + " \
                                        <div class='yak_vote'> \
                                            <span class='yak_up'>&#xE018;</span> \
                                            <span class='yak_votecount'>" + yak.likes + "</span> \
                                            <span class='yak_down'>&#xE019;</span> \
                                        </div> \
                                        <div class='clear'></div> \
                                    </div>"
                                );
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