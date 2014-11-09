(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var appbar = document.getElementById("appbar").winControl;
    var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;

    function update_char_count(event) {
        var target = event.target;
        var charcount = 200 - target.value.length;
        document.getElementById("charcount").innerText = charcount;

        if (charcount < 200) {
            appbar.getCommandById("submit").disabled = false;
        }
        else {
            appbar.getCommandById("submit").disabled = true;
        }
    }

    function toggle_handle(event) {
        var target = event.target;
        var handle = document.getElementById("handle");

        WinJS.Utilities.toggleClass(target, "selected");
        handle.disabled = !handle.disabled;
    }

    function submit_message(event) {
        $(".page_progress").css("display", "inline");
        $("form").blur();

        // URL regex by John Gruber: https://gist.github.com/gruber/249502
        var url_regex = /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
        var word_filter = new RegExp(Yodel.handle.threat_checks[0].expressions.join("|"), "gi");

        var message_tag = document.getElementById("message");
        var handle_tag = document.getElementById("handle");
        var message = message_tag.value;
        var handle = handle_tag.value;
        var promise = null;

        if (message.length > 0 && message.length <= 200) {
            if(url_regex.exec(message)) {
                Yodel.popup_error(
                    "You can't have URLs in your message; it's a security hazard. Please remove them and try again.",
                    "Hey, slow down there!"
                );
                return;
            }

            if (!this.threat_override && (word_filter.exec(message) || word_filter.exec(handle))) {
                Yodel.popup_error(
                    Yodel.handle.threat_checks[0].message,
                    "Hold on a second!",
                    {
                        "no": null,
                        "yes": submit_message.bind({ threat_override: true })
                    }
                );
                return;
            }

            if (handle.length > 0 && !handle_tag.disabled) {
                roamingSettings.values.handle = handle;
                Yodel.handle.handle = handle;
            }
            else {
                handle = null;
            }

            if (nav.state.type == "comment") {
                promise = Yodel.handle.post_comment(nav.state.message_id, message);
            }
            else {
                promise = Yodel.handle.post_yak(message, handle);
            }

            appbar.getCommandById("submit").disabled = true;

            promise.then(function (response) {
                console.log(response);
                if (!response.isSuccessStatusCode) {
                    Yodel.popup_error("HTTP Error " + response.statusCode + " " + response.reasonPhrase, "Unable to send message");
                }
                else {
                    var past_state = nav.history.backStack.slice(-1)[0].state;

                    if (nav.state.type == "comment") {
                        Yodel.data.comments = null;
                        Yodel.data.comments_parent = null;
                    }
                    else {
                        Yodel.data[past_state.method] = null;
                    }

                    past_state.post_cookie = response.headers.lookup("Set-Cookie");

                    nav.back();
                }
            });
        }
    }

    WinJS.UI.Pages.define("/pages/post/post.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        ready: function (element, args) {
            if (!nav.state) {
                nav.state = { type: "yak" };
            }

            if ("registration_date" in roamingSettings.values && roamingSettings.values.registration_date) {
                var registration_moment = moment(roamingSettings.values.registration_date);
                var waiting_period = registration_moment.add(5, 'm');
                if (!registration_moment.isAfter(waiting_period)) {
                    Yodel.popup_error(
                        "Newly-registered users need to wait at least 5 minutes before posting. It's a spam protection thing. You can start posting " + waiting_period.fromNow() + ".",
                        "Hold on a second!",
                        {
                            "okay": function () {
                                nav.back()
                            }
                        }
                    );
                }
            }

            appbar.getCommandById("submit").addEventListener("click", submit_message);
            element.querySelector("#message").addEventListener("keyup", update_char_count);

            $("#message").textareaAutoSize();

            if (nav.state.type == "comment") {
                element.querySelector("#handle_container").style.display = "none";
            }
            else {
                element.querySelector("#handle_toggle").addEventListener("click", toggle_handle);
                element.querySelector("#handle").value = Yodel.handle.handle;
            }

            appbar.disabled = false;
            appbar.showOnlyCommands(["submit"]);
        }
    });
})();
