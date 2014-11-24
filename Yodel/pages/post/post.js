/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * pages/post/post.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var lang = WinJS.Resources;
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
        var newline_regex = /(\r\n|\n|\r)/gm;

        var message_tag = document.getElementById("message");
        var handle_tag = document.getElementById("handle");
        var message = message_tag.value;
        var handle = handle_tag.value;
        var promise = null;

        if (message.length > 0 && message.length <= 200) {
            if(url_regex.exec(message)) {
                Yodel.popup_error(
                    lang.getString("msg_url-in-post").value,
                    lang.getString("msg_generic-title").value
                );
                return;
            }

            if (!this.threat_override) {
                if ("threat_checks" in Yodel.handle &&
                    Yodel.handle.service_config.features.threat_checks &&
                    Yodel.handle.service_config.features.threat_checks.length > 0) {
                    var threat_warning = Yodel.handle.service_config.features.threat_checks[0].message;
                    var word_filter = new RegExp(Yodel.handle.service_config.features.threat_checks[0].expressions.join("|"), "gi");
                }
                else {
                    var threat_warning = lang.getString("msg_threat-in-post").value;
                    var threat_dict = [
                        "gun\\b",
                        "shoot\\b",
                        "bomb\\b",
                        "columbine\\b",
                        "sandy hook\\b"
                    ];

                    var word_filter = new RegExp(threat_dict.join("|"), "gi");
                }

                if ((word_filter.exec(message) || word_filter.exec(handle))) {
                    Yodel.popup_error(
                        threat_warning,
                        lang.getString("msg_generic-title").value,
                        {
                            "no": null,
                            "yes": submit_message.bind({ threat_override: true })
                        }
                    );
                    return;
                }
            }

            // Filter out newlines (causes crashes)
            message = message.replace(newline_regex, " ");

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
                    Yodel.popup_error("HTTP Error " + response.statusCode + " " + response.reasonPhrase, lang.getString("msg_posting-fail").value);
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
                var waiting_period = moment(roamingSettings.values.registration_date).add(5, 'm');
                if (moment().isBefore(waiting_period)) {
                    var buttons = {};
                    buttons[lang.getString("popup_okay").value] = function() {
                        nav.back()
                    };

                    Yodel.popup_error(
                        sprintf(lang.getString("msg_new-user-post").value, waiting_period.fromNow()),
                        lang.getString("msg_generic-title").value,
                        buttons
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
