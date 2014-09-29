(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/settings/settings.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        unload: function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = false;
        }
    });
})();
