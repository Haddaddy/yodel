﻿/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * pages/settings/settings.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var lang = WinJS.Resources;
    var appData = Windows.Storage.ApplicationData.current;
    var appbar = document.getElementById("appbar").winControl;

    function _reset_user_id(cmd) {
        var user_id = Yodel.handle.gen_id();
        console.log("Registering new user with id " + user_id);
        Yodel.handle.register_id_new(user_id).then(function (response) {
            console.log(response);
            if (response.isSuccessStatusCode) {
                appData.roamingSettings.values.yakker_id = user_id;
                appData.roamingSettings.values.registration_date = moment().format();
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
                var buttons = {};
                buttons[lang.getString("popup_no").value] = null;
                buttons[lang.getString("popup_yes").value] = _reset_user_id;

                Yodel.popup_error(
                    lang.getString("msg_reset-user-id").value,
                    lang.getString("msg_doublecheck").value,
                    buttons
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
