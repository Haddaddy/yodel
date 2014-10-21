(function () {
    "use strict";

    WinJS.Namespace.define("Yodel", {
        feed: WinJS.Class.define(function () {
            var appData = Windows.Storage.ApplicationData.current;
            WinJS.Namespace.define("Yodel.data");
            this.yakker = new Yakker(appData.roamingSettings.values["yakker_id"], new Location(appData.localSettings.values["gl_lat"], appData.localSettings.values["gl_long"]));
            //console.log("Registered user with id " + this.yakker.id);

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
                            that._bind(opt.prev, "nearby_yaks");
                            setImmediate(function () {
                                $("#nearby_yaks").scrollTop(Yodel.nearby_last_index);
                            });
                        }
                        else {
                            return this._retrieve(this.yakker.get_yaks()).then(function (json) {
                                var yak_list = that.yakker.parse_yaks(json);
                                that._bind(yak_list, "nearby_yaks");
                                return json;
                            });
                        }
                        break;
                    case "peek":
                        if ("prev" in opt) {
                            that._bind(opt.prev, "peek_feed");
                            setImmediate(function () {
                                $("#peek_feed").scrollTop(Yodel.peek_last_index);
                            });
                        }
                        else {
                            this._retrieve(this.yakker.peek(opt.peek_id)).then(function (json) {
                                var peek_yak_list = that.yakker.parse_yaks(json);
                                that._bind(peek_yak_list, "peek_feed");
                            });
                        }
                        break;
                    case "comments":
                        //var yak_single = prev;
                        //this._bind(yak_single, "yak_detail");
                        this._retrieve(this.yakker.get_comments(opt.message_id)).then(function (json) {
                            var comments_list = that.yakker.parse_comments(json);
                            that._bind(comments_list, "yak_comments");
                        });
                }
            },
            _bind: function (yak_data, list_tag) {
                var list = document.getElementById(list_tag);
                if (list) {
                    Yodel.data[list_tag] = yak_data;
                    if (!list.winControl) {
                        $(list).attr("data-win-options", function (i, val) {
                            return val.slice(0, -1) + ", dataSource:Yodel.data." + list_tag + "}";
                        });
                    }
                    else {
                        list.winControl.dataSource = yak_data;
                    }

                    var kind = "comment";
                    if (this.type != "comments") {
                        kind = "yak";
                        $(list).on("click", ".win-template", Yodel.to_comments);
                    }

                    if(this.type != "peek") {
                        $(list).on("click", ".yak_up", Yodel.vote.bind({ client: this.yakker, type: kind, direction: "up" }));
                        $(list).on("click", ".yak_down", Yodel.vote.bind({ client: this.yakker, type: kind, direction: "down" }));
                    }
                   
                    $(list).on("click pointerdown", ".win-interactive", function (e) { e.stopPropagation(); });
                    $(list).on("click pointerdown", ".win-template", function (e) { WinJS.UI.Animation.pointerDown($(e.target).closest(".yak_container")[0]); });
                    $(list).on("pointerout pointercancel", ".win-template", function (e) { WinJS.UI.Animation.pointerUp($(e.target).closest(".yak_container")[0]); });

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
                        http_error_msg.title = "Unable to load feed";
                        http_error_msg.showAsync();
                        return null;
                    }
                }).then(function (res) {
                    if(res) {
                        var res_json = JSON.parse(res);
                        console.log(res_json);

                        if (("messages" in res_json && res_json["messages"].length > 0) || ("comments" in res_json && res_json["comments"].length > 0)) {
                            return res_json;
                        }
                        else {
                            $(".no_messages").css("display", "block");
                            $("progress").css("display", "none");
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
