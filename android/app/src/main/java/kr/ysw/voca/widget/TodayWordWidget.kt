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
 * Today's Word Widget
 * Shows a random vocabulary word from cached data
 */
class TodayWordWidget : AppWidgetProvider() {

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
        private const val TAG = "TodayWordWidget"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_today_word)

            // Try to get word from cache
            val cachedWord = WidgetDataCache.getRandomWord(context)

            if (cachedWord != null) {
                Log.d(TAG, "Showing cached word: ${cachedWord.word}")
                views.setTextViewText(R.id.widget_word, cachedWord.word)
                views.setTextViewText(R.id.widget_pronunciation, cachedWord.pronunciation)
                views.setTextViewText(R.id.widget_pronunciation_kr, cachedWord.pronunciationKr)
                views.setTextViewText(R.id.widget_meaning, cachedWord.meaning)
            } else if (!WidgetDataCache.hasData(context)) {
                Log.d(TAG, "No cached data, prompting to open app")
                views.setTextViewText(R.id.widget_word, "앱을 열어주세요")
                views.setTextViewText(R.id.widget_pronunciation, "")
                views.setTextViewText(R.id.widget_pronunciation_kr, "")
                views.setTextViewText(R.id.widget_meaning, "단어를 동기화합니다")
            } else {
                views.setTextViewText(R.id.widget_word, "단어 없음")
                views.setTextViewText(R.id.widget_pronunciation, "")
                views.setTextViewText(R.id.widget_pronunciation_kr, "")
                views.setTextViewText(R.id.widget_meaning, "단어를 추가해주세요")
            }

            // Click to open app
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse("vocaweb://vocabulary")
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Update all widgets (called after cache is updated)
         */
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(context, TodayWordWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
