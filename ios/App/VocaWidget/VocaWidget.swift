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

struct StudyStatsEntry: TimelineEntry {
    let date: Date
    let sessions: Int
    let wordsStudied: Int
}

struct VocaAppEntry: TimelineEntry {
    let date: Date
    let todayWords: Int
    let totalWords: Int
    let studySessions: Int
    let wordsStudied: Int
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

// MARK: - Timeline Provider for Study Stats Widget

struct StudyStatsProvider: TimelineProvider {
    func placeholder(in context: Context) -> StudyStatsEntry {
        StudyStatsEntry(date: Date(), sessions: 0, wordsStudied: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (StudyStatsEntry) -> ()) {
        completion(StudyStatsEntry(date: Date(), sessions: 0, wordsStudied: 0))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StudyStatsEntry>) -> ()) {
        fetchStudyStats { statsData in
            let currentDate = Date()

            let entry = statsData ?? StudyStatsEntry(
                date: currentDate,
                sessions: 0,
                wordsStudied: 0
            )

            // Refresh every hour
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchStudyStats(completion: @escaping (StudyStatsEntry?) -> Void) {
        guard let url = URL(string: "https://voca.ysw.kr/api/widget/study-stats") else {
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
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(nil)
                return
            }

            let entry = StudyStatsEntry(
                date: Date(),
                sessions: json["sessions"] as? Int ?? 0,
                wordsStudied: json["wordsStudied"] as? Int ?? 0
            )

            completion(entry)
        }.resume()
    }
}

// MARK: - Timeline Provider for Voca App Widget

struct VocaAppProvider: TimelineProvider {
    func placeholder(in context: Context) -> VocaAppEntry {
        VocaAppEntry(date: Date(), todayWords: 0, totalWords: 0, studySessions: 0, wordsStudied: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (VocaAppEntry) -> ()) {
        completion(VocaAppEntry(date: Date(), todayWords: 5, totalWords: 120, studySessions: 2, wordsStudied: 15))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VocaAppEntry>) -> ()) {
        fetchAppStats { statsData in
            let currentDate = Date()

            let entry = statsData ?? VocaAppEntry(
                date: currentDate,
                todayWords: 0,
                totalWords: 0,
                studySessions: 0,
                wordsStudied: 0
            )

            // Refresh every hour
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchAppStats(completion: @escaping (VocaAppEntry?) -> Void) {
        let appGroup = "group.kr.ysw.voca"
        let sharedDefaults = UserDefaults(suiteName: appGroup)
        let token = sharedDefaults?.string(forKey: "token")

        let group = DispatchGroup()
        var statsResult: [String: Any]?
        var studyStatsResult: [String: Any]?

        // Fetch statistics
        group.enter()
        if let url = URL(string: "https://voca.ysw.kr/api/statistics") {
            var request = URLRequest(url: url)
            if let token = token {
                request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            } else {
                request.addValue("default-user", forHTTPHeaderField: "x-user-id")
            }

            URLSession.shared.dataTask(with: request) { data, _, _ in
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    statsResult = json
                }
                group.leave()
            }.resume()
        } else {
            group.leave()
        }

        // Fetch study stats
        group.enter()
        if let url = URL(string: "https://voca.ysw.kr/api/widget/study-stats") {
            var request = URLRequest(url: url)
            if let token = token {
                request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            } else {
                request.addValue("default-user", forHTTPHeaderField: "x-user-id")
            }

            URLSession.shared.dataTask(with: request) { data, _, _ in
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    studyStatsResult = json
                }
                group.leave()
            }.resume()
        } else {
            group.leave()
        }

        group.notify(queue: .main) {
            var todayWords = 0
            var totalWords = 0
            if let overview = statsResult?["overview"] as? [String: Any] {
                todayWords = overview["today"] as? Int ?? 0
                totalWords = overview["total"] as? Int ?? 0
            }

            let studySessions = studyStatsResult?["sessions"] as? Int ?? 0
            let wordsStudied = studyStatsResult?["wordsStudied"] as? Int ?? 0

            let entry = VocaAppEntry(
                date: Date(),
                todayWords: todayWords,
                totalWords: totalWords,
                studySessions: studySessions,
                wordsStudied: wordsStudied
            )

            completion(entry)
        }
    }
}

// MARK: - Widget Views

struct TodayWordView: View {
    var entry: WordProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Link(destination: URL(string: "vocaweb://home")!) {
            ZStack {
                VStack(alignment: .leading, spacing: 3) {
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
                        .lineLimit(family == .systemSmall ? 4 : 5)

                    // Part of speech
                    if !entry.partOfSpeech.isEmpty {
                        Text(entry.partOfSpeech)
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(3)
                    }
                }
                .padding(6)
            }
        }
    }
}

// MARK: - Lock Screen Widget Views

struct LockScreenRectangularView: View {
    let entry: WordEntry

    var body: some View {
        Link(destination: URL(string: "vocaweb://home")!) {
            VStack(alignment: .leading, spacing: 1) {
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
                    .lineLimit(3)
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

struct VocaAppWidgetView: View {
    let entry: VocaAppEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if family == .systemSmall {
            smallWidgetView
        } else {
            mediumWidgetView
        }
    }

    // Small Widget: App Summary
    var smallWidgetView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("📚 Voca")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))

            Spacer()

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("\(entry.totalWords)")
                        .font(.system(size: 32))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("words")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }

                if entry.todayWords > 0 {
                    Text("+\(entry.todayWords) today")
                        .font(.caption)
                        .foregroundColor(.green.opacity(0.9))
                }

                if entry.studySessions > 0 {
                    Text("\(entry.studySessions) study sessions")
                        .font(.caption)
                        .foregroundColor(.blue.opacity(0.9))
                }
            }
        }
        .padding(6)
    }

    // Medium Widget: Search + Quick Actions
    var mediumWidgetView: some View {
        VStack(spacing: 0) {
            // Top: Search Bar
            Link(destination: URL(string: "vocaweb://search")!) {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.white.opacity(0.6))
                    Text("Search for a word...")
                        .foregroundColor(.white.opacity(0.6))
                        .font(.subheadline)
                    Spacer()
                }
                .padding(10)
                .background(Color.white.opacity(0.1))
                .cornerRadius(6)
                .padding(6)
            }

            // Bottom: 4 Quick Action Buttons
            HStack(spacing: 6) {
                quickActionButton(icon: "textformat.abc", label: "IPA", url: "vocaweb://phonetics")
                quickActionButton(icon: "folder.fill", label: "Words", url: "vocaweb://vocabulary")
                quickActionButton(icon: "book.fill", label: "Study", url: "vocaweb://study")
                quickActionButton(icon: "chart.bar.fill", label: "Stats", url: "vocaweb://statistics")
            }
            .padding(.horizontal, 6)
            .padding(.bottom, 6)
        }
    }

    func quickActionButton(icon: String, label: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            VStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(.white)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.8))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.white.opacity(0.1))
            .cornerRadius(6)
        }
    }
}

// MARK: - Widget Configurations

struct VocaAppWidget: Widget {
    let kind: String = "VocaAppWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VocaAppProvider()) { entry in
            if #available(iOS 17.0, *) {
                VocaAppWidgetView(entry: entry)
                    .containerBackground(for: .widget) {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.2, green: 0.3, blue: 0.5),
                                Color(red: 0.1, green: 0.2, blue: 0.4)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
            } else {
                VocaAppWidgetView(entry: entry)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.2, green: 0.3, blue: 0.5),
                                Color(red: 0.1, green: 0.2, blue: 0.4)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        }
        .configurationDisplayName("Voca")
        .description("Quick access to your vocabulary app")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct VocaWidgetBundle: WidgetBundle {
    var body: some Widget {
        VocaAppWidget()
        TodayWordWidget()
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

// MARK: - Preview

struct VocaWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            VocaAppWidgetView(entry: VocaAppEntry(
                date: Date(),
                todayWords: 5,
                totalWords: 120,
                studySessions: 2,
                wordsStudied: 15
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            VocaAppWidgetView(entry: VocaAppEntry(
                date: Date(),
                todayWords: 5,
                totalWords: 120,
                studySessions: 2,
                wordsStudied: 15
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))

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
        }
    }
}
