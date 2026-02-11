package kr.ysw.voca.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Cache for widget data - stores word list locally so widgets don't need network access
 */
object WidgetDataCache {
    private const val PREFS_NAME = "WidgetCache"
    private const val KEY_WORDS = "cached_words"
    private const val KEY_LAST_INDEX = "last_index"
    private const val KEY_UPDATED_AT = "updated_at"

    data class CachedWord(
        val word: String,
        val pronunciation: String,
        val pronunciationHelper: String,  // Formatted pronunciation based on user's language setting
        val meaning: String,
        val level: Int
    )

    /**
     * Save words to cache (called from web app via JavaScript bridge)
     */
    fun saveWords(context: Context, wordsJson: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_WORDS, wordsJson)
            .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    /**
     * Get a random word from cache
     */
    fun getRandomWord(context: Context): CachedWord? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val wordsJson = prefs.getString(KEY_WORDS, null) ?: return null

        return try {
            val jsonArray = JSONArray(wordsJson)
            if (jsonArray.length() == 0) return null

            // Get next word (rotate through list)
            val lastIndex = prefs.getInt(KEY_LAST_INDEX, -1)
            val nextIndex = (lastIndex + 1) % jsonArray.length()

            // Save new index
            prefs.edit().putInt(KEY_LAST_INDEX, nextIndex).apply()

            val wordObj = jsonArray.getJSONObject(nextIndex)
            CachedWord(
                word = wordObj.optString("word", ""),
                pronunciation = wordObj.optString("pronunciation", ""),
                pronunciationHelper = wordObj.optString("pronunciationHelper", ""),
                meaning = wordObj.optString("meaning", ""),
                level = wordObj.optInt("level", 0)
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Check if cache has data
     */
    fun hasData(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val wordsJson = prefs.getString(KEY_WORDS, null)
        return !wordsJson.isNullOrEmpty() && wordsJson != "[]"
    }

    /**
     * Get cache age in milliseconds
     */
    fun getCacheAge(context: Context): Long {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val updatedAt = prefs.getLong(KEY_UPDATED_AT, 0)
        return if (updatedAt > 0) System.currentTimeMillis() - updatedAt else Long.MAX_VALUE
    }
}
