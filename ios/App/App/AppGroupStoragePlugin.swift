import Foundation
import Capacitor

@objc(AppGroupStoragePlugin)
public class AppGroupStoragePlugin: CAPPlugin {
    @objc func saveToken(_ call: CAPPluginCall) {
        guard let token = call.getString("token") else {
            call.reject("Token is required")
            return
        }

        AppGroupStorage.shared.saveToken(token)
        call.resolve()
    }

    @objc func getToken(_ call: CAPPluginCall) {
        if let token = AppGroupStorage.shared.getToken() {
            call.resolve(["token": token])
        } else {
            call.resolve(["token": NSNull()])
        }
    }

    @objc func removeToken(_ call: CAPPluginCall) {
        AppGroupStorage.shared.removeToken()
        call.resolve()
    }
}
