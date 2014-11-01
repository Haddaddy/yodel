(function () {
    "use strict";

    var appbar = document.getElementById("appbar").winControl;

    WinJS.UI.Pages.define("/pages/comments/comments.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function(element, options) {
            appbar.disabled = true;
        },
        unload: function () {
            appbar.disabled = false;
        }
    });
})();