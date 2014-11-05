(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;
    var appbar = document.getElementById("appbar").winControl;

    function _reset_user_id(cmd) {
        var user_id = Yodel.handle.gen_id();
        console.log("Registering new user with id " + user_id);
        Yodel.handle.register_id_new(user_id).then(function (response) {
            console.log(response);
            if (response.isSuccessStatusCode) {
                appData.roamingSettings.values.yakker_id = user_id;
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
            appbar.disabled = true;

            $("#settings_general #yak_id").val(appData.roamingSettings.values.yakker_id);
            $("#settings_general").on("click", "#reset_id", function (event) {
                Yodel.popup_error(
                    "Resetting your user ID will cause you to lose all of your yaks and yakarma!",
                    "Are you sure?",
                    {
                        "no! stop!": null,
                        "that's okay": _reset_user_id
                    }
                );
            });
            $("#settings_about").on("click", "button", function (event) {
                var target = event.target;
                if (target.value) {
                    var uri = new Windows.Foundation.Uri(target.value);
                    Windows.System.Launcher.launchUriAsync(uri);
                }
            });
        }
    });
})();
