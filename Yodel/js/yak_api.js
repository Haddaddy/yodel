function parse_time(timestr) {
    var format = "YYYY-MM-DD HH:mm:ss";
    return moment.tz(timestr, format, "America/New_York").twitter();
}

var Location = WinJS.Class.define(function(latitude, longitude, delta) {
    this.latitude = latitude;
    this.longitude = longitude;
    if(delta == null) {
        delta = "0.030000";
    }
    this.delta = delta;
});

var PeekLocation = WinJS.Class.define(function(raw) {
    this.id = raw["peekID"];
    this.can_submit = Boolean(raw["canSubmit"]);
    this.name = raw["location"];
    var lat = raw["latitude"];
    var lon = raw["longitude"];
    var d = raw["delta"];
    this.location = new Location(lat, lon, d);
});

var Yakker = WinJS.Class.define(function(user_id, loc) {
    this.base_url = "https://yikyakapp.com/api/";
    this.user_agent = "android-async-http/1.4.4 (http://loopj.com/android-async-http)";

    if(loc == null) {
        loc = [0,0];
    }
    
    this.loc = loc;

    if (!user_id || user_id == "") {
        user_id = this.gen_id();
        this.register_id_new(user_id).then(function (response) {
            if (response.isSuccessStatusCode) {
                Windows.Storage.ApplicationData.current.roamingSettings.values["yakker_id"] = user_id;
            }
        });
    }

    this.id = user_id;
    this.handle = null;
    
    }, {
    gen_id: function() {
        var hashIn = String(Math.floor(100000 + Math.random() * 900000));
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
        }
        return this.get("registerUser", params);
    },
    sign_request: function(page, params) {
        var key = "35FD04E8-B7B1-45C4-9886-94A75F4A2BB4";
        // Salt is current time (in sec) since epoch
        var salt = String(Math.floor(new Date().getTime() / 1000));
        
        var msg = "/api/" + page;
        var sorted_params = Object.keys(params);
        console.log(sorted_params);
        console.log(params);
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
        var keyMaterial = winCrypt.CryptographicBuffer.convertStringToBinary(key, winCrypt.BinaryStringEncoding.Utf8);
        var macKey = macAlgorithm.createKey(keyMaterial);
        var tbs = winCrypt.CryptographicBuffer.convertStringToBinary(msg, winCrypt.BinaryStringEncoding.utf8);
        var sigBuffer = winCrypt.Core.CryptographicEngine.sign(macKey, tbs);
        var sig = winCrypt.CryptographicBuffer.encodeToBase64String(sigBuffer).trim();

        return { "hash": sig, "salt": salt };
    },
    encode_params: function(params) {
        var param_keys = Object.keys(params);
        if (param_keys.length > 0) {
            var query = "?";
            for (var param in param_keys) {
                query += param_keys[param] + "=" + encodeURIComponent(params[param_keys[param]]) + "&";
            }
            query = query.slice(0, -1);
        }
        return query;
    },
    get: function(page, params) {
        url = this.base_url + page;

        var signed = this.sign_request(page, params);
        params["hash"] = signed.hash;
        params["salt"] = signed.salt;

        var query = this.encode_params(params);

        var httpClient = new Windows.Web.Http.HttpClient();
        headers = httpClient.defaultRequestHeaders;
        headers.userAgent.parseAdd(this.user_agent);
        headers.accept.parseAdd("*/*");
        headers.acceptEncoding.parseAdd("gzip");

        console.log(params);
        url = Windows.Foundation.Uri(url + query);

        return httpClient.getAsync(url);
    },
    post: function (page, params) {
        url = this.base_url + page;

        var signed = this.sign_request(page, params);

        var query = this.encode_params(params);

        var httpClient = new Windows.Web.Http.HttpClient();
        headers = httpClient.defaultRequestHeaders;
        headers.userAgent.parseAdd(this.user_agent);
        headers.acceptEncoding.parseAdd("gzip");

        console.log(params);
        url = Windows.Foundation.Uri(url + query);

        return httpClient.postAsync(url, signed);
    },
    parse_yaks: function(text) {
        var raw_yaks = text["messages"];
        var yaks = [];
        for (var raw_yak in raw_yaks) {
            yaks.push(new Yak(this, raw_yaks[raw_yak]));
        }
        return yaks;
    },
    parse_comments: function(text, message_id) {
        var raw_comments = text["comments"];
        var comments = [];
        for(var raw_comment in raw_comments) {
            comments.push(new Comment(this, raw_comments[raw_comment], message_id));
        }
        return comments;
    },
    contact: function(message) {
        params = {
            "userID": this.id,
            "message": message
        }
        return this.get("contactUs", params);
    },
    upvote_yak: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("likeMessage", params);
    },
    downvote_yak: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("downvoteMessage", params);
    },
    upvote_comment: function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("likeComment", params);
    },
    downvote_comment: function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("downvoteComment", params);
    },
    report_yak: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("reportMessage", params);
    },
    delete_yak: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("deleteMessage2", params);
    },
    report_comment: function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("reportMessage", params);
    },
    delete_comment: function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("deleteComment", params);
    },
    get_greatest: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getGreatest", params);
    },
    get_my_tops: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getMyTops", params);
    },
    get_recent_replied: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getMyRecentReplies", params);
    },
    update_location: function(loc) {
        this.loc = loc;
    },
    get_my_recent_yaks: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getMyRecentYaks", params);
    },
    get_area_tops: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getAreaTops", params);
    },
    get_yaks: function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getMessages", params);
    },
    post_yak: function(message, showloc, handle) {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude,
            "message": message
        }
        if(showloc == null) {
            params["hidePin"] = "1";
        }
        if(handle && this.handle != null) {
            params["hndl"] = this.handle;
        }
        return this.post("sendMessage", params);
    },
    get_comments: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("getComments", params);
    },
    post_comment: function(message_id, comment) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "comment": comment,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.post("postComment", params);
    },
    peek: function (peek_id) {
        if (peek_id instanceof PeekLocation) {
            peek_id = peek_id.id;
        }
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude,
            "peekID": peek_id
        }
        return this.get("getPeekMessages", params);
    }
});

var Comment = WinJS.Class.define(function (client, raw, message_id) {
    this.client = client;
    this.message_id = message_id;
    this.comment_id = raw["commentID"];
    this.comment = raw["comment"];
    this.time = parse_time(raw["time"]);
    this.likes = parseInt(raw["numberOfLikes"]);
    this.poster_id = raw["posterID"];
    this.liked = parseInt(raw["liked"]);
    }, {
    upvote_comment: function() {
        if(this.liked == 0) {
            this.likes += 1;
            this.liked += 1;
            return this.client.upvote_comment(this.comment_id);
        }
    },
    downvote_comment: function() {
        if(this.liked == 0) {
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
});

var Yak = WinJS.Class.define(function(client, raw) {
    this.client = client;
    this.poster_id = raw["posterID"];
    this.hide_pin = Boolean(parseInt(raw["hidePin"]));
    this.handle = (raw["handle"] == null ? "" : raw["handle"]);
    this.message_id = raw["messageID"];
    this.delivery_id = raw["deliveryID"];
    this.longitude = raw["longitude"];
    this.comments = parseInt(raw["comments"]);
    this.time = parse_time(raw["time"]);
    this.latitude = raw["latitude"];
    this.likes = parseInt(raw["numberOfLikes"]);
    this.message = raw["message"];
    this.type = raw["type"];
    this.liked = parseInt(raw["liked"]);
    this.reyaked = raw["reyaked"];
    }, {
    upvote_yak: function() {
        if(this.liked == 0) {
            this.liked += 1;
            this.likes += 1;
            return this.client.upvote_yak(this.message_id);
        }
    },
    downvote_yak: function() {
         if(this.liked == 0) {
            this.liked -= 1;
            this.likes += 1;
            return this.client.downvote_yak(this.message_id);
        }       
    },
    report_yak: function() {
        return this.client.report_yak(this.message_id);
    },
    delete_yak: function() {
        if(this.poster_id == this.id) {
            return this.client.delete_yak(this.message_id);
        }
    },
    add_comment: function() {
        return this.client.post_comment(this.message_id, comment);
    },
    get_comments: function() {
        return this.client.get_comments(this.message_id);
    }
});
