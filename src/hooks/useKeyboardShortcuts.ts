import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      shortcuts.forEach(shortcut => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  useKeyboardShortcuts([
    {
      key: '/',
      handler: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search'
    },
    {
      key: 's',
      handler: () => {
        const studyButton = document.querySelector('[data-shortcut="study"]') as HTMLElement;
        if (studyButton) {
          studyButton.click();
        }
      },
      description: 'Go to Study mode'
    },
    {
      key: 'v',
      handler: () => {
        const vocabButton = document.querySelector('[data-shortcut="vocabulary"]') as HTMLElement;
        if (vocabButton) {
          vocabButton.click();
        }
      },
      description: 'Go to Vocabulary'
    },
    {
      key: 'd',
      handler: () => {
        const themeToggle = document.querySelector('[data-shortcut="theme"]') as HTMLElement;
        if (themeToggle) {
          themeToggle.click();
        }
      },
      description: 'Toggle dark mode'
    },
    {
      key: '?',
      shift: true,
      handler: () => {
        // Show keyboard shortcuts help modal
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
          modal.classList.toggle('hidden');
        }
      },
      description: 'Show keyboard shortcuts'
    }
  ]);
}