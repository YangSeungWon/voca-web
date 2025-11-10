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
        private const val API_URL = "https://yourdomain.com/api/widget/today-word"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Fetch data from API
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val wordData = fetchTodayWord()
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

        private fun fetchTodayWord(): WordData? {
            return try {
                val url = URL(API_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("x-user-id", "default-user")
                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                if (connection.responseCode == 200) {
                    val response = connection.inputStream.bufferedReader().readText()
                    val json = JSONObject(response)
                    val word = json.getJSONObject("word")

                    WordData(
                        word = word.getString("text"),
                        pronunciation = word.optString("pronunciation", ""),
                        meaning = word.getString("meaning"),
                        partOfSpeech = word.optString("partOfSpeech", ""),
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
                views.setTextViewText(R.id.widget_meaning, wordData.meaning)
                views.setTextViewText(R.id.widget_part_of_speech, wordData.partOfSpeech)
                views.setTextViewText(R.id.widget_level, "Lv.${wordData.level}")
            } else {
                // Placeholder data
                views.setTextViewText(R.id.widget_word, "Loading...")
                views.setTextViewText(R.id.widget_pronunciation, "")
                views.setTextViewText(R.id.widget_meaning, "Add words to see them here")
                views.setTextViewText(R.id.widget_part_of_speech, "")
                views.setTextViewText(R.id.widget_level, "")
            }

            // Create intent to open app when widget is clicked
            val intent = Intent(context, context.packageManager.getLaunchIntentForPackage(context.packageName)?.component?.className?.let { Class.forName(it) })
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
        val meaning: String,
        val partOfSpeech: String,
        val level: Int
    )
}
