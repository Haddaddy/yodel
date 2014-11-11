(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current;

    WinJS.Namespace.define("API", {
        parse_time: function(timestr) {
            var format = "YYYY-MM-DD HH:mm:ss";
            return moment.tz(timestr, format, "America/Guadeloupe").twitter();
        },

        Location: WinJS.Class.define(function(latitude, longitude, delta) {
            this.latitude = latitude;
            this.longitude = longitude;
            if(!delta) {
                delta = "0.030000";
            }
            this.delta = delta;
        }),

        PeekLocation: WinJS.Class.define(function(raw) {
            this.id = raw.peekID;
            this.can_submit = Boolean(parseInt(raw.canSubmit));
            this.name = raw.location;
            var lat = raw.latitude;
            var lon = raw.longitude;
            var d = raw.delta;
            this.location = new API.Location(lat, lon, d);
        }),

        Yakker: WinJS.Class.define(function(user_id, loc) {
            this.default_url = "https://us-east-api.yikyakapi.net/api";
            this.user_agent = "Dalvik/1.6.0 (Linux; U; Android 4.4.4; Google Nexus 4 - 4.4.4 - API 19 - 768x1280 Build/KTU84P)";
            this.key = Windows.Storage.ApplicationData.current.localSettings.values.api_key;
            this.version = "2.1.003";

            if(!loc) {
                loc = [0,0];
            }
    
            this.loc = loc;

            this.id = user_id;

            this.handle = null;
            if (appData.roamingSettings.values.handle) {
                this.handle = appData.roamingSettings.values.handle;
            }
    
            this.get_features("https://d3436qb9f9xu23.cloudfront.net/yik_yak_features.json");
            //this.get_features("https://d3436qb9f9xu23.cloudfront.net/yikyakurl_android.json");
        }, {
            get_features: function(url) {
                var localFolder = appData.localFolder;
                var filename = url.split("/").pop();
                var file_uri = new Windows.Foundation.Uri("ms-appdata:///local/" + filename);

                function fetch_new() {
                    var httpClient = new Windows.Web.Http.HttpClient();
                    return httpClient.getAsync(Windows.Foundation.Uri(url)).then(
                        function (response) {
                            console.log(response);
                            return response.content.readAsStringAsync();
                        }).then(function (content) {
                            localFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting).done(function (file) {
                                Windows.Storage.FileIO.writeTextAsync(file, content);
                            });
                            return WinJS.Promise.as(content);
                        }
                    );
                }

                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(file_uri).then(
                    function (file) {
                        return file.getBasicPropertiesAsync().then(
                            function (properties) {
                                return properties.dateModified;
                            }).then(function (date) {
                                var httpClient = new Windows.Web.Http.HttpClient();
                                var headers = httpClient.defaultRequestHeaders;
                                headers.ifModifiedSince = date;
                                return httpClient.getAsync(new Windows.Foundation.Uri(url));
                            }).then(function (response) {
                                console.log(response);
                                if (response.statusCode == 304) {
                                    // Remote file isn't modified, load cached file
                                    return localFolder.getFileAsync(filename).then(function (file) {
                                        return Windows.Storage.FileIO.readTextAsync(file);
                                    });
                                }
                                else {
                                    // Remote file is modified, load anew
                                    return fetch_new();
                                }
                            }
                        );
                    },
                    function () {
                        // No cached file exists, load anew
                        return fetch_new();
                    }
                ).done(function (content) {
                    content = JSON.parse(content);
                    WinJS.Class.mix(API.Yakker, content.configuration);
                });
            },
            gen_id: function () {
                var buf = new Uint16Array(8);
                window.msCrypto.getRandomValues(buf);
                var S4 = function (num) {
                    var ret = num.toString(16);
                    while (ret.length < 4) {
                        ret = "0" + ret;
                    }
                    return ret;
                };
                var hashIn = S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]);
                // Open convoluted WinRT hashing API
                var winCrypt = Windows.Security.Cryptography;
                var hashProvider = winCrypt.Core.HashAlgorithmProvider.openAlgorithm(winCrypt.Core.HashAlgorithmNames.md5);
                // Convert input to binary
                var buffer = hashProvider.hashData(winCrypt.CryptographicBuffer.convertStringToBinary(hashIn, winCrypt.BinaryStringEncoding.utf8));
                // Produce MD5 hash in hex form
                var hash = winCrypt.CryptographicBuffer.encodeToHexString(buffer);
                return hash.toUpperCase();
            },
            register_id_new: function (id) {
                var params = {
                    "userID": id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("registerUser", params);
            },
            sign_request: function (page, params) {
                // Salt is current Unix time in seconds
                var salt = String(Math.floor(new Date().getTime() / 1000));
        
                // Message is API endpoint (minus domain) + sorted parameters
                var msg = "/api/" + page;
                var sorted_params = Object.keys(params);
                sorted_params.sort();
        
                if(sorted_params.length > 0) {
                    msg += "?";
                }
                for(var param in sorted_params) {
                    msg += sorted_params[param] + "=" + params[sorted_params[param]] + "&";
                }
                // Chop off last ampersand
                if(sorted_params.length > 0) {
                    msg = msg.slice(0, -1);
                }
        
                msg += salt;
                console.log(msg);
        
                // Calculate HMAC signature
                var winCrypt = Windows.Security.Cryptography;
                var macAlgorithm = winCrypt.Core.MacAlgorithmProvider.openAlgorithm("HMAC_SHA1");
                var keyMaterial = winCrypt.CryptographicBuffer.convertStringToBinary(this.key, winCrypt.BinaryStringEncoding.Utf8);
                var macKey = macAlgorithm.createKey(keyMaterial);
                var tbs = winCrypt.CryptographicBuffer.convertStringToBinary(msg, winCrypt.BinaryStringEncoding.utf8);
                var sigBuffer = winCrypt.Core.CryptographicEngine.sign(macKey, tbs);
                var sig = winCrypt.CryptographicBuffer.encodeToBase64String(sigBuffer).trim();

                return { "hash": sig, "salt": salt };
            },
            encode_params: function(params, signed) {
                var signed_params = "salt=" + signed.salt + "&hash=" + encodeURIComponent(signed.hash);
                var query = "?";
                if (params) {
                    var param_keys = Object.keys(params).sort();
                    if (param_keys.length > 0) {
                        for (var param in param_keys) {
                            query += param_keys[param] + "=" + encodeURIComponent(params[param_keys[param]]) + "&";
                        }
                        query += signed_params;
                    }
                }
                else {
                    query += signed_params;
                }
                return query;
            },
            get: function (page, params) {
                var url = this.default_url + "/" + page;

                var signed = this.sign_request(page, params);

                var query = this.encode_params(params, signed);

                var httpClient = new Windows.Web.Http.HttpClient();
                var headers = httpClient.defaultRequestHeaders;
                headers.userAgent.parseAdd(this.user_agent);
                headers.acceptEncoding.parseAdd("gzip");
                headers.connection.parseAdd("Keep-Alive");

                if (page != "registerUser" && "lat" in params && "long" in params) {
                    headers.cookie.append(new Windows.Web.Http.Headers.HttpCookiePairHeaderValue("lat", params.lat));
                    headers.cookie.append(new Windows.Web.Http.Headers.HttpCookiePairHeaderValue("long", params.long));
                }

                if (WinJS.Navigation.state && "post_cookie" in WinJS.Navigation.state) {
                    var post_cookie = WinJS.Navigation.state.post_cookie;
                    headers.cookie.append(new Windows.Web.Http.Headers.HttpCookiePairHeaderValue("pending", post_cookie.slice(post_cookie.indexOf("pending=") + 8).split(";")[0]));
                    delete WinJS.Navigation.state.post_cookie;
                }

                url = new Windows.Foundation.Uri(url + query);
                console.log(headers);
                console.log(params);

                return httpClient.getAsync(url);
            },
            post: function (page, params, post_data) {
                var url = this.default_url + "/" + page;

                var signed = this.sign_request(page, params);
        
                var query = this.encode_params(params, signed);

                var httpClient = new Windows.Web.Http.HttpClient();
                var headers = httpClient.defaultRequestHeaders;
                headers.userAgent.parseAdd(this.user_agent);
                headers.acceptEncoding.parseAdd("gzip");

                if ("lat" in params && "long" in params) {
                    headers.cookie.append(new Windows.Web.Http.Headers.HttpCookiePairHeaderValue("lat", params.lat));
                    headers.cookie.append(new Windows.Web.Http.Headers.HttpCookiePairHeaderValue("long", params.long));
                }

                var post_params = (new Windows.Web.Http.HttpClient()).defaultRequestHeaders;
                var param_keys = Object.keys(post_data).sort();
                for (var param in param_keys) {
                    post_params[param_keys[param]] = post_data[param_keys[param]];
                }
                var post_content = new Windows.Web.Http.HttpFormUrlEncodedContent(post_params);

                url = new Windows.Foundation.Uri(url + query);
                console.log(headers);
                console.log(params);
                console.log(post_params);

                return httpClient.postAsync(url, post_content);
            },
            parse_yaks: function(text) {
                var raw_yaks = text.messages;
                var yaks = [];
                for (var raw_yak in raw_yaks) {
                    yaks.push(new API.Yak(this, raw_yaks[raw_yak]));
                }
                return yaks;
            },
            parse_comments: function(text, message_id) {
                var raw_comments = text.comments;
                var comments = [];
                for(var raw_comment in raw_comments) {
                    comments.push(new API.Comment(this, raw_comments[raw_comment], message_id));
                }
                return comments;
            },
            contact: function(message) {
                var params = {
                    "userID": this.id,
                    "message": message,
                    "version": this.version
                };
                return this.get("contactUs", params);
            },
            upvote_yak: function(message_id) {
                var params = {
                    "userID": this.id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("likeMessage", params);
            },
            downvote_yak: function(message_id) {
                var params = {
                    "userID": this.id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("downvoteMessage", params);
            },
            upvote_comment: function(comment_id) {
                var params = {
                    "userID": this.id,
                    "commentID": comment_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("likeComment", params);
            },
            downvote_comment: function(comment_id) {
                var params = {
                    "userID": this.id,
                    "commentID": comment_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("downvoteComment", params);
            },
            report_yak: function(message_id) {
                var params = {
                    "userID": this.id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("reportMessage", params);
            },
            delete_yak: function(message_id) {
                var params = {
                    "userID": this.id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("deleteMessage2", params);
            },
            report_comment: function(comment_id, message_id) {
                var params = {
                    "userID": this.id,
                    "commentID": comment_id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("reportMessage", params);
            },
            delete_comment: function(comment_id, message_id) {
                var params = {
                    "userID": this.id,
                    "commentID": comment_id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("deleteComment", params);
            },
            get_greatest: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getGreatest", params);
            },
            get_my_tops: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getMyTops", params);
            },
            get_my_recent_replies: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getMyRecentReplies", params);
            },
            update_location: function(loc) {
                this.loc = loc;
            },
            get_my_recent_yaks: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getMyRecentYaks", params);
            },
            get_area_tops: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getAreaTops", params);
            },
            get_yaks: function() {
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getMessages", params);
            },
            post_yak: function (message, handle, showloc) {
                var params = {
                    "userID": this.id,
                    "version": this.version
                };
                var post_data = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "message": message
                };
                if(!showloc) {
                    post_data.hidePin = "1";
                }
                if(handle && this.handle) {
                    post_data.hndl = this.handle;
                }
                return this.post("sendMessage", params, post_data);
            },
            get_comments: function(message_id) {
                var params = {
                    "userID": this.id,
                    "messageID": message_id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "version": this.version
                };
                return this.get("getComments", params);
            },
            post_comment: function (message_id, comment) {
                var params = {
                    "userID": this.id,
                    "version": this.version
                };
                var post_data = {
                    "userID": this.id,
                    "messageID": message_id,
                    "comment": comment,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude
                };
                return this.post("postComment", params, post_data);
            },
            get_peek_locations: function(data) {
                var peeks = [];
                var locations = data.otherLocations;
                for(var peek_json in locations) {
                    peeks.push(new API.PeekLocation(locations[peek_json]));
                }
                return peeks;
            },
            get_featured_locations: function(data) {
                var peeks = [];
                var locations = data.featuredLocations;
                for (var peek_json in locations) {
                    peeks.push(new API.PeekLocation(locations[peek_json]));
                }
                return peeks;
            },
            get_yakarma: function(data) {
                return parseInt(data.yakarma);
            },
            peek: function (peek_id) {
                if (peek_id instanceof API.PeekLocation) {
                    peek_id = peek_id.id;
                }
                var params = {
                    "userID": this.id,
                    "lat": this.loc.latitude,
                    "long": this.loc.longitude,
                    "peekID": peek_id,
                    "version": this.version
                };
                return this.get("getPeekMessages", params);
            },
            peek_anywhere: function (lat, long) {
                var params = {
                    "lat": lat,
                    "long": long,
                    "userID": this.id,
                    "userLat": this.loc.latitude,
                    "userLong": this.loc.longitude,
                    "version": this.version
                };
                return this.get("yaks", params);
            }
        }),

        Yak: WinJS.Class.define(function (client, raw) {
            this.client = client;
            this.poster_id = raw.posterID;
            this.hide_pin = Boolean(parseInt(raw.hidePin));
            this.handle = (!raw.handle ? "" : raw.handle);
            this.message_id = raw.messageID.replace('\\', '');
            this.delivery_id = raw.deliveryID;
            this.longitude = raw.longitude;
            this.comments = parseInt(raw.comments);
            this.time = raw.time;
            this.latitude = raw.latitude;
            this.likes = parseInt(raw.numberOfLikes);
            this.message = raw.message;
            this.type = raw.type;
            this.liked = parseInt(raw.liked);
            this.reyaked = raw.reyaked;

            Object.defineProperties(this, {
                "comments_pretty": {
                    enumerable: true,
                    get: function () {
                        if (this.comments > 0) {
                            var comments_pretty = this.comments;
                            if (this.comments > 1) {
                                comments_pretty += " replies";
                            }
                            else {
                                comments_pretty += " reply";
                            }

                            return comments_pretty;
                        }
                        else {
                            return "";
                        }
                    }
                },

                "time_pretty": {
                    enumerable: true,
                    get: function () {
                        return API.parse_time(this.time);
                    }
                },

                "upvote": {
                    enumerable: true,
                    get: function () {
                        if (this.liked === 1) {
                            return "yak_up yak_voted";
                        }
                        else {
                            return "yak_up";
                        }
                    }
                },

                "downvote": {
                    enumerable: true,
                    get: function () {
                        if (this.liked === -1) {
                            return "yak_down yak_voted";
                        }
                        else {
                            return "yak_down";
                        }
                    }
                }
            });

        }, {
            upvote_yak: function () {
                if (this.liked === 0) {
                    this.liked += 1;
                    this.likes += 1;
                    return this.client.upvote_yak(this.message_id);
                }
            },
            downvote_yak: function () {
                if (this.liked === 0) {
                    this.liked -= 1;
                    this.likes -= 1;
                    return this.client.downvote_yak(this.message_id);
                }
            },
            report_yak: function () {
                return this.client.report_yak(this.message_id);
            },
            delete_yak: function () {
                if (this.poster_id == this.id) {
                    return this.client.delete_yak(this.message_id);
                }
            },
            add_comment: function (comment) {
                return this.client.post_comment(this.message_id, comment);
            },
            get_comments: function () {
                return this.client.get_comments(this.message_id);
            }
        }),


        Comment: WinJS.Class.define(function (client, raw, message_id) {
            this.client = client;
            this.message_id = message_id;
            this.comment_id = raw.commentID.replace('\\', '');
            this.comment = raw.comment;
            this.time = raw.time;
            this.likes = parseInt(raw.numberOfLikes);
            this.poster_id = raw.posterID;
            this.liked = parseInt(raw.liked);

            Object.defineProperties(this, {
                "time_pretty": {
                    enumerable: true,
                    get: function () {
                        return API.parse_time(this.time);
                    }
                },

                "upvote": {
                    enumerable: true,
                    get: function () {
                        if (this.liked === 1) {
                            return "yak_up yak_voted";
                        }
                        else {
                            return "yak_up";
                        }
                    }
                },

                "downvote": {
                    enumerable: true,
                    get: function () {
                        if (this.liked === -1) {
                            return "yak_down yak_voted";
                        }
                        else {
                            return "yak_down";
                        }
                    }
                }
            });

        }, {
            upvote_comment: function() {
                if(this.liked === 0) {
                    this.likes += 1;
                    this.liked += 1;
                    return this.client.upvote_comment(this.comment_id);
                }
            },
            downvote_comment: function() {
                if(this.liked === 0) {
                    this.likes -= 1;
                    this.liked -= 1;
                    return this.client.downvote_comment(this.comment_id);
                }
            },
            report_comment: function() {
                return this.client.report_comment(this.comment_id, this.message_id);
            },
            delete_comment: function() {
                if(this.poster_id == this.id) {
                    return this.client.delete_comment(this.comment_id, this.message_id);
                }
            },
            reply: function(comment) {
                return this.client.post_comment(this.message_id, comment);
            }
        })
    });
})();
