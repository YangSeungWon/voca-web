package kr.ysw.voca.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import kr.ysw.voca.R
import kr.ysw.voca.MainActivity

/**
 * Quiz Widget - Shows a word for quiz practice
 * Displays word and pronunciation, tap Show to reveal meaning
 */
class QuizWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, showAnswer = false)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_SHOW_ANSWER -> {
                val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    updateAppWidget(context, appWidgetManager, appWidgetId, showAnswer = true)
                }
            }
            ACTION_NEXT_WORD -> {
                val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    updateAppWidget(context, appWidgetManager, appWidgetId, showAnswer = false)
                }
            }
        }
    }

    companion object {
        private const val TAG = "QuizWidget"
        const val ACTION_SHOW_ANSWER = "kr.ysw.voca.widget.SHOW_ANSWER"
        const val ACTION_NEXT_WORD = "kr.ysw.voca.widget.NEXT_WORD"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            showAnswer: Boolean = false
        ) {
            val cachedWord = if (showAnswer) {
                // Get current word without advancing index
                WidgetDataCache.getCurrentWord(context)
            } else {
                // Get next word
                WidgetDataCache.getRandomWord(context)
            }

            if (showAnswer) {
                // Show answer layout
                val views = RemoteViews(context.packageName, R.layout.widget_quiz_answer)

                if (cachedWord != null) {
                    views.setTextViewText(R.id.widget_word, cachedWord.word)
                    views.setTextViewText(R.id.widget_meaning, cachedWord.meaning)
                } else {
                    views.setTextViewText(R.id.widget_word, "단어 없음")
                    views.setTextViewText(R.id.widget_meaning, "")
                }

                // Next button - get new word
                val nextIntent = Intent(context, QuizWidget::class.java).apply {
                    action = ACTION_NEXT_WORD
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                val nextPendingIntent = PendingIntent.getBroadcast(
                    context, appWidgetId + 1000, nextIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)

                // Container click opens app
                val appIntent = Intent(context, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    data = android.net.Uri.parse("vocaweb://study")
                }
                val appPendingIntent = PendingIntent.getActivity(
                    context, appWidgetId + 2000, appIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, appPendingIntent)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            } else {
                // Show question layout
                val views = RemoteViews(context.packageName, R.layout.widget_quiz_question)

                if (cachedWord != null) {
                    Log.d(TAG, "Showing quiz word: ${cachedWord.word}")
                    views.setTextViewText(R.id.widget_word, cachedWord.word)
                    views.setTextViewText(R.id.widget_pronunciation, cachedWord.pronunciation)
                    views.setTextViewText(R.id.widget_pronunciation_kr, cachedWord.pronunciationHelper)
                } else if (!WidgetDataCache.hasData(context)) {
                    Log.d(TAG, "No cached data")
                    views.setTextViewText(R.id.widget_word, "앱을 열어주세요")
                    views.setTextViewText(R.id.widget_pronunciation, "")
                    views.setTextViewText(R.id.widget_pronunciation_kr, "")
                } else {
                    views.setTextViewText(R.id.widget_word, "단어 없음")
                    views.setTextViewText(R.id.widget_pronunciation, "")
                    views.setTextViewText(R.id.widget_pronunciation_kr, "")
                }

                // Show button - reveal answer
                val showIntent = Intent(context, QuizWidget::class.java).apply {
                    action = ACTION_SHOW_ANSWER
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                val showPendingIntent = PendingIntent.getBroadcast(
                    context, appWidgetId, showIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_btn_show, showPendingIntent)

                // Container click opens app
                val appIntent = Intent(context, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    data = android.net.Uri.parse("vocaweb://study")
                }
                val appPendingIntent = PendingIntent.getActivity(
                    context, appWidgetId + 2000, appIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, appPendingIntent)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, QuizWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId, showAnswer = false)
            }
        }
    }
}
