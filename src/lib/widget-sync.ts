import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetPluginInterface {
  syncWords(options: { words: string }): Promise<void>;
  updateWidgets(): Promise<void>;
}

const WidgetPlugin = registerPlugin<WidgetPluginInterface>('WidgetPlugin');

interface WordData {
  word: string;
  pronunciation: string;
  pronunciationKr: string;
  meaning: string;
  level: number;
}

/**
 * Sync vocabulary words to native widget cache
 * Called when vocabulary is loaded in the app
 */
export async function syncWordsToWidget(words: WordData[]): Promise<void> {
  // Only run on native Android
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    const wordsJson = JSON.stringify(words);
    await WidgetPlugin.syncWords({ words: wordsJson });
    console.log('[WidgetSync] Synced', words.length, 'words to widget');
  } catch (error) {
    console.error('[WidgetSync] Failed to sync words:', error);
  }
}

/**
 * Request widget update
 */
export async function updateWidgets(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    await WidgetPlugin.updateWidgets();
    console.log('[WidgetSync] Widgets updated');
  } catch (error) {
    console.error('[WidgetSync] Failed to update widgets:', error);
  }
}
