(function () {
    "use strict";

    var nav = WinJS.Navigation;

    var _pullBoxHeight = 80;
    var MS_MANIPULATION_STATE_ACTIVE = 1; // A contact is touching the surface and interacting with content
    var MS_MANIPULATION_STATE_INERTIA = 2; // The content is still moving, but contact with the surface has ended 
    
    WinJS.Namespace.define("Yodel.UI", {
        PTR: WinJS.Class.define(function () {
            // Setup variables
            this._outerScroller = document.querySelector(".outer_scroller");
            this._innerScroller = document.querySelector(".inner_scroller");
            this._pullLabel = document.querySelector(".pull_label");
            this._pullArrow = document.querySelector(".pull_arrow");
        }, {
            init: function () {
                // Set the initial scroll past the pull box
                document.querySelector(".pull_box").style.visibility = "visible";
                this._outerScroller.scrollTop = _pullBoxHeight;

                // Update the arrow rotation based on scroll postion
                this._outerScroller.addEventListener("scroll", this.onScroll.bind({ context: this }));

                // Listen for panning events (different than scroll) and detect when we're in the over pan state
                this._outerScroller.addEventListener("MSManipulationStateChanged", this.onManipualationStateChanged.bind({ context: this }));
            },

            onScroll: function (e) {
                var rotationAngle = 180 * ((_pullBoxHeight - e.target.scrollTop) / _pullBoxHeight) + 90;
                this.context._pullArrow.style.transform = "rotate(" + rotationAngle + "deg)";

                // Change the label once you pull to the top
                if (e.target.scrollTop === 0) {
                    this.context._pullLabel.innerText = "Release to refresh";
                }
                else {
                    this.context._pullLabel.innerText = "Pull to refresh";
                }
            },

            onManipualationStateChanged: function (e) {
                // Check to see if they lifted while pulled to the top
                if (e.currentState == MS_MANIPULATION_STATE_INERTIA &&
                    e.lastState == MS_MANIPULATION_STATE_ACTIVE &&
                    e.target.scrollTop === 0) {

                    // Change the loading state and prevent panning
                    WinJS.Utilities.addClass(e.target, "loading");
                    e.target.disabled = true;
                    this.context._pullLabel.innerText = "Loading...";

                    this.context.refreshItemsAsync().then(function () {
                        // After the refresh, return to the default state
                        WinJS.Utilities.removeClass(e.target, "loading");
                        e.target.disabled = false;

                        // Scroll back to the top of the list
                        e.target.msZoomTo({
                            contentX: 0,
                            contentY: _pullBoxHeight,
                            viewportX: 0,
                            viewportY: 0
                        });
                    });
                }
            },

            refreshItemsAsync: function () {
                var feed = new Yodel.feed();
                Yodel.data[nav.state.method] = null;
                var promise = feed.load(nav.state.method, this._innerScroller.id);
                return promise;
            }
        })
    });
})();
