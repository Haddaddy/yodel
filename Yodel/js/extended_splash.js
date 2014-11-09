//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    // Displays the extended splash screen. Pass the splash screen object retrieved during activation.
    function show(splash) {
        var extendedSplashImage = document.getElementById("extendedSplashImage");

        // Position the extended splash screen image in the same location as the system splash screen image.
        extendedSplashImage.style.top = splash.imageLocation.y + "px";
        extendedSplashImage.style.left = splash.imageLocation.x + "px";
        extendedSplashImage.style.height = splash.imageLocation.height + "px";
        extendedSplashImage.style.width = splash.imageLocation.width + "px";

        // Once the extended splash screen is setup, apply the CSS style that will make the extended splash screen visible.
        var extendedSplashScreen = document.getElementById("extendedSplashScreen");
        WinJS.Utilities.removeClass(extendedSplashScreen, "hidden");

        Yodel.bind_options(document.getElementById("appbar"), {
            disabled: "true"
        });
    }

    function showProgress() {
        var extendedSplashProgress = document.getElementById("extendedSplashProgress");
        extendedSplashProgress.style.visibility = "visible";
    }

    // Checks whether the extended splash screen is visible and returns a boolean.
    function isVisible() {
        var extendedSplashScreen = document.getElementById("extendedSplashScreen");
        return !(WinJS.Utilities.hasClass(extendedSplashScreen, "hidden"));
    }

    // Removes the extended splash screen if it is currently visible.
    function remove() {
        if (isVisible()) {
            var extendedSplashScreen = document.getElementById("extendedSplashScreen");
            WinJS.Utilities.addClass(extendedSplashScreen, "hidden");

            var appbar = document.getElementById("appbar").winControl;
            appbar.disabled = false;
            appbar.showOnlyCommands(["post", "settings"]);
        }
    }

    WinJS.Namespace.define("ExtendedSplash", {
        show: show,
        showProgress: showProgress,
        isVisible: isVisible,
        remove: remove
    });
})();
