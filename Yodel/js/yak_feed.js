(function () {
    "use strict";

    WinJS.Namespace.define("Yodel", {
        feed: WinJS.Class.define(function () {
            var appData = Windows.Storage.ApplicationData.current;
            this.yakker = new Yakker(appData.roamingSettings.values["yakker_id"], new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
            console.log("Registered user with id " + this.yakker.id);

            $("progress").css("display", "inline");
        }, {
            load: function (type, opt) {
                if (!opt) {
                    opt = {};
                }
                this.type = type;
                var that = this;
                switch (type) {
                    case "nearby":
                        if ("prev" in opt) {
                            setImmediate(function () {
                                that._bind(opt.prev, "nearby_yaks");
                                $("#nearby_yaks").scrollTop(Yodel.last_index);
                            });
                        }
                        else {
                            this._retrieve(this.yakker.get_yaks()).then(function (yak_list) {
                                setImmediate(function () {
                                    that._bind(yak_list, "nearby_yaks");
                                });
                                WinJS.Namespace.define("Yodel", { nearby_last: yak_list });
                            });
                        }
                        break;
                    case "peek":
                        this._retrieve(this.yakker.peek(opt.peek_id)).then(function (peek_yak_list) {
                            setImmediate(function () {
                                that._bind(peek_yak_list, "peek_yaks");
                            });
                        });
                    case "comments":
                        //var yak_single = prev;
                        //this._bind(yak_single, "yak_detail");
                        this._retrieve(this.yakker.get_comments(opt.message_id)).then(function (comments_list) {
                            setImmediate(function () {
                                that._bind(comments_list, "yak_comments");
                            });
                        });
                        break;
                }
            },
            _bind: function (yak_data, list) {
                list = document.getElementById(list);
                if (list) {
                    list.winControl.dataSource = yak_data;

                    if (this.type == "comments") {
                        var kind = "comment";
                    }
                    else {
                        var kind = "yak";
                        $(list).on("click", ".yak_container", Yodel.to_comments);
                    }

                    $(list).on("click", ".yak_up", Yodel.vote.bind({ client: this.yakker, type: kind, vote: "up" }));
                    $(list).on("click", ".yak_down", Yodel.vote.bind({ client: this.yakker, type: kind, vote: "down" }));
                    $(list).on("click pointerdown", ".win-interactive", function (e) { e.stopPropagation(); });
                    $(list).on("click pointerdown", ".yak_container", function (e) { WinJS.UI.Animation.pointerDown($(e.target).closest(".yak_container")[0]); });
                    $(list).on("pointerout pointercancel", ".yak_container", function (e) { WinJS.UI.Animation.pointerUp($(e.target).closest(".yak_container")[0]); });

                    $("progress").css("display", "none");
                }
            },
            _retrieve: function (promise) {
                console.log("LOADING NEW FEED FROM THE WEB");
                var that = this;
                return promise.then(function (response) {
                    console.log(response);
                    if (response.isSuccessStatusCode) {
                        return response.content.readAsStringAsync();
                    }
                    else {
                        $("progress").css("display", "none");
                        var http_error_msg = new Windows.UI.Popups.MessageDialog("HTTP Error " + response.statusCode + " " + response.reasonPhrase);
                        http_error_msg.title = "Unable to load yaks";
                        http_error_msg.showAsync();
                        return "{}";
                    }
                }).then(function (res) {
                    var res_json = JSON.parse(res);
                    console.log(res_json);

                    if ("messages" in res_json) {
                        var yak_list = that.yakker.parse_yaks(res_json);
                    }
                    else if("comments" in res_json) {
                        var yak_list = that.yakker.parse_comments(res_json);
                    }
                    
                    if (yak_list.length > 0) {
                        return yak_list;
                    }
                    else {
                        $(".no_messages").css("display", "block");
                        $("progress").css("display", "none");
                        return [];
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
                var template = document.querySelector(".yak_template").winControl;
                source.forEach(function (item, index) {
                    var newElement = document.createElement("div");
                    newElement.setAttribute("aria-posinset", index);
                    this.domElement.appendChild(newElement);

                    template.render(item, newElement);
                }.bind(this));
            }
        })
    });
})();
