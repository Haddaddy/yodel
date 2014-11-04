(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("Yodel", {
        vote: function(event) {
            var yakker = Yodel.handle;

            var target = $(event.target);
            var sibling = target.siblings(".yak_voted");

            if (!target.hasClass("yak_voted") && !sibling.length) {
                target.addClass("yak_voted");
                var vote_count_ele = target.siblings(".yak_votecount");
                var orig_vote_count = parseInt(vote_count_ele.text());
                var promise = null;

                var index = parseInt(target.parents(".win-template").attr("aria-posinset"));
                var datasource = Yodel.data[this.feed];

                if (this.feed != "comments") {
                    var message_id = target.parents(".yak_container").data("mid");
                }
                else {
                    var comment_id = target.parents(".yak_container").data("cid");
                }

                switch (this.direction) {
                    case "up":
                        vote_count_ele.text(orig_vote_count + 1);
                        datasource[index].upvote += " yak_voted";
                        datasource[index].likes += 1;

                        if (this.feed != "comments") {
                            var promise = yakker.upvote_yak(message_id);
                        }
                        else {
                            var promise = yakker.upvote_comment(comment_id);
                        }
                        break;
                    case "down":
                        vote_count_ele.text(orig_vote_count - 1);
                        datasource[index].downvote += " yak_voted";
                        datasource[index].likes -= 1;

                        if(this.feed != "comments") {
                            var promise = yakker.downvote_yak(message_id);
                        }
                        else {
                            var promise = yakker.downvote_comment(comment_id);
                        }
                }

                Yodel.data.pivot["yakarma"] = parseInt(Yodel.data.pivot["yakarma"]) + 1;

                if (promise) {
                    var that = this;
                    promise.then(function (response) {
                        console.log(response);
                        if (!response.isSuccessStatusCode) {
                            target.removeClass("yak_voted");
                            vote_count_ele.text(orig_vote_count);
                            datasource[index].likes = orig_vote_count;
                            datasource[index].upvote = "yak_up";
                            datasource[index].downvote = "yak_down";
                            Yodel.data.pivot["yakarma"] = parseInt(Yodel.data.pivot["yakarma"]) - 1;
                        }
                    });
                }
                else {
                    Yodel.popup_error("Something's gone horribly wrong. Error: no Promise in yak_events.vote", "Uh-oh.");
                }
            }
        },

        to_peek_feed: function(event) {
            var target = $(event.target);
            var peek_id = target.find(".list_item").data("pid");
            var peek_name = target.find(".list_item span").text();
            Yodel.last_index.peek_pivot = event.detail.itemIndex;

            nav.navigate("/pages/feed/feed.html", {
                method: "peek",
                title: peek_name,
                can_submit: false,
                id: peek_id
            });
        },

        to_comments: function(event) {
            var target = $(event.target);
            var message_id = target.closest(".yak_container").data("mid");
            var index = parseInt(target.parents(".win-template").attr("aria-posinset"));
            var yak = Yodel.data[this.feed][index];

            nav.navigate("/pages/comments/comments.html", {
                "message_id": message_id,
                "yak": yak,
                "can_submit": nav.state.can_submit
            });
        },

        to_reply: function (event) {
            nav.navigate("/pages/post/post.html", {
                "message_id": nav.state.message_id,
                "type": "comment"
            });
        },

        to_me_feed: function(event) {
            var detail = event.detail.itemPromise._value.data;

            nav.navigate("/pages/feed/feed.html", {
                method: detail.link,
                title: detail.title,
                can_submit: true
            });
        },
    });
})();
