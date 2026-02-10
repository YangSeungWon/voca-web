package kr.ysw.voca.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
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
 * Quiz Widget
 * Interactive widget for vocabulary quiz - show answer / next word
 */
class QuizWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_SHOW_ANSWER -> {
                setShowAnswer(context, true)
                refreshAllWidgets(context)
            }
            ACTION_NEXT_WORD -> {
                incrementWordIndex(context)
                setShowAnswer(context, false)
                refreshAllWidgets(context)
            }
        }
    }

    companion object {
        private const val API_URL = "https://voca.ysw.kr/api/widget/today-word"
        private const val CAPACITOR_STORAGE = "CapacitorStorage"
        private const val TOKEN_KEY = "token"
        private const val QUIZ_PREFS = "QuizWidgetPrefs"
        private const val PREF_SHOW_ANSWER = "show_answer"
        private const val PREF_WORD_INDEX = "word_index"

        const val ACTION_SHOW_ANSWER = "kr.ysw.voca.widget.ACTION_SHOW_ANSWER"
        const val ACTION_NEXT_WORD = "kr.ysw.voca.widget.ACTION_NEXT_WORD"

        private fun getToken(context: Context): String? {
            return try {
                val prefs = context.getSharedPreferences(CAPACITOR_STORAGE, Context.MODE_PRIVATE)
                prefs.getString(TOKEN_KEY, null)
            } catch (e: Exception) {
                null
            }
        }

        private fun getShowAnswer(context: Context): Boolean {
            val prefs = context.getSharedPreferences(QUIZ_PREFS, Context.MODE_PRIVATE)
            return prefs.getBoolean(PREF_SHOW_ANSWER, false)
        }

        private fun setShowAnswer(context: Context, show: Boolean) {
            val prefs = context.getSharedPreferences(QUIZ_PREFS, Context.MODE_PRIVATE)
            prefs.edit().putBoolean(PREF_SHOW_ANSWER, show).apply()
        }

        private fun getWordIndex(context: Context): Int {
            val prefs = context.getSharedPreferences(QUIZ_PREFS, Context.MODE_PRIVATE)
            return prefs.getInt(PREF_WORD_INDEX, 0)
        }

        private fun incrementWordIndex(context: Context) {
            val prefs = context.getSharedPreferences(QUIZ_PREFS, Context.MODE_PRIVATE)
            val current = prefs.getInt(PREF_WORD_INDEX, 0)
            prefs.edit().putInt(PREF_WORD_INDEX, current + 1).apply()
        }

        private fun refreshAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, QuizWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val token = getToken(context)
            val showAnswer = getShowAnswer(context)
            val wordIndex = getWordIndex(context)

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val wordData = fetchQuizWord(token, wordIndex)
                    withContext(Dispatchers.Main) {
                        updateWidget(context, appWidgetManager, appWidgetId, wordData, showAnswer)
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        updateWidget(context, appWidgetManager, appWidgetId, null, showAnswer)
                    }
                }
            }
        }

        private fun fetchQuizWord(token: String?, index: Int): WordData? {
            return try {
                val url = URL("$API_URL?index=$index")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"

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
                        meaning = word.getString("meaning")
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
            wordData: WordData?,
            showAnswer: Boolean
        ) {
            val layoutId = if (showAnswer) R.layout.widget_quiz_answer else R.layout.widget_quiz_question
            val views = RemoteViews(context.packageName, layoutId)

            if (wordData != null) {
                views.setTextViewText(R.id.widget_word, wordData.word)

                if (showAnswer) {
                    views.setTextViewText(R.id.widget_meaning, wordData.meaning)
                } else {
                    views.setTextViewText(R.id.widget_pronunciation, wordData.pronunciation)
                    views.setTextViewText(R.id.widget_pronunciation_kr, wordData.pronunciationKr)
                }
            } else {
                views.setTextViewText(R.id.widget_word, "Loading...")
                if (showAnswer) {
                    views.setTextViewText(R.id.widget_meaning, "Add words to see them here")
                } else {
                    views.setTextViewText(R.id.widget_pronunciation, "")
                    views.setTextViewText(R.id.widget_pronunciation_kr, "")
                }
            }

            // Button actions
            if (showAnswer) {
                val nextIntent = Intent(context, QuizWidget::class.java).apply {
                    action = ACTION_NEXT_WORD
                }
                val nextPendingIntent = PendingIntent.getBroadcast(
                    context, 0, nextIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)
            } else {
                val showIntent = Intent(context, QuizWidget::class.java).apply {
                    action = ACTION_SHOW_ANSWER
                }
                val showPendingIntent = PendingIntent.getBroadcast(
                    context, 1, showIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_btn_show, showPendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    data class WordData(
        val word: String,
        val pronunciation: String,
        val pronunciationKr: String,
        val meaning: String
    )
}
