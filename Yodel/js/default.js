/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * js/default.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var activation = Windows.ApplicationModel.Activation;
    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    var sched = WinJS.Utilities.Scheduler;
    var ui = WinJS.UI;
    var appData = Windows.Storage.ApplicationData.current;
    var lang = WinJS.Resources;

    function getStatusString(locStatus) {
        switch (locStatus) {
            case Windows.Devices.Geolocation.PositionStatus.ready:
                // Location data is available
                return lang.getString("msg_geolocation-ready").value;
                break;
            case Windows.Devices.Geolocation.PositionStatus.initializing:
                // This status indicates that a GPS is still acquiring a fix
                return lang.getString("msg_geolocation-init").value;
                break;
            case Windows.Devices.Geolocation.PositionStatus.noData:
                // No location data is currently available 
                return lang.getString("msg_geolocation-nodata").value;
                break;
            case Windows.Devices.Geolocation.PositionStatus.disabled:
                // The app doesn't have permission to access location,
                // either because location has been turned off.
                return lang.getString("msg_geolocation-disabled").value;
                break;
            case Windows.Devices.Geolocation.PositionStatus.notInitialized:
                // This status indicates that the app has not yet requested
                // location data by calling GetGeolocationAsync() or 
                // registering an event handler for the positionChanged event. 
                return lang.getString("msg_geolocation-noinit").value;
                break;
            case Windows.Devices.Geolocation.PositionStatus.notAvailable:
                // Location is not available on this version of Windows
                return lang.getString("msg_geolocation-unavailable").value;
                break;
            default:
                break;
        }
    }

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            Yodel.handle = new API.Yakker();

            WinJS.Namespace.define("Yodel.data");
            WinJS.Namespace.define("Yodel.last_index");

            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                ExtendedSplash.show(args.detail.splashScreen);

                var loc = null;

                if (loc == null) {
                    loc = new Windows.Devices.Geolocation.Geolocator();
                }
                if (loc != null) {
                    console.log("starting geoloc");
                    loc.getGeopositionAsync().then(function (pos) {
                        console.log("geoloc returned");
                        appData.localSettings.values.gl_lat = pos.coordinate.point.position.latitude.toFixed(7);
                        appData.localSettings.values.gl_long = pos.coordinate.point.position.longitude.toFixed(7);
                        appData.localSettings.values.gl_accuracy = pos.coordinate.accuracy;

                        Yodel.handle.update_location(new API.Location(appData.localSettings.values.gl_lat, appData.localSettings.values.gl_long));

                        if (typeof appData.roamingSettings.values.yakker_id == "undefined" || appData.roamingSettings.values.yakker_id.length < 32) {
                            var user_id = Yodel.handle.gen_id();
                            console.log("Registering new user with id " + user_id);

                            ExtendedSplash.showProgress();

                            Yodel.handle.register_id_new(user_id).then(function (response) {
                                console.log(response);
                                if (response.isSuccessStatusCode) {
                                    appData.roamingSettings.values.yakker_id = user_id;
                                    appData.roamingSettings.values.registration_date = moment().format();
                                    Yodel.handle.id = user_id;
                                    setTimeout(function () {
                                        ExtendedSplash.remove();
                                        Yodel.pivot_init();
                                    }, 2000);
                                }
                                else {
                                    Yodel.popup_error("HTTP Error " + response.statusCode + " " + response.reasonPhrase, lang.getString("msg_register-user-fail").value);
                                }

                                return response.content.readAsStringAsync();
                            }).then(function (content) {
                                console.log(content);
                            });
                        }
                        else {
                            ExtendedSplash.remove();

                            Yodel.handle.id = appData.roamingSettings.values.yakker_id;
                            Yodel.pivot_init();
                        }
                    },
                    function (error) {
                        var buttons = {};
                        buttons[lang.getString("popup_okay").value] = function () {
                            window.close();
                        };

                        Yodel.popup_error(getStatusString(loc.locationStatus), lang.getString("msg_geolocation-fail").value, buttons);
                    });
                }
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
                //Yodel.data = app.sessionState.feed_cache;
                //Yodel.last_index = app.sessionState.last_index;

                Yodel.handle.id = appData.roamingSettings.values.yakker_id;
                Yodel.handle.update_location(new API.Location(appData.localSettings.values.gl_lat, appData.localSettings.values.gl_long));

                if (app.sessionState.history.current.location == "/pages/hub/hub.html") {
                    Yodel.pivot_init();
                }
            }

            hookUpBackButtonGlobalEventHandlers();
            nav.history = app.sessionState.history || {};
            nav.history.current.initialPlaceholder = true;

            // Optimize the load of the application and while the splash screen is shown, execute high priority scheduled work.
            ui.disableAnimations();
            var p = ui.processAll().then(function () {
                return lang.processAll(document);
            }).then(function () {
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
        //app.sessionState.feed_cache = Yodel.data;
        //app.sessionState.last_index = Yodel.last_index;
    };

    function hookUpBackButtonGlobalEventHandlers() {
        // Subscribes to global events on the window object
        window.addEventListener('keyup', backButtonGlobalKeyUpHandler, false);
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
