(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/settings/settings.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function(element, args) {
            $("#settings_about").on("click", "button", function (event) {
                var target = event.target;
                if (target.value) {
                    var uri = new Windows.Foundation.Uri(target.value);
                    Windows.System.Launcher.launchUriAsync(uri);
                }
            })
        },
        unload: function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = false;
        }
    });
})();
