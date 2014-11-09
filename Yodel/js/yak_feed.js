(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("Yodel", {
        feed: WinJS.Class.define(function () {
            var appData = Windows.Storage.ApplicationData.current;
            //console.log("Registered user with id " + Yodel.handle.id);

            $(".page_progress").css("display", "inline");
        }, {
            load: function (feed, tag, opt) {
                this.feed = feed;
                var that = this;
                var method;
                var parser = "parse_yaks";
                
                if(feed == "comments") {
                    this.feed = "comments_parent";
                    this._bind([opt.yak], "yak_detail");
                    this.feed = "comments";
                }

                if (feed in Yodel.data && Yodel.data[feed] && nav.history.forwardStack.length > 0) {
                    this._bind(Yodel.data[feed], tag);
                    setImmediate(function () {
                        $("#" + tag).scrollTop(Yodel.last_index[feed]);
                    });
                    $(".page_progress").css("display", "none");

                    return WinJS.Promise.as({});
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

                    return this._retrieve(method).then(function (json) {
                        var yak_list = Yodel.handle[parser](json);
                        that._bind(yak_list, tag);
                        $(".page_progress").css("display", "none");

                        if (feed == "nearby") {
                            Yodel.data.pivot = {
                                featuredLocations: json.featuredLocations,
                                otherLocations: json.otherLocations,
                                yakarma: json.yakarma
                            };
                        }
                    });
                }
            },
            _bind: function (yak_data, list_tag) {
                var list = document.getElementById(list_tag);
                Yodel.data[this.feed] = yak_data;
                if (list) {
                    Yodel.bind_options(list, {
                        dataSource: "Yodel.data." + this.feed
                    });

                    if (this.feed != "comments" && this.feed != "comments_parent") {
                        $(list).on("click", ".win-template", Yodel.to_comments.bind({ feed: this.feed }));
                    }

                    if("can_submit" in nav.state && nav.state.can_submit !== false) {
                        $(list).on("click", ".yak_up", Yodel.vote.bind({ feed: this.feed, direction: "up" }));
                        $(list).on("click", ".yak_down", Yodel.vote.bind({ feed: this.feed, direction: "down" }));
                    }
                   
                    $(list).on("click pointerdown", ".win-interactive", function (e) { e.stopPropagation(); });
                    $(list).on("click pointerdown", ".win-template", function (e) { WinJS.UI.Animation.pointerDown($(e.target).closest(".yak_container")[0]); });
                    $(list).on("pointerout pointercancel", ".win-template", function (e) { WinJS.UI.Animation.pointerUp($(e.target).closest(".yak_container")[0]); });
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
                            $(".no_messages").css("display", "block");
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
                if (Array.isArray(source)) {
                    source.forEach(function (item, index) {
                        var newElement = document.createElement("div");
                        newElement.setAttribute("aria-posinset", index);
                        this.domElement.appendChild(newElement);

                        template.render(item, newElement);
                    }.bind(this));
                }
            }
        })
    });
})();
