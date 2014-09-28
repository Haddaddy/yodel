(function () {

    function yak_vote(event) {
        var yakker = this.client;

        var target = $(event.target);
        var sibling = target.siblings(".yak_voted");

        var index = parseInt(target.parents(".win-item").attr("aria-posinset")) - 1;
        var datasource = Yodel.nearby_last;

        if (!target.hasClass("yak_voted") && !sibling.length) {
            target.addClass("yak_voted");
            var vote_count_ele = target.siblings(".yak_votecount");
            var orig_vote_count = parseInt(vote_count_ele.text());
            var message_id = target.parents(".yak_container").data("mid");
            if (this.vote == "up") {
                var promise = yakker.upvote_yak(message_id);
                vote_count_ele.text(orig_vote_count + 1);
                datasource[index].liked = 1;
                datasource[index].likes += 1;
            }
            else if (this.vote == "down") {
                var promise = yakker.downvote_yak(message_id);
                vote_count_ele.text(orig_vote_count - 1);
                datasource[index].liked = -1;
                datasource[index].likes -= 1;
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
        WinJS.Navigation.navigate("/pages/comments/comments.html").then(function () {
            var appbar = $("#appbar")[0].winControl;
            appbar.disabled = true;
        }).done(function () {
            Yodel.load_comments(message_id);
        });
    }

    WinJS.Namespace.define("Yodel", {
        vote: yak_vote,
        to_comments: to_comments
    });
})();
