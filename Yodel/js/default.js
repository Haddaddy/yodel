// For an introduction to the Pivot template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392284
(function () {
    "use strict";

    var activation = Windows.ApplicationModel.Activation;
    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    var sched = WinJS.Utilities.Scheduler;
    var ui = WinJS.UI;
    var appData = Windows.Storage.ApplicationData.current;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            //if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

                var loc = new Windows.Devices.Geolocation.Geolocator();

                if (loc != null) {
                    console.log("starting geoloc");
                    loc.getGeopositionAsync().then(function (pos) {
                        console.log("geoloc returned");
                        appData.localSettings.values["gl_lat"] = pos.coordinate.point.position.latitude.toFixed(6);
                        appData.localSettings.values["gl_long"] = pos.coordinate.point.position.longitude.toFixed(6);
                        appData.localSettings.values["gl_accuracy"] = pos.coordinate.accuracy;

                        if (appData.roamingSettings.values["yakker_id"].length != 32) {
                            var yakker = new Yakker(null, new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
                            var user_id = yakker.gen_id();
                            console.log("Registering new user with id " + user_id);
                            yakker.register_id_new(user_id).then(function (response) {
                                console.log(response);
                                if (response.isSuccessStatusCode) {
                                    Windows.Storage.ApplicationData.current.roamingSettings.values["yakker_id"] = user_id;
                                    setTimeout(function () {
                                        var feed = new Yodel.feed;
                                        feed.load("nearby");
                                    }, 2000);
                                }
                            });
                        }
                        else {
                            var feed = new Yodel.feed;
                            feed.load("nearby");
                        }
                    });
                }
            //} else {
            //    // TODO: This application has been reactivated from suspension.
            //    // Restore application state here.
            //}

            hookUpBackButtonGlobalEventHandlers();
            nav.history = app.sessionState.history || {};
            nav.history.current.initialPlaceholder = true;

            // Optimize the load of the application and while the splash screen is shown, execute high priority scheduled work.
            ui.disableAnimations();
            var p = ui.processAll().then(function () {
                return nav.navigate(nav.location || Application.navigator.home, nav.state);
            }).then(function () {
                return sched.requestDrain(sched.Priority.aboveNormal + 1);
            }).then(function () {
                ui.enableAnimations();
            });

            args.setPromise(p);
        }
    });

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    function hookUpBackButtonGlobalEventHandlers() {
        // Subscribes to global events on the window object
        window.addEventListener('keyup', backButtonGlobalKeyUpHandler, false)
    }

    // CONSTANTS
    var KEY_LEFT = "Left";
    var KEY_BROWSER_BACK = "BrowserBack";
    var MOUSE_BACK_BUTTON = 3;

    function backButtonGlobalKeyUpHandler(event) {
        // Navigates back when (alt + left) or BrowserBack keys are released.
        if ((event.key === KEY_LEFT && event.altKey && !event.shiftKey && !event.ctrlKey) || (event.key === KEY_BROWSER_BACK)) {
            nav.back();
        }
    }

    app.start();
})();
