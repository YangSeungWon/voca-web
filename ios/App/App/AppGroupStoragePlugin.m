#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppGroupStoragePlugin, "AppGroupStorage",
    CAP_PLUGIN_METHOD(saveToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(removeToken, CAPPluginReturnPromise);
)
