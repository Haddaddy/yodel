﻿(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("Yodel", {
        feed: WinJS.Class.define(function () {
            var appData = Windows.Storage.ApplicationData.current;
            //console.log("Registered user with id " + Yodel.handle.id);

            $(".page_progress").css("display", "inline");
        }, {
            load: function (feed, tag, opt) {
                var that = this;
                var method, promise;
                var parser = "parse_yaks";

                if (feed == "comments") {
                    this._bind("comments_parent", [opt.yak], "yak_detail");
                }

                if (feed in Yodel.data && Yodel.data[feed] && nav.history.forwardStack.length > 0) {
                    promise = new WinJS.Promise(function (complete) {
                        $("#" + tag).on("itemsLoaded.cacheReturn", complete);
                        that._bind(feed, Yodel.data[feed], tag);
                        $(".page_progress").css("display", "none");
                    }).then(function (event) {
                        event.target.scrollTop = Yodel.last_index[feed];
                        $("#" + tag).off("itemsLoaded.cacheReturn");
                    });
                }
                else {
                    switch (feed) {
                        case "nearby":
                            method = Yodel.handle.get_yaks();
                            break;
                        case "peek":
                            method = Yodel.handle.peek(nav.state.id);
                            break;
                        case "peek_anywhere":
                            method = Yodel.handle.peek_anywhere(nav.state.lat, nav.state.long);
                            break;
                        case "my_top_yaks":
                            method = Yodel.handle.get_my_tops();
                            break;
                        case "my_recent_yaks":
                            method = Yodel.handle.get_my_recent_yaks();
                            break;
                        case "my_recent_replies":
                            method = Yodel.handle.get_my_recent_replies();
                            break;
                        case "area_tops":
                            method = Yodel.handle.get_area_tops();
                            break;
                        case "alltime_tops":
                            method = Yodel.handle.get_greatest();
                            break;
                        case "comments":
                            method = Yodel.handle.get_comments(nav.state.message_id);
                            parser = "parse_comments";
                            break;
                        default:
                            return;
                    }

                    promise = this._retrieve(method).then(function (json) {
                        var yak_list = Yodel.handle[parser](json);
                        that._bind(feed, yak_list, tag);
                        $(".page_progress").css("display", "none");

                        if (feed == "nearby") {
                            Yodel.data.pivot = {
                                featuredLocations: json.featuredLocations,
                                otherLocations: json.otherLocations,
                                yakarma: json.yakarma
                            };
                        }
                        if (feed == "comments") {
                            var comments = opt.yak.comments;
                            if (json.comments && comments != json.comments.length) {
                                opt.yak.comments = json.comments.length;
                                that._bind("comments_parent", [opt.yak], "yak_detail");
                            }
                        }
                    });
                }

                return promise;
            },
            _bind: function (feed, yak_data, list_tag) {
                var list = document.getElementById(list_tag);
                Yodel.data[feed] = yak_data;
                if (list) {
                    if (yak_data && !yak_data.length) {
                        $(".no_messages").css("display", "block");
                    }
                    else {
                        Yodel.bind_options(list, {
                            dataSource: "Yodel.data." + feed
                        });

                        // Clean out event listeners, in case we're re-binding to the same list
                        // e.g. what would happen after pull-to-refresh
                        $(list).off(".binding");

                        if (feed != "comments" && feed != "comments_parent") {
                            $(list).on("click.binding", ".win-template", Yodel.to_comments.bind({ feed: feed }));
                        }

                        if ("can_submit" in nav.state && nav.state.can_submit !== false) {
                            $(list).on("click.binding", ".yak_up", Yodel.vote.bind({ feed: feed, direction: "up" }));
                            $(list).on("click.binding", ".yak_down", Yodel.vote.bind({ feed: feed, direction: "down" }));
                        }

                        $(list).on("click.binding pointerdown.binding", ".win-interactive", function (e) { e.stopPropagation(); });
                        $(list).on("click.binding pointerdown.binding", ".win-template", function (e) { WinJS.UI.Animation.pointerDown($(e.target).closest(".yak_container")[0]); });
                        $(list).on("pointerout.binding pointercancel.binding", ".win-template", function (e) { WinJS.UI.Animation.pointerUp($(e.target).closest(".yak_container")[0]); });
                    }
                }
            },
            _retrieve: function (promise) {
                var that = this;
                return promise.then(function (response) {
                    console.log(response);
                    if (response.isSuccessStatusCode) {
                        return response.content.readAsStringAsync();
                    }
                    else {
                        $(".page_progress").css("display", "none");
                        Yodel.popup_error("HTTP Error " + response.statusCode + " " + response.reasonPhrase, "Unable to load feed");
                        return null;
                    }
                }).then(function (res) {
                    if(res) {
                        var res_json = JSON.parse(res);
                        console.log(res_json);

                        if (("messages" in res_json && res_json.messages.length > 0) || ("comments" in res_json && res_json.comments.length > 0)) {
                            return res_json;
                        }
                        else {
                            $(".page_progress").css("display", "none");
                            return [];
                        }
                    }
                });
            }
        })
    });

    WinJS.Namespace.define("Yodel.UI", {
        ItemsControl: WinJS.Class.define(function (element, options) {
            this.domElement = element;
            WinJS.UI.setOptions(this, options);
        }, {
            domElement: null,
            _dataSource: null,
            dataSource: {
                get: function () {
                    return this._dataSource;
                },
                set: function (v) {
                    this._dataSource = v;
                    this._renderItems(v);
                }
            },
            _renderItems: function (source) {
                WinJS.Utilities.empty(this.domElement);
                var template = document.getElementById(this.template).winControl;
                $(this.domElement).bind("itemsLoaded");

                if (Array.isArray(source)) {
                    source.forEach(function (item, index) {
                        var newElement = document.createElement("div");
                        newElement.setAttribute("aria-posinset", index);
                        this.domElement.appendChild(newElement);

                        template.render(item, newElement);
                    }.bind(this));

                    $(this.domElement).trigger("itemsLoaded");
                }
            }
        })
    });
})();
