(function () {
    "use strict";

    var nav = WinJS.Navigation;

    function navigateFromAppBar(event) {
        var element = event.target;
        nav.navigate(element.value).then(function () {
            element.parentNode.winControl.disabled = true;
        });
    }

    WinJS.UI.Pages.define("default.html", {
        ready: function (element, options) {
            $('#appbar').click(navigateFromAppBar);
        }
    });

})();