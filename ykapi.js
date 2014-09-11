/* Ported from Joseph Connor's API library "pyak" */

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
            return this.handle + ":" + this.message);
        }
    }
}

function Yakker(user_id, location, force_register) {
    this.base_url = "http://yikyakapp.com/api/";
    this.user_agent = "android-async-http/1.4.4 (http://loopj.com/android-async-http)";

    if(location == null) {
        location = [0,0];
    }

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
        md5(Math.floor(100000 + Math.random() * 900000)).toUppercase();
        /* NOT VALID */
    }
    this.register_id_new = function(id) {
        params = {
            "userID": id,
            "lat": this.location.latitude;
            "long": this.location.longitude;
        }
        result = this.get("registerUser", params);
        return result;
    }
    this.get = function(page, params) {
        url = this.base_url + page;

        this.sign_request(page, params);

        if(params.length > 0) {
            url += "?" + encodeURIComponent(params);
        }
        
        headers = {
            "User-Agent": this.user_agent,
            "Accept-Encoding": "gzip"
        }

        /* AJAX */
    }
    this.sign_request = function(page, params) {
        key = "35FD04E8-B7B1-45C4-9886-94A75F4A2BB4";
        salt = str(Math.round(new Date().getTime() / 1000));
        msg = "/api/" + page;
        
        /* TODO */
    }
    this.get_yak_list = function(page, params) {
        return this.parse_yaks(this.get(page, params));
    }
    this.parse_yaks = function(text) {
        /* TODO */
    }
    this.parse_comments = function(text, message_id) {
        /* TODO */
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
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("likeMessage", params);
    }
    this.downvote_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("downvoteMessage", params);
    }
    this.upvote_comment = function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("likeComment", params);
    }
    this.downvote_comment = function(comment_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("downvoteMessage", params);
    }
    this.report_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("reportMessage", params);
    }
    this.delete_yak = function(message_id) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("deleteMessage2", params);
    }
    this.report_comment = function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("reportMessage", params);
    }
    this.delete_comment = function(comment_id, message_id) {
        params = {
            "userID": this.id,
            "commentID": comment_id,
            "messageID": message_id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("deleteComment", params);
    }
    this.get_greatest = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getGreatest", params);
    }
    this.get_my_tops = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getMyTops", params);
    }
    this.get_recent_replied = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getMyRecentReplies", params);
    }
    this.update_location = function(location) {
        this.location = location;
    }
    this.get_my_recent_yaks = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getMyRecentYaks", params);
    }
    this.get_area_tops = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getAreaTops", params);
    }
    this.get_yaks = function() {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get_yak_list("getMessages", params);
    }
    this.post_yak = function(message, showloc, handle) {
        params = {
            "userID": this.id,
            "lat": this.location.latitude,
            "long": this.location.longitude,
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
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.parse_comments(this.get("getComments", params), message_id);
    }
    this.post_comment = function(message_id, comment) {
        params = {
            "userID": this.id,
            "messageID": message_id,
            "comment": comment,
            "lat": this.location.latitude,
            "long": this.location.longitude
        }
        return this.get("postComment", params);
    }
    this.peek = function(location) {
        params = {
            "userID": this.id,
            "lat": location.latitude,
            "long": location.longitude,
            "delta": location.delta
        }
        return this.get_yak_list("getPeekMessages", params);
    }
}
