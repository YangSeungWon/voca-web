'use client';

import { useState, useEffect, useCallback } from 'react';

export type PronunciationHelper = 'auto' | 'ko' | 'ja' | 'en' | 'off';

interface Settings {
  pronunciationHelper: PronunciationHelper;
}

const SETTINGS_KEY = 'voca-settings';

const defaultSettings: Settings = {
  pronunciationHelper: 'auto',
};

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
}

function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const setPronunciationHelper = useCallback((value: PronunciationHelper) => {
    updateSettings({ pronunciationHelper: value });
  }, [updateSettings]);

  return {
    settings,
    isLoaded,
    setPronunciationHelper,
  };
}

// Standalone function to get pronunciation helper setting (for non-hook contexts)
export function getPronunciationHelper(): PronunciationHelper {
  if (typeof window === 'undefined') return 'auto';

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.pronunciationHelper || 'auto';
    }
  } catch {
    // ignore
  }
  return 'auto';
}
