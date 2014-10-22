﻿(function () {
    "use strict";

    var nav = WinJS.Navigation;

    function navigateFromAppBar(event) {
        var element = event.target;
        if (element.value) {
            nav.navigate(element.value).then(function () {
                element.parentNode.winControl.disabled = true;
            });
        }
    }

    WinJS.UI.Pages.define("default.html", {
        ready: function (element, options) {
            var appbar = document.getElementById("appbar");
            appbar.addEventListener("click", navigateFromAppBar);
            appbar.winControl.closedDisplayMode = "minimal";
        }
    });

})();
