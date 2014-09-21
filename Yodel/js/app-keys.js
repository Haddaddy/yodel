var appData = Windows.Storage.ApplicationData.current;
var roamingData = appData.roamingSettings;
var localData = appData.localSettings;

// Set Yakker ID for dev use
//roamingData.values["yakker_id"] = "";

// Bing Maps tokens
localData.values["maps_appid"] = "";
localData.values["maps_auth"] = "";
