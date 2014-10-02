(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;

    function _reset_user_id(cmd) {
        var yakker = new Yakker();
        console.log("Registered user with id " + yakker.id);
        $("#settings_general #yak_id").val(yakker.id);
        Yodel.nearby_last = null;
    }

    WinJS.UI.Pages.define("/pages/settings/settings.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, args) {
            $("#settings_general #yak_id").val(appData.roamingSettings.values["yakker_id"]);
            $("#settings_general").on("click", "#reset_id", function (event) {
                var confirm = new Windows.UI.Popups.MessageDialog("Resetting your user ID will cause you to lose all of your yaks and yakarma!");
                confirm.title = "Are you sure?";
                confirm.commands.append(new Windows.UI.Popups.UICommand("no! stop!"));
                confirm.commands.append(new Windows.UI.Popups.UICommand("that's okay", _reset_user_id));
                confirm.defaultCommandIndex = 0;
                confirm.cancelCommandIndex = 0;

                confirm.showAsync();
            });
            $("#settings_about").on("click", "button", function (event) {
                var target = event.target;
                if (target.value) {
                    var uri = new Windows.Foundation.Uri(target.value);
                    Windows.System.Launcher.launchUriAsync(uri);
                }
            });
        },
        unload: function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = false;
        }
    });
})();
