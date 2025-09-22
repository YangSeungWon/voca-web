'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, BookOpen, Edit2 } from 'lucide-react';
import { getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

interface Example {
  id: string;
  sentence: string;
  translation?: string;
}

interface ExampleSentencesProps {
  wordId: string;
  wordText: string;
}

export default function ExampleSentences({ wordId, wordText }: ExampleSentencesProps) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSentence, setNewSentence] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSentence, setEditSentence] = useState('');
  const [editTranslation, setEditTranslation] = useState('');

  useEffect(() => {
    fetchExamples();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]);

  const fetchExamples = async () => {
    try {
      const response = await apiFetch(`/api/vocabulary/${wordId}/examples`, {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExamples(data);
      }
    } catch (error) {
      console.error('Failed to fetch examples:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSentence.trim()) return;

    try {
      const response = await apiFetch(`/api/vocabulary/${wordId}/examples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({
          sentence: newSentence,
          translation: newTranslation || null
        })
      });

      if (response.ok) {
        const newExample = await response.json();
        setExamples([...examples, newExample]);
        setNewSentence('');
        setNewTranslation('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to add example:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await apiFetch(`/api/vocabulary/${wordId}/examples/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({
          sentence: editSentence,
          translation: editTranslation || null
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setExamples(examples.map(ex => ex.id === id ? updated : ex));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update example:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this example sentence?')) return;

    try {
      const response = await apiFetch(`/api/vocabulary/${wordId}/examples/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId()
        }
      });

      if (response.ok) {
        setExamples(examples.filter(ex => ex.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete example:', error);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-500">Loading examples...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
          <BookOpen size={12} />
          Example Sentences
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-sm"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {showAddForm && (
        <div className="p-2 bg-gray-50 rounded-sm space-y-2">
          <input
            type="text"
            value={newSentence}
            onChange={(e) => setNewSentence(e.target.value)}
            placeholder={`Example sentence with "${wordText}"...`}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            placeholder="Translation (optional)..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newSentence.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewSentence('');
                setNewTranslation('');
              }}
              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {examples.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No example sentences yet</p>
        ) : (
          examples.map((example) => (
            <div key={example.id} className="p-2 bg-white border border-gray-200 rounded-sm">
              {editingId === example.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editSentence}
                    onChange={(e) => setEditSentence(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={editTranslation}
                    onChange={(e) => setEditTranslation(e.target.value)}
                    placeholder="Translation (optional)..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdate(example.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded-sm"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">{example.sentence}</p>
                    {example.translation && (
                      <p className="text-xs text-gray-500 italic mt-1">{example.translation}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => {
                        setEditingId(example.id);
                        setEditSentence(example.sentence);
                        setEditTranslation(example.translation || '');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(example.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}