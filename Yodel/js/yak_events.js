(function () {

    function yak_vote(event) {
        var yakker = this.client;

        var target = $(event.target);
        var sibling = target.siblings(".yak_voted");

        if (!target.hasClass("yak_voted") && !sibling.length) {
            target.addClass("yak_voted");
            var vote_count_ele = target.siblings(".yak_votecount");
            var orig_vote_count = parseInt(vote_count_ele.text());
            var message_id = target.parents(".yak_container").data("mid");
            if (this.vote == "up") {
                var promise = yakker.upvote_yak(message_id);
                vote_count_ele.text(orig_vote_count + 1);
            }
            else if (this.vote == "down") {
                var promise = yakker.downvote_yak(message_id);
                vote_count_ele.text(orig_vote_count - 1);
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

    WinJS.Namespace.define("Yodel", {
        vote: yak_vote
    });
})();