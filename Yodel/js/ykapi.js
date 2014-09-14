function parse_time(timestr) {
    format = "YYYY-MM-DD HH:mm:ss";
    return moment(timestr, format).format("X");
}

var Location = WinJS.Class.define(function(latitude, longitude, delta) {
    this.latitude = latitude;
    this.longitude = longitude;
    if(delta == null) {
        delta = "0.030000";
    }
    this.delta = delta;
});

var Yakker = WinJS.Class.define(function(user_id, loc, force_register) {
    this.base_url = "http://yikyakapp.com/api/";
    this.user_agent = "android-async-http/1.4.4 (http://loopj.com/android-async-http)";

    if(loc == null) {
        loc = [0,0];
    }
    
    this.loc = loc;

    if(user_id == null) {
        user_id = this.gen_id();
        this.register_id_new(user_id);
    }
    else if(force_register) {
        self.register_id_new(user_id);
    }

    this.id = user_id;
    this.handle = null;
    
    }, {
    gen_id: function() {
        CryptoJS.MD5(Math.floor(100000 + Math.random() * 900000)).toUppercase();
    },
    register_id_new: function(id) {
        params = {
            "userID": id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude,
        }
        result = this.get("registerUser", params);
        return result;
    },
    sign_request: function(page, params) {
        var key = "35FD04E8-B7B1-45C4-9886-94A75F4A2BB4";
        /* Salt is current time (in sec) since epoch */
        var salt = String(Math.round(new Date().getTime() / 1000));
        
        var msg = "/api/" + page;
        var sorted_params = Object.keys(params);
        sorted_params.sort();
        
        if(sorted_params.length > 0) {
            msg += "?";
        }
        for(var param in sorted_params) {
            msg += param + "=" + params[param] + "&";
        }
        /* Chop off last ampersand */
        if(sorted_params.length > 0) {
            msg = msg.slice(0, -1);
        }
        
        msg += salt;
        
        /* Calculate signature */
        var h = CryptoJS.HmacSHA1(msg, key);
        var hash = h.toString(CryptoJS.enc.Base64);

        /* Add signature to request */
        params["hash"] = hash;
        params["salt"] = salt;
    },
    get: function(page, params) {
        url = this.base_url + page;

        this.sign_request(page, params);

        var param_keys = Object.keys(params);
        if (param_keys.length > 0) {
            var query = "?";
            for (var param in param_keys) {
                query += param_keys[param] + "=" + encodeURIComponent(params[param_keys[param]]) + "&";
            }
            query = query.slice(0, -1);
        }

        var httpClient = new Windows.Web.Http.HttpClient();
        headers = httpClient.defaultRequestHeaders;
        headers.userAgent.parseAdd(this.user_agent);
        headers.acceptEncoding.parseAdd("gzip");

        console.log(params);
        url = Windows.Foundation.Uri(url + query);

        return httpClient.getAsync(url);
    },
    parse_yaks: function(text) {
        raw_yaks = text["messages"];
        var yaks = new Array();
        for (var raw_yak in raw_yaks) {
            yaks.push(new Yak(raw_yaks[raw_yak]));
        }
        return yaks;
    },
    parse_comments: function(text, message_id) {
        raw_comments = text["comments"];
        comments = [];
        for(var raw_comment in raw_comments) {
            comments.push(new Comment(raw_comment, message_id));
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
        return this.get("downvoteMessage", params);
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
        return this.get("sendMessage", params);
    },
    get_comments: function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.parse_comments(this.get("getComments", params), message_id);
    },
    post_comment: function(message_id, comment) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "comment": comment,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("postComment", params);
    },
    peek: function(loc) {
        params = {
            "userID": this.id,
            "lat": loc.latitude,
            "long": loc.longitude,
            "delta": loc.delta
        }
        return this.get("getPeekMessages", params);
    }
});

var Comment = WinJS.Class.define(function(raw, message_id) {
    this.message_id = message_id;
    this.comment_id = raw["commentID"];
    this.comment = raw["comment"];
    this.time = parse_time(raw["time"]);
    this.likes = parseInt(raw["numberOfLikes"]);
    this.poster_id = raw["posterID"];
    this.liked = parseInt(raw["liked"]);
    }, {
    upvote: function() {
        if(this.liked == 0) {
            this.likes += 1;
            this.liked += 1;
            return this.upvote_comment(this.comment_id);
        }
    },
    downvote: function() {
        if(this.liked == 0) {
            this.likes -= 1;
            this.liked += 1;
            return this.downvote_comment(this.comment_id);
        }
    },
    report: function() {
        return this.report_comment(this.comment_id, this.message_id);
    },
    delete: function() {
        if(this.poster_id == this.id) {
            return this.delete_comment(this.comment_id, this.message_id);
        }
    },
    reply: function(comment) {
        return this.post_comment(this.message_id, comment);
    }
});

var Yak = WinJS.Class.define(function(raw) {
    this.poster_id = raw["posterID"];
    this.hide_pin = Boolean(parseInt(raw["hidePin"]));
    this.handle = raw["handle"];
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
    upvote: function() {
        if(this.liked == 0) {
            this.liked += 1;
            this.likes += 1;
            return this.upvote_yak(this.message_id);
        }
    },
    downvote: function() {
         if(this.liked == 0) {
            this.liked -= 1;
            this.likes += 1;
            return this.downvote_yak(this.message_id);
        }       
    },
    report: function() {
        return this.report_yak(this.message_id);
    },
    delete: function() {
        if(this.poster_id == this.id) {
            return this.delete_yak(this.message_id);
        }
    },
    add_comment: function() {
        return this.post_comment(this.message_id, comment);
    },
    get_comments: function() {
        return this.get_comments(this.message_id);
    }
});
