var appData = Windows.Storage.ApplicationData.current;
var roamingData = appData.roamingSettings;
var localData = appData.localSettings;

// API key
// If you wish to use this code, you must obtain the key on your own
localData.values.api_key = "";

// Set Yakker ID for dev use
//roamingData.values["yakker_id"] = "";

// Bing Maps tokens
localData.values.maps_appid = "";
localData.values.maps_auth = "";
