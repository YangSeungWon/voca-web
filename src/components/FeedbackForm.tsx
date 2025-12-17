'use client';

import { useState } from 'react';
import { Send, Bug, Lightbulb, MessageCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';

type FeedbackType = 'bug' | 'suggestion' | 'other';

export default function FeedbackForm() {
  const t = useTranslations('feedback');
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode }[] = [
    { value: 'bug', label: t('bug'), icon: <Bug size={18} /> },
    { value: 'suggestion', label: t('suggestion'), icon: <Lightbulb size={18} /> },
    { value: 'other', label: t('other'), icon: <MessageCircle size={18} /> },
  ];

  const getPlaceholder = () => {
    switch (type) {
      case 'bug': return t('messagePlaceholder.bug');
      case 'suggestion': return t('messagePlaceholder.suggestion');
      default: return t('messagePlaceholder.other');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 10) {
      setError(t('minLength'));
      return;
    }

    if (message.length > 2000) {
      setError(t('maxLength'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setMessage('');
        setEmail('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit feedback');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('success')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t('successMessage')}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('type')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {feedbackTypes.map((ft) => (
            <button
              key={ft.value}
              type="button"
              onClick={() => setType(ft.value)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                type === ft.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {ft.icon}
              <span className="text-sm font-medium">{ft.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('message')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getPlaceholder()}
          rows={5}
          maxLength={2000}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {message.length}/2000
        </div>
      </div>

      {/* Email (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          maxLength={254}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          {t('emailHint')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || message.trim().length < 10}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={18} />
        <span className="font-medium">{isSubmitting ? t('sending') : t('send')}</span>
      </button>
    </form>
  );
}
