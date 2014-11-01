(function () {
    "use strict";

    var appbar = document.getElementById("appbar").winControl;
    var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;

    function update_char_count(event) {
        var target = event.target;
        document.getElementById("charcount").innerText = 200 - target.value.length;
    }

    function toggle_handle(event) {
        var target = event.target;
        var handle = document.getElementById("handle");

        WinJS.Utilities.toggleClass(target, "selected");
        handle.disabled = !handle.disabled;
    }

    function submit_message(event) {
        var url_regex = /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
        var word_filter = new RegExp(Yodel.handle.threat_checks[0].expressions.join("|", "gi"));

        var message_tag = document.getElementById("message");
        var handle_tag = document.getElementById("handle");
        var message = message_tag.value;
        var handle = handle_tag.value;

        if (message.length > 0) {
            if (handle.length > 0 && !handle_tag.disabled) {
                roamingSettings.values["handle"] = handle;
                Yodel.handle.handle = handle;
            }
            else {
                handle = null;
            }

            if(url_regex.exec(message)) {
                var error_msg = new Windows.UI.Popups.MessageDialog("Hey, slow down there! You can't have URLs in your message; it's a security hazard. Please remove them and try again.");
                error_msg.title = "URLs are not allowed";
                error_msg.showAsync();
                return;
            }

            if(!this.threat_override && (word_filter.exec(message) || word_filter.exec(handle))) {
                var threat_warn = new Windows.UI.Popups.MessageDialog(Yodel.handle.threat_checks[0].message);
                threat_warn.title = "Hold on a second!";
                threat_warn.commands.append(new Windows.UI.Popups.UICommand("no"));
                threat_warn.commands.append(new Windows.UI.Popups.UICommand("yes", submit_message.bind({ threat_override: true })));
                threat_warn.showAsync();
                return;
            }

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
            element.querySelector("#handle_toggle").addEventListener("click", toggle_handle);
            element.querySelector("#handle").value = Yodel.handle.handle;
        }
    });
})();
