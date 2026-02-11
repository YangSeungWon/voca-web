package kr.ysw.voca

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kr.ysw.voca.widget.WidgetDataCache
import kr.ysw.voca.widget.TodayWordWidget
import kr.ysw.voca.widget.QuizWidget
import kr.ysw.voca.widget.VocaAppWidget

@CapacitorPlugin(name = "WidgetPlugin")
class WidgetPlugin : Plugin() {

    @PluginMethod
    fun syncWords(call: PluginCall) {
        val wordsJson = call.getString("words")

        if (wordsJson == null) {
            call.reject("words is required")
            return
        }

        // Save to cache
        WidgetDataCache.saveWords(context, wordsJson)

        // Update all widgets
        updateAllWidgetTypes()

        call.resolve()
    }

    @PluginMethod
    fun updateWidgets(call: PluginCall) {
        updateAllWidgetTypes()
        call.resolve()
    }

    private fun updateAllWidgetTypes() {
        TodayWordWidget.updateAllWidgets(context)
        QuizWidget.updateAllWidgets(context)
        VocaAppWidget.updateAllWidgets(context)
    }
}
