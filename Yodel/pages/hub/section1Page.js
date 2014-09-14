(function () {
    "use strict";

    var ControlConstructor = WinJS.UI.Pages.define("/pages/hub/section1Page.html", {
        // This function is called after the page control contents 
        // have been loaded, controls have been activated, and 
        // the resulting elements have been parented to the DOM. 
        ready: function (element, options) {
            options = options || {};
            var yakker = new Yakker("BD8947C1AD926F2C9754966F6CCFA88E", new Location("33.949857", "-83.383023"));
            console.log("Registered user with id " + yakker.id);

            var promise = yakker.get_yaks();
            promise.then(function (response) {
                response.content.readAsStringAsync().then(function (res) {
                    var yaks = JSON.parse(res);
                    console.log(yaks);
                    var yaks_proc = yakker.parse_yaks(yaks);
                    for (var yak in yaks_proc) {
                        yak = yaks_proc[yak];
                        $(".section1page section").append("<div class='yak'><p class='yak_text'>" + yak.message + "</p><span class='yak_detail'>" + yak.likes + " likes, " + moment.unix(yak.time).twitter() + "</span></div>");
                    }
                });
            });
        },
    });

    // The following lines expose this control constructor as a global. 
    // This lets you use the control as a declarative control inside the 
    // data-win-control attribute. 

    WinJS.Namespace.define("HubApps_SectionControls", {
        Section1Control: ControlConstructor
    });
})();