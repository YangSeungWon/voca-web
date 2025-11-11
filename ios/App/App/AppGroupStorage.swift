import Foundation

class AppGroupStorage {
    static let shared = AppGroupStorage()
    private let appGroupIdentifier = "group.kr.ysw.voca"

    private var userDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }

    func saveToken(_ token: String) {
        userDefaults?.set(token, forKey: "token")
        userDefaults?.synchronize()
    }

    func getToken() -> String? {
        return userDefaults?.string(forKey: "token")
    }

    func removeToken() {
        userDefaults?.removeObject(forKey: "token")
        userDefaults?.synchronize()
    }
}
