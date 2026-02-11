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
 * Displays word and pronunciation, tap to reveal meaning in app
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

    companion object {
        private const val TAG = "QuizWidget"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_quiz_question)

            // Try to get word from cache
            val cachedWord = WidgetDataCache.getRandomWord(context)

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

            // Click to open study mode
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse("vocaweb://study")
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, QuizWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
