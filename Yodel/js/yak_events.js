(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("Yodel", {
        vote: function(event) {
            var yakker = this.client;

            var target = $(event.target);
            var sibling = target.siblings(".yak_voted");

            if (!target.hasClass("yak_voted") && !sibling.length) {
                target.addClass("yak_voted");
                var vote_count_ele = target.siblings(".yak_votecount");
                var orig_vote_count = parseInt(vote_count_ele.text());
                var promise = null;

                switch (this.type) {
                    case "yak":
                        var message_id = target.parents(".yak_container").data("mid");
                        var index = parseInt(target.parents(".win-template").attr("aria-posinset"));
                        var datasource = Yodel.data[target.parents(".feed_container").attr("id")];
                        break;
                    case "comment":
                        var comment_id = target.parents(".yak_container").data("cid");
                }

                switch (this.direction) {
                    case "up":
                        vote_count_ele.text(orig_vote_count + 1);
                        switch (this.type) {
                            case "yak":
                                var promise = yakker.upvote_yak(message_id);
                                datasource[index].upvote += " yak_voted";
                                datasource[index].likes += 1;
                                break;
                            case "comment":
                                var promise = yakker.upvote_comment(comment_id);
                                break;
                        }
                        break;
                    case "down":
                        vote_count_ele.text(orig_vote_count - 1);
                        switch (this.type) {
                            case "yak":
                                var promise = yakker.downvote_yak(message_id);
                                datasource[index].downvote += " yak_voted";
                                datasource[index].likes -= 1;
                                break;
                            case "comment":
                                var promise = yakker.downvote_comment(comment_id);
                                break;
                        }
                        break;
                }

                Yodel.data.pivot["yakarma"] = parseInt(Yodel.data.pivot["yakarma"]) + 1;

                if (promise) {
                    var that = this;
                    promise.then(function (response) {
                        console.log(response);
                        if (!response.isSuccessStatusCode) {
                            target.removeClass("yak_voted");
                            vote_count_ele.text(orig_vote_count);
                            if (that.type == "yak") {
                                datasource[index].likes = orig_vote_count;
                                datasource[index].upvote = "yak_up";
                                datasource[index].downvote = "yak_down";
                                Yodel.data.pivot["yakarma"] = parseInt(Yodel.data.pivot["yakarma"]) - 1;
                            }
                        }
                    });
                }
                else {
                    // throw error
                }
            }
        },

        to_peek_feed: function(event) {
            var target = $(event.target);
            var peek_id = target.find(".list_item").data("pid");
            var peek_name = target.find(".list_item span").text();
            WinJS.Namespace.define("Yodel", { peek_pivot_last_index: event.detail.itemIndex });

            nav.navigate("/pages/peek/peek.html", {name: peek_name, id: peek_id, can_submit: false}).done(function () {
                var feed = new Yodel.feed;
                feed.load("peek", { "peek_id": peek_id });
            });
        },

        to_comments: function(event) {
            var target = $(event.target);
            var message_id = target.closest(".yak_container").data("mid");
            var index = parseInt(target.parents(".win-template").attr("aria-posinset"));
            var feed_container_id = target.parents(".feed_container").attr("id");
            var yak = Yodel.data[feed_container_id][index];

            nav.navigate("/pages/comments/comments.html").then(function () {
                var appbar = $("#appbar")[0].winControl;
                appbar.disabled = true;
            }).done(function () {
                var feed = new Yodel.feed;
                feed.load("comments", { "message_id": message_id, "prev": yak });
            });
        }
    });
})();
