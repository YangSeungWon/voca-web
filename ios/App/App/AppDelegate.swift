import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, WKScriptMessageHandler {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Setup WebView message handler for token synchronization
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.setupTokenSync()
        }

        // Copy token from localStorage to App Groups on app start
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            self.syncTokenToAppGroups()
        }

        return true
    }

    // MARK: - Token Synchronization

    private func setupTokenSync() {
        guard let webView = findWebView() else {
            NSLog("[TokenSync] WebView not found")
            return
        }

        webView.configuration.userContentController.add(self, name: "saveTokenToAppGroups")
        NSLog("[TokenSync] Message handler registered")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "saveTokenToAppGroups", let token = message.body as? String {
            NSLog("[TokenSync] Received token from JS: \(token.prefix(20))...")
            saveTokenToAppGroups(token)
        }
    }

    private func syncTokenToAppGroups() {
        guard let webView = findWebView() else {
            NSLog("[TokenSync] WebView not found")
            return
        }

        webView.evaluateJavaScript("localStorage.getItem('token')") { result, error in
            if let error = error {
                NSLog("[TokenSync] Error reading token: \(error)")
                return
            }

            if let token = result as? String, !token.isEmpty {
                NSLog("[TokenSync] Found token in localStorage: \(token.prefix(20))...")
                self.saveTokenToAppGroups(token)
            } else {
                NSLog("[TokenSync] No token in localStorage")
            }
        }
    }

    private func saveTokenToAppGroups(_ token: String) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.kr.ysw.voca") else {
            NSLog("[TokenSync] Failed to access App Groups")
            return
        }

        sharedDefaults.set(token, forKey: "token")
        sharedDefaults.synchronize()
        NSLog("[TokenSync] Token saved to App Groups successfully")
    }

    private func findWebView() -> WKWebView? {
        guard let rootVC = self.window?.rootViewController else { return nil }

        func search(in view: UIView) -> WKWebView? {
            if let webView = view as? WKWebView {
                return webView
            }
            for subview in view.subviews {
                if let webView = search(in: subview) {
                    return webView
                }
            }
            return nil
        }

        return search(in: rootVC.view)
    }

    // MARK: - Application Lifecycle

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, etc.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Sync token when app becomes active
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.syncTokenToAppGroups()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
