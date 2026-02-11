package kr.ysw.voca

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kr.ysw.voca.widget.WidgetDataCache
import kr.ysw.voca.widget.TodayWordWidget

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
        TodayWordWidget.updateAllWidgets(context)

        call.resolve()
    }

    @PluginMethod
    fun updateWidgets(call: PluginCall) {
        TodayWordWidget.updateAllWidgets(context)
        call.resolve()
    }
}
