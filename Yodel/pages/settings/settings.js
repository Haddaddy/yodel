(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;

    function _reset_user_id(cmd) {
        var user_id = Yodel.handle.gen_id();
        console.log("Registering new user with id " + user_id);
        Yodel.handle.register_id_new(user_id).then(function (response) {
            console.log(response);
            if (response.isSuccessStatusCode) {
                Windows.Storage.ApplicationData.current.roamingSettings.values["yakker_id"] = user_id;
                Yodel.handle.id = user_id;
                $("#settings_general #yak_id").val(user_id);

                Yodel.data.nearby_yaks = null;
                Yodel.data.me_pivot = null;
                Yodel.data.pivot.yakarma = "100";
            }
        });
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
