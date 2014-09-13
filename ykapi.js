function Location(latitude, longitude, delta) {
    this.latitude = latitude;
    this.longitude = longitude;
    if(delta == null) {
        delta = "0.030000";
    }
    this.delta = delta;
}

function Comment(raw, message_id, client) {
    this.client = client;
    this.message_id = message_id;
    this.comment_id = raw["commentID"];
    this.comment = raw["comment"];
    this.time = parse_time(raw["time"]);
    this.likes = parseInt(raw["numberOfLikes"]);
    this.poster_id = raw["posterID"];
    this.liked = parseInt(raw["liked"]);
    
    this.upvote = function() {
        if(this.liked == 0) {
            this.likes += 1;
            this.liked += 1;
            return this.client.upvote_comment(this.comment_id);
        }
    }
    this.downvote = function() {
        if(this.liked == 0) {
            this.likes -= 1;
            this.liked += 1;
            return this.client.downvote_comment(this.comment_id);
        }
    }
    this.report = function() {
        return this.client.report_comment(this.comment_id, this.message_id);
    }
    this.delete = function() {
        if(this.poster_id == this.client.id) {
            return this.client.delete_comment(this.comment_id, this.message_id);
        }
    }
    this.reply = function(comment) {
        return this.client.post_comment(this.message_id, comment);
    }
    this.get_comment_pretty = function() {
        var my_action = "";
        if(this.liked > 0) {
            my_action = "^";
        }
        else if(self.liked < 0) {
            my_action = "v";
        }
        return my_action + "(" + this.likes + ") " + this.comment;
    }
}

function Yak(raw, client) {
    this.client = client;
    this.poster_id = raw["posterID"];
    this.hide_pin = bool(int(raw["hidePin"]));
    this.handle = raw["handle"];
    this.message_id = raw["messageID"];
    this.delivery_id = raw["deliveryID"];
    this.longitude = raw["longitude"];
    this.comments = int(raw["comments"]);
    this.time = parse_time(raw["time"]);
    this.latitude = raw["latitude"];
    this.likes = int(raw["numberOfLikes"]);
    this.message = raw["message"];
    this.type = raw["type"];
    this.liked = int(raw["liked"]);
    this.reyaked = raw["reyaked"];
    
    this.upvote = function() {
        if(this.liked == 0) {
            this.liked += 1;
            this.likes += 1;
            return this.client.upvote_yak(this.message_id);
        }
    }
    this.downvote = function() {
         if(this.liked == 0) {
            this.liked -= 1;
            this.likes += 1;
            return this.client.downvote_yak(this.message_id);
        }       
    }
    this.report = function() {
        return this.client.report_yak(this.message_id);
    }
    this.delete = function() {
        if(this.poster_id == this.client.id) {
            return this.client.delete_yak(this.message_id);
        }
    }
    this.add_comment = function() {
        return this.client.post_comment(this.message_id, comment);
    }
    this.get_comments = function() {
        return this.client.get_comments(this.message_id);
    }
    this.get_yak_pretty = function() {
        if(this.handle != null) {
            return this.message;
        }
    }
}

function Yakker(user_id, loc, force_register) {
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

    this.gen_id = function() {
        CryptoJS.MD5(Math.floor(100000 + Math.random() * 900000)).toUppercase();
    }
    this.register_id_new = function(id) {
        params = {
            "userID": id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude,
        }
        result = this.get("registerUser", params);
        return result;
    }
    this.sign_request = function(page, params) {
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
        var hash = B64.encode(h);
        
        /* Add signature to request */
        params["hash"] = hash;
        params["salt"] = salt;
    }
    this.get = function(page, params) {
        url = this.base_url + page;

        this.sign_request(page, params);

        if(params.length > 0) {
            url += "?" + encodeURIComponent(params);
        }
        
        var headers = {
            "User-Agent": this.user_agent,
            "Accept-Encoding": "gzip"
        }

        /* HTTP CLIENT REQUEST */
        
        var response = "";
        return response;    
    }
    this.get_yak_list = function(page, params) {
        return this.parse_yaks(this.get(page, params));
    }
    this.parse_yaks = function(text) {
        raw_yaks = text["messages"];
        yaks = [];
        for(var raw_yak in raw_yaks) {
            yaks.push(Yak(raw_yak, self));
        }
        return yaks;
    }
    this.parse_comments = function(text, message_id) {
        raw_comments = text["comments"];
        comments = [];
        for(var raw_comment in raw_comments) {
            comments.push(Comment(raw_comment, message_id, self));
        }
        return comments;
    }
    this.contact = function(message) {
        params = {
            "userID": this.id,
            "message": message
        }
        return this.get("contactUs", params);
    }
    this.upvote_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("likeMessage", params);
    }
    this.downvote_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("downvoteMessage", params);
    }
    this.upvote_comment = function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("likeComment", params);
    }
    this.downvote_comment = function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("downvoteMessage", params);
    }
    this.report_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("reportMessage", params);
    }
    this.delete_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("deleteMessage2", params);
    }
    this.report_comment = function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("reportMessage", params);
    }
    this.delete_comment = function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("deleteComment", params);
    }
    this.get_greatest = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getGreatest", params);
    }
    this.get_my_tops = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getMyTops", params);
    }
    this.get_recent_replied = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getMyRecentReplies", params);
    }
    this.update_location = function(loc) {
        this.loc = loc;
    }
    this.get_my_recent_yaks = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getMyRecentYaks", params);
    }
    this.get_area_tops = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getAreaTops", params);
    }
    this.get_yaks = function() {
        params = {
            "userID": this.id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get_yak_list("getMessages", params);
    }
    this.post_yak = function(message, showloc, handle) {
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
    }
    this.get_comments = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.parse_comments(this.get("getComments", params), message_id);
    }
    this.post_comment = function(message_id, comment) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "comment": comment,
            "lat": this.loc.latitude,
            "long": this.loc.longitude
        }
        return this.get("postComment", params);
    }
    this.peek = function(loc) {
        params = {
            "userID": this.id,
            "lat": loc.latitude,
            "long": loc.longitude,
            "delta": loc.delta
        }
        return this.get_yak_list("getPeekMessages", params);
    }
}
