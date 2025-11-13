import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WordEntry: TimelineEntry {
    let date: Date
    let word: String
    let pronunciation: String
    let pronunciationKr: String
    let meaning: String
    let partOfSpeech: String
    let level: Int
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

// MARK: - Timeline Provider for Word Widget

struct WordProvider: TimelineProvider {
    func placeholder(in context: Context) -> WordEntry {
        WordEntry(
            date: Date(),
            word: "vocabulary",
            pronunciation: "/vəˈkæbjʊləri/",
            pronunciationKr: "버캐뷸러리",
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
            pronunciationKr: "버캐뷸러리",
            meaning: "단어, 어휘",
            partOfSpeech: "noun",
            level: 3
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        fetchTodayWord { wordData in
            let currentDate = Date()

            let entry = wordData ?? WordEntry(
                date: currentDate,
                word: "Loading...",
                pronunciation: "",
                pronunciationKr: "",
                meaning: "Add words to see them here",
                partOfSpeech: "",
                level: 0
            )

            // Refresh every hour
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchTodayWord(completion: @escaping (WordEntry?) -> Void) {
        guard let url = URL(string: "https://voca.ysw.kr/api/widget/today-word") else {
            completion(nil)
            return
        }

        let appGroup = "group.kr.ysw.voca"
        let sharedDefaults = UserDefaults(suiteName: appGroup)
        let token = sharedDefaults?.string(forKey: "token")

        var request = URLRequest(url: url)
        request.timeoutInterval = 10

        if let token = token {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            request.addValue("default-user", forHTTPHeaderField: "x-user-id")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let wordData = json["word"] as? [String: Any] else {
                completion(nil)
                return
            }

            let entry = WordEntry(
                date: Date(),
                word: wordData["text"] as? String ?? "",
                pronunciation: wordData["pronunciation"] as? String ?? "",
                pronunciationKr: wordData["pronunciationKr"] as? String ?? "",
                meaning: wordData["meaning"] as? String ?? "",
                partOfSpeech: wordData["partOfSpeech"] as? String ?? "",
                level: wordData["level"] as? Int ?? 0
            )

            completion(entry)
        }.resume()
    }
}

// MARK: - Timeline Provider for Quick Action Widgets

struct SimpleProvider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(SimpleEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let entry = SimpleEntry(date: Date())
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

// MARK: - Widget Views

struct TodayWordView: View {
    var entry: WordProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Link(destination: URL(string: "vocaweb://home")!) {
            ZStack {
                VStack(alignment: .leading, spacing: 6) {
                    // Header
                    HStack {
                        Text("📚 Today's Word")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.white.opacity(0.7))

                        Spacer()

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

                    // IPA Pronunciation
                    if !entry.pronunciation.isEmpty {
                        Text(entry.pronunciation)
                            .font(.caption)
                            .foregroundColor(.blue.opacity(0.8))
                    }

                    // Hangul Pronunciation
                    if !entry.pronunciationKr.isEmpty {
                        Text(entry.pronunciationKr)
                            .font(.caption)
                            .foregroundColor(.green.opacity(0.8))
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
}

// MARK: - Lock Screen Widget Views

struct LockScreenRectangularView: View {
    let entry: WordEntry

    var body: some View {
        Link(destination: URL(string: "vocaweb://home")!) {
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(entry.word)
                        .font(.headline)
                        .fontWeight(.semibold)
                    if entry.level > 0 {
                        Text("Lv.\(entry.level)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }

                if !entry.pronunciationKr.isEmpty {
                    Text(entry.pronunciationKr)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(entry.meaning)
                    .font(.caption)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct LockScreenInlineView: View {
    let entry: WordEntry

    var body: some View {
        Link(destination: URL(string: "vocaweb://home")!) {
            Text("\(entry.word) - \(entry.meaning)")
                .font(.caption)
                .lineLimit(1)
        }
    }
}

struct SearchWidgetView: View {
    @Environment(\.widgetFamily) var family

    var body: some View {
        Link(destination: URL(string: "vocaweb://search")!) {
            ZStack {
                VStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: family == .systemSmall ? 32 : 48))
                        .foregroundColor(.white)

                    Text("Search")
                        .font(family == .systemSmall ? .subheadline : .title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    if family != .systemSmall {
                        Text("Look up a word")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
}

struct StudyWidgetView: View {
    @Environment(\.widgetFamily) var family

    var body: some View {
        Link(destination: URL(string: "vocaweb://study")!) {
            ZStack {
                VStack(spacing: 12) {
                    Image(systemName: "book.fill")
                        .font(.system(size: family == .systemSmall ? 32 : 48))
                        .foregroundColor(.white)

                    Text("Study")
                        .font(family == .systemSmall ? .subheadline : .title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    if family != .systemSmall {
                        Text("Start reviewing words")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
}

// MARK: - Widget Configurations

@main
struct VocaWidgetBundle: WidgetBundle {
    var body: some Widget {
        TodayWordWidget()
        SearchWidget()
        StudyWidget()
    }
}

struct TodayWordWidget: Widget {
    let kind: String = "TodayWordWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WordProvider()) { entry in
            TodayWordWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Random Word")
        .description("Shows a random word from your vocabulary")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

struct TodayWordWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: WordEntry

    var body: some View {
        if #available(iOS 17.0, *) {
            switch family {
            case .accessoryRectangular:
                LockScreenRectangularView(entry: entry)
                    .containerBackground(for: .widget) {}
            case .accessoryInline:
                LockScreenInlineView(entry: entry)
                    .containerBackground(for: .widget) {}
            default:
                TodayWordView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.14, green: 0.16, blue: 0.22),
                                Color(red: 0.25, green: 0.29, blue: 0.38)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            }
        } else {
            switch family {
            case .accessoryRectangular:
                LockScreenRectangularView(entry: entry)
            case .accessoryInline:
                LockScreenInlineView(entry: entry)
            default:
                TodayWordView(entry: entry)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.14, green: 0.16, blue: 0.22),
                                Color(red: 0.25, green: 0.29, blue: 0.38)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        }
    }
}

struct SearchWidget: Widget {
    let kind: String = "SearchWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SimpleProvider()) { entry in
            if #available(iOS 17.0, *) {
                SearchWidgetView()
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.2, green: 0.4, blue: 0.8),
                                Color(red: 0.1, green: 0.3, blue: 0.7)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                SearchWidgetView()
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.2, green: 0.4, blue: 0.8),
                                Color(red: 0.1, green: 0.3, blue: 0.7)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        }
        .configurationDisplayName("Quick Search")
        .description("Tap to search for a word")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct StudyWidget: Widget {
    let kind: String = "StudyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SimpleProvider()) { entry in
            if #available(iOS 17.0, *) {
                StudyWidgetView()
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.6, green: 0.2, blue: 0.8),
                                Color(red: 0.5, green: 0.1, blue: 0.7)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                StudyWidgetView()
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.6, green: 0.2, blue: 0.8),
                                Color(red: 0.5, green: 0.1, blue: 0.7)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        }
        .configurationDisplayName("Start Study")
        .description("Tap to begin studying your words")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

struct VocaWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            TodayWordView(entry: WordEntry(
                date: Date(),
                word: "serendipity",
                pronunciation: "/ˌsɛrənˈdɪpɪti/",
                pronunciationKr: "세런디피티",
                meaning: "행운, 뜻밖의 발견",
                partOfSpeech: "noun",
                level: 4
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            SearchWidgetView()
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            StudyWidgetView()
                .previewContext(WidgetPreviewContext(family: .systemSmall))
        }
    }
}
