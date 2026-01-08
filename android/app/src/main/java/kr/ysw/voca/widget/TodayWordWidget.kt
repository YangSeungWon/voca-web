package kr.ysw.voca.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
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
 * Today's Word Widget
 * Shows a random vocabulary word each day
 */
class TodayWordWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widgets
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    companion object {
        private const val API_URL = "https://voca.ysw.kr/api/widget/today-word"
        private const val CAPACITOR_STORAGE = "CapacitorStorage"
        private const val TOKEN_KEY = "token"

        /**
         * Get auth token from Capacitor SharedPreferences
         */
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

            // Fetch data from API
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val wordData = fetchTodayWord(token)
                    withContext(Dispatchers.Main) {
                        updateWidget(context, appWidgetManager, appWidgetId, wordData)
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        updateWidget(context, appWidgetManager, appWidgetId, null)
                    }
                }
            }
        }

        private fun fetchTodayWord(token: String?): WordData? {
            return try {
                val url = URL(API_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"

                // Use token if available, otherwise fallback to default-user
                if (token != null) {
                    connection.setRequestProperty("Authorization", "Bearer $token")
                } else {
                    connection.setRequestProperty("x-user-id", "default-user")
                }

                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                if (connection.responseCode == 200) {
                    val response = connection.inputStream.bufferedReader().readText()
                    val json = JSONObject(response)
                    val word = json.getJSONObject("word")

                    WordData(
                        word = word.getString("text"),
                        pronunciation = word.optString("pronunciation", ""),
                        pronunciationKr = word.optString("pronunciationKr", ""),
                        meaning = word.getString("meaning"),
                        level = word.getInt("level")
                    )
                } else {
                    null
                }
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            wordData: WordData?
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_today_word)

            if (wordData != null) {
                // Update widget with actual data
                views.setTextViewText(R.id.widget_word, wordData.word)
                views.setTextViewText(R.id.widget_pronunciation, wordData.pronunciation)
                views.setTextViewText(R.id.widget_pronunciation_kr, wordData.pronunciationKr)
                views.setTextViewText(R.id.widget_meaning, wordData.meaning)
            } else {
                // Placeholder data
                views.setTextViewText(R.id.widget_word, "Loading...")
                views.setTextViewText(R.id.widget_pronunciation, "")
                views.setTextViewText(R.id.widget_pronunciation_kr, "")
                views.setTextViewText(R.id.widget_meaning, "Add words to see them here")
            }

            // Create intent to open app when widget is clicked
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse("vocaweb://vocabulary")
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    data class WordData(
        val word: String,
        val pronunciation: String,
        val pronunciationKr: String,
        val meaning: String,
        val level: Int
    )
}
