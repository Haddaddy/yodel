(function () {

    function yak_vote(event) {
        var yakker = this.client;

        var target = $(event.target);
        var sibling = target.siblings(".yak_voted");

        if (!target.hasClass("yak_voted") && !sibling.length) {
            target.addClass("yak_voted");
            var vote_count_ele = target.siblings(".yak_votecount");
            var orig_vote_count = parseInt(vote_count_ele.text());

            switch (this.type) {
                case "yak":
                    var message_id = target.parents(".yak_container").data("mid");
                    var index = parseInt(target.parents(".win-item").attr("aria-posinset")) - 1;
                    var datasource = Yodel.nearby_last;
                    break;
                case "comment":
                    var comment_id = target.parents(".yak_container").data("cid");
            }

            switch (this.vote) {
                case "up":
                    vote_count_ele.text(orig_vote_count + 1);
                    switch (this.type) {
                        case "yak":
                            var promise = yakker.upvote_yak(message_id);
                            datasource[index].liked = 1;
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
                            datasource[index].liked = -1;
                            datasource[index].likes -= 1;
                            break;
                        case "comment":
                            var promise = yakker.downvote_comment(comment_id);
                            break;
                    }
                    break;
            }

            if (typeof promise != undefined) {
                promise.then(function (response) {
                    console.log(response);
                    if (!response.isSuccessStatusCode) {
                        target.removeClass("yak_voted");
                        vote_count_ele.text(orig_vote_count);
                    }
                });
            }
        }
    }

    function to_comments(event) {
        var target = $(event.target);
        var message_id = target.find(".yak_container").data("mid");
        var index = parseInt(target.children(".win-item").attr("aria-posinset")) - 1;

        WinJS.Navigation.navigate("/pages/comments/comments.html").then(function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = true;
        }).done(function () {
            Yodel.load_comments(message_id, index);
        });
    }

    WinJS.Namespace.define("Yodel", {
        vote: yak_vote,
        to_comments: to_comments
    });
})();
