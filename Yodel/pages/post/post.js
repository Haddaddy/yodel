(function () {
    "use strict";

    var appbar = document.getElementById("appbar").winControl;
    var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;

    function update_char_count(event) {
        var target = event.target;
        document.getElementById("charcount").innerText = 200 - target.value.length;
    }

    function submit_message(event) {
        var message = document.getElementById("message").value;
        var handle = document.getElementById("handle").value;

        if (handle.length > 0) {
            roamingSettings.values["handle"] = handle;
            Yodel.handle.handle = handle;
        }
        else {
            handle = null;
        }
        if (message.length > 0) {
            Yodel.handle.post_yak(message, handle);
            WinJS.Navigation.back();
        }
    }

    WinJS.UI.Pages.define("/pages/post/post.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, args) {
            appbar.showOnlyCommands(["submit"]);
            appbar.getCommandById("submit").addEventListener("click", submit_message);
            element.querySelector("#message").addEventListener("keyup", update_char_count);
            element.querySelector("#handle").value = Yodel.handle.handle;
        }
    });
})();
