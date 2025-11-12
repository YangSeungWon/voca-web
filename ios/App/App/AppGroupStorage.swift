import Foundation
import Capacitor

@objc(AppGroupStorage)
public class AppGroupStorage: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppGroupStorage"
    public let jsName = "AppGroupStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise)
    ]

    private let appGroup = "group.kr.ysw.voca"

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"),
              let value = call.getString("value") else {
            call.reject("Missing key or value")
            return
        }

        guard let sharedDefaults = UserDefaults(suiteName: appGroup) else {
            call.reject("Failed to access App Group")
            return
        }

        sharedDefaults.set(value, forKey: key)
        sharedDefaults.synchronize()

        print("AppGroupStorage: Saved \(key) to App Groups")
        call.resolve()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing key")
            return
        }

        guard let sharedDefaults = UserDefaults(suiteName: appGroup) else {
            call.reject("Failed to access App Group")
            return
        }

        let value = sharedDefaults.string(forKey: key)
        print("AppGroupStorage: Retrieved \(key) = \(value ?? "nil")")
        call.resolve(["value": value as Any])
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing key")
            return
        }

        guard let sharedDefaults = UserDefaults(suiteName: appGroup) else {
            call.reject("Failed to access App Group")
            return
        }

        sharedDefaults.removeObject(forKey: key)
        sharedDefaults.synchronize()

        print("AppGroupStorage: Removed \(key) from App Groups")
        call.resolve()
    }
}
