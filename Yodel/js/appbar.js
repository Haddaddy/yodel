/*
 * 
 * Yodel - an unofficial Yik Yak client for Windows Phone
 * (c) 2014 soren121 and contributors.
 *
 * js/appbar.js
 * 
 * Licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 * 
 * http://github.com/soren121/yodel
 * 
 */

(function () {
    "use strict";

    var nav = WinJS.Navigation;

    function navigateFromAppBar(event) {
        var element = event.target;
        if (element.value) {
            nav.navigate(element.value);
        }
    }

    WinJS.UI.Pages.define("default.html", {
        ready: function (element, options) {
            var appbar = document.getElementById("appbar");
            appbar.addEventListener("click", navigateFromAppBar);
        }
    });

})();
