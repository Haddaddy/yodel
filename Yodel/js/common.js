(function () {
    "use strict";

    WinJS.Namespace.define("Yodel", {
        bind_list: function (tag, options) {
            if (tag) {
                if (!tag.winControl) {
                    var options_str;
                    $(tag).attr("data-win-options", function (i, val) {
                        if (val.length <= 0) {
                            options_str = "{";
                        }
                        else {
                            options_str = val.slice(0, -1);
                        }
                        
                        $.each(options, function (key, val) {
                            options_str += ", " + key + ": " + val;
                        });

                        return options_str + "}";
                    });
                }
                else {
                    $.each(options, function (key, val) {
                        tag.winControl[key] = eval(val);
                    });
                }
            }
        }
    });
})();
