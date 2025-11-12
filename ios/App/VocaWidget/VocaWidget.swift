import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WordEntry: TimelineEntry {
    let date: Date
    let word: String
    let pronunciation: String
    let meaning: String
    let partOfSpeech: String
    let level: Int
}

// MARK: - Timeline Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WordEntry {
        WordEntry(
            date: Date(),
            word: "vocabulary",
            pronunciation: "/vəˈkæbjʊləri/",
            meaning: "단어, 어휘",
            partOfSpeech: "noun",
            level: 3
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> ()) {
        let entry = WordEntry(
            date: Date(),
            word: "vocabulary",
            pronunciation: "/vəˈkæbjʊləri/",
            meaning: "단어, 어휘",
            partOfSpeech: "noun",
            level: 3
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        fetchTodayWord { wordData in
            let currentDate = Date()

            // Create entry from fetched data or use placeholder
            let entry = wordData ?? WordEntry(
                date: currentDate,
                word: "Loading...",
                pronunciation: "",
                meaning: "Add words to see them here",
                partOfSpeech: "",
                level: 0
            )

            // Update once per day at midnight
            let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: currentDate)!
            let midnight = Calendar.current.startOfDay(for: tomorrow)

            let timeline = Timeline(entries: [entry], policy: .after(midnight))
            completion(timeline)
        }
    }

    private func fetchTodayWord(completion: @escaping (WordEntry?) -> Void) {
        guard let url = URL(string: "https://voca.ysw.kr/api/widget/today-word") else {
            print("Widget: Invalid URL")
            completion(nil)
            return
        }

        // Get token from App Groups
        let appGroup = "group.kr.ysw.voca"
        let sharedDefaults = UserDefaults(suiteName: appGroup)
        let token = sharedDefaults?.string(forKey: "token")

        var request = URLRequest(url: url)
        request.timeoutInterval = 10 // 10 second timeout

        // Use token if available, otherwise fallback to default-user
        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("Widget: Using token authentication")
        } else {
            request.addValue("default-user", forHTTPHeaderField: "x-user-id")
            print("Widget: Using default-user authentication")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Widget: Network error - \(error.localizedDescription)")
                completion(nil)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                print("Widget: Invalid response")
                completion(nil)
                return
            }

            print("Widget: HTTP status code - \(httpResponse.statusCode)")

            guard let data = data else {
                print("Widget: No data received")
                completion(nil)
                return
            }

            // Try to parse JSON
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                print("Widget: Failed to parse JSON")
                if let dataString = String(data: data, encoding: .utf8) {
                    print("Widget: Response data - \(dataString)")
                }
                completion(nil)
                return
            }

            print("Widget: JSON received - \(json)")

            // Check if word is null (no vocabulary yet)
            if json["word"] is NSNull || json["word"] == nil {
                print("Widget: No words in vocabulary")
                let entry = WordEntry(
                    date: Date(),
                    word: "No words yet",
                    pronunciation: "",
                    meaning: "Add words to your vocabulary to see them here",
                    partOfSpeech: "",
                    level: 0
                )
                completion(entry)
                return
            }

            guard let wordData = json["word"] as? [String: Any] else {
                print("Widget: Invalid word data format")
                completion(nil)
                return
            }

            let entry = WordEntry(
                date: Date(),
                word: wordData["text"] as? String ?? "",
                pronunciation: wordData["pronunciation"] as? String ?? "",
                meaning: wordData["meaning"] as? String ?? "",
                partOfSpeech: wordData["partOfSpeech"] as? String ?? "",
                level: wordData["level"] as? Int ?? 0
            )

            print("Widget: Successfully created entry for word - \(entry.word)")
            completion(entry)
        }.resume()
    }
}

// MARK: - Widget View

struct VocaWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            // Background gradient (for iOS 16 and below)
            if #available(iOS 17.0, *) {
                // Background is handled by containerBackground in iOS 17+
            } else {
                LinearGradient(
                    gradient: Gradient(colors: [Color(red: 0.14, green: 0.16, blue: 0.22), Color(red: 0.25, green: 0.29, blue: 0.38)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }

            VStack(alignment: .leading, spacing: 8) {
                // Header
                HStack {
                    Text("📚 Today's Word")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white.opacity(0.7))

                    Spacer()

                    // Level indicator
                    if entry.level > 0 {
                        Text("Lv.\(entry.level)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.3))
                            .cornerRadius(4)
                    }
                }

                Spacer()

                // Word
                Text(entry.word)
                    .font(family == .systemSmall ? .title3 : .title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                // Pronunciation
                if !entry.pronunciation.isEmpty {
                    Text(entry.pronunciation)
                        .font(.caption)
                        .foregroundColor(.blue.opacity(0.8))
                }

                // Meaning
                Text(entry.meaning)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(family == .systemSmall ? 2 : 3)

                // Part of speech
                if !entry.partOfSpeech.isEmpty {
                    Text(entry.partOfSpeech)
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(4)
                }
            }
            .padding()
        }
    }
}

// MARK: - Widget Configuration

@main
struct VocaWidget: Widget {
    let kind: String = "VocaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                VocaWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [Color(red: 0.14, green: 0.16, blue: 0.22), Color(red: 0.25, green: 0.29, blue: 0.38)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                VocaWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Today's Word")
        .description("Show a new vocabulary word every day")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

struct VocaWidget_Previews: PreviewProvider {
    static var previews: some View {
        VocaWidgetEntryView(entry: WordEntry(
            date: Date(),
            word: "serendipity",
            pronunciation: "/ˌsɛrənˈdɪpɪti/",
            meaning: "행운, 뜻밖의 발견",
            partOfSpeech: "noun",
            level: 4
        ))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
