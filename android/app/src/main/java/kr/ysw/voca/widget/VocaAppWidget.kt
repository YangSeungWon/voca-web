package kr.ysw.voca.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kr.ysw.voca.R
import kr.ysw.voca.MainActivity

/**
 * Voca App Widget
 * Shows vocabulary statistics and quick action buttons
 */
class VocaAppWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val STATISTICS_API = "https://voca.ysw.kr/api/statistics"
        private const val STUDY_STATS_API = "https://voca.ysw.kr/api/widget/study-stats"
        private const val CAPACITOR_STORAGE = "CapacitorStorage"
        private const val TOKEN_KEY = "token"

        private fun getToken(context: Context): String? {
            return try {
                val prefs = context.getSharedPreferences(CAPACITOR_STORAGE, Context.MODE_PRIVATE)
                prefs.getString(TOKEN_KEY, null)
            } catch (e: Exception) {
                null
            }
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val token = getToken(context)

            // Check widget size to determine layout
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val isWide = minWidth >= 250

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val statsData = fetchStats(token)
                    withContext(Dispatchers.Main) {
                        if (isWide) {
                            updateMediumWidget(context, appWidgetManager, appWidgetId)
                        } else {
                            updateSmallWidget(context, appWidgetManager, appWidgetId, statsData)
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        if (isWide) {
                            updateMediumWidget(context, appWidgetManager, appWidgetId)
                        } else {
                            updateSmallWidget(context, appWidgetManager, appWidgetId, null)
                        }
                    }
                }
            }
        }

        private fun fetchStats(token: String?): StatsData? {
            return try {
                // Fetch statistics
                val statsUrl = URL(STATISTICS_API)
                val statsConn = statsUrl.openConnection() as HttpURLConnection
                statsConn.requestMethod = "GET"
                if (token != null) {
                    statsConn.setRequestProperty("Authorization", "Bearer $token")
                } else {
                    statsConn.setRequestProperty("x-user-id", "default-user")
                }
                statsConn.connectTimeout = 5000
                statsConn.readTimeout = 5000

                var totalWords = 0
                var todayWords = 0

                if (statsConn.responseCode == 200) {
                    val response = statsConn.inputStream.bufferedReader().readText()
                    val json = JSONObject(response)
                    val overview = json.optJSONObject("overview")
                    if (overview != null) {
                        totalWords = overview.optInt("total", 0)
                        todayWords = overview.optInt("today", 0)
                    }
                }

                // Fetch study stats
                val studyUrl = URL(STUDY_STATS_API)
                val studyConn = studyUrl.openConnection() as HttpURLConnection
                studyConn.requestMethod = "GET"
                if (token != null) {
                    studyConn.setRequestProperty("Authorization", "Bearer $token")
                } else {
                    studyConn.setRequestProperty("x-user-id", "default-user")
                }
                studyConn.connectTimeout = 5000
                studyConn.readTimeout = 5000

                var studySessions = 0
                var wordsStudied = 0

                if (studyConn.responseCode == 200) {
                    val response = studyConn.inputStream.bufferedReader().readText()
                    val json = JSONObject(response)
                    studySessions = json.optInt("sessions", 0)
                    wordsStudied = json.optInt("wordsStudied", 0)
                }

                StatsData(totalWords, todayWords, studySessions, wordsStudied)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }

        private fun updateSmallWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            statsData: StatsData?
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_voca_app_small)

            if (statsData != null) {
                views.setTextViewText(R.id.widget_total_words, statsData.totalWords.toString())

                if (statsData.todayWords > 0) {
                    views.setTextViewText(R.id.widget_today_words, "+${statsData.todayWords} today")
                    views.setViewVisibility(R.id.widget_today_words, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.widget_today_words, View.GONE)
                }

                if (statsData.studySessions > 0) {
                    views.setTextViewText(R.id.widget_study_sessions, "${statsData.studySessions} study sessions")
                    views.setViewVisibility(R.id.widget_study_sessions, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.widget_study_sessions, View.GONE)
                }
            } else {
                views.setTextViewText(R.id.widget_total_words, "0")
                views.setViewVisibility(R.id.widget_today_words, View.GONE)
                views.setViewVisibility(R.id.widget_study_sessions, View.GONE)
            }

            // Click to open vocabulary
            val intent = createDeepLinkIntent(context, "vocaweb://vocabulary")
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun updateMediumWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_voca_app_medium)

            // Search bar click
            views.setOnClickPendingIntent(
                R.id.widget_search_bar,
                createPendingIntent(context, "vocaweb://search", 1)
            )

            // Quick action buttons
            views.setOnClickPendingIntent(
                R.id.widget_btn_ipa,
                createPendingIntent(context, "vocaweb://phonetics", 2)
            )
            views.setOnClickPendingIntent(
                R.id.widget_btn_study,
                createPendingIntent(context, "vocaweb://study", 3)
            )
            views.setOnClickPendingIntent(
                R.id.widget_btn_stats,
                createPendingIntent(context, "vocaweb://statistics", 4)
            )
            views.setOnClickPendingIntent(
                R.id.widget_btn_words,
                createPendingIntent(context, "vocaweb://vocabulary", 5)
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun createDeepLinkIntent(context: Context, url: String): Intent {
            return Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse(url)
            }
        }

        private fun createPendingIntent(context: Context, url: String, requestCode: Int): PendingIntent {
            val intent = createDeepLinkIntent(context, url)
            return PendingIntent.getActivity(
                context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }

    data class StatsData(
        val totalWords: Int,
        val todayWords: Int,
        val studySessions: Int,
        val wordsStudied: Int
    )
}
