'use client';

import { useState } from 'react';

interface PhoneticSymbol {
  symbol: string;
  description: string;
  examples: { word: string; highlight: string }[];
}

const vowels: PhoneticSymbol[] = [
  {
    symbol: 'iː',
    description: 'Long E sound',
    examples: [
      { word: 'see', highlight: 'ee' },
      { word: 'meat', highlight: 'ea' },
      { word: 'field', highlight: 'ie' }
    ]
  },
  {
    symbol: 'ɪ',
    description: 'Short I sound',
    examples: [
      { word: 'sit', highlight: 'i' },
      { word: 'build', highlight: 'ui' },
      { word: 'busy', highlight: 'u' }
    ]
  },
  {
    symbol: 'e',
    description: 'Short E sound',
    examples: [
      { word: 'bed', highlight: 'e' },
      { word: 'said', highlight: 'ai' },
      { word: 'friend', highlight: 'ie' }
    ]
  },
  {
    symbol: 'æ',
    description: 'Short A sound',
    examples: [
      { word: 'cat', highlight: 'a' },
      { word: 'hand', highlight: 'a' },
      { word: 'laugh', highlight: 'au' }
    ]
  },
  {
    symbol: 'ɑː',
    description: 'Long A sound',
    examples: [
      { word: 'car', highlight: 'ar' },
      { word: 'father', highlight: 'a' },
      { word: 'palm', highlight: 'al' }
    ]
  },
  {
    symbol: 'ɒ',
    description: 'Short O sound (British)',
    examples: [
      { word: 'hot', highlight: 'o' },
      { word: 'dog', highlight: 'o' },
      { word: 'watch', highlight: 'a' }
    ]
  },
  {
    symbol: 'ɔː',
    description: 'Long O sound',
    examples: [
      { word: 'door', highlight: 'oo' },
      { word: 'law', highlight: 'aw' },
      { word: 'caught', highlight: 'au' }
    ]
  },
  {
    symbol: 'ʊ',
    description: 'Short U sound',
    examples: [
      { word: 'put', highlight: 'u' },
      { word: 'good', highlight: 'oo' },
      { word: 'could', highlight: 'ou' }
    ]
  },
  {
    symbol: 'uː',
    description: 'Long U sound',
    examples: [
      { word: 'food', highlight: 'oo' },
      { word: 'blue', highlight: 'ue' },
      { word: 'flew', highlight: 'ew' }
    ]
  },
  {
    symbol: 'ʌ',
    description: 'Short U sound (stressed)',
    examples: [
      { word: 'cup', highlight: 'u' },
      { word: 'love', highlight: 'o' },
      { word: 'blood', highlight: 'oo' }
    ]
  },
  {
    symbol: 'ɜː',
    description: 'ER sound',
    examples: [
      { word: 'bird', highlight: 'ir' },
      { word: 'work', highlight: 'or' },
      { word: 'learn', highlight: 'ear' }
    ]
  },
  {
    symbol: 'ə',
    description: 'Schwa (unstressed)',
    examples: [
      { word: 'about', highlight: 'a' },
      { word: 'pencil', highlight: 'i' },
      { word: 'memory', highlight: 'o' }
    ]
  }
];

const diphthongs: PhoneticSymbol[] = [
  {
    symbol: 'eɪ',
    description: 'AY sound',
    examples: [
      { word: 'day', highlight: 'ay' },
      { word: 'make', highlight: 'a_e' },
      { word: 'weight', highlight: 'ei' }
    ]
  },
  {
    symbol: 'aɪ',
    description: 'I sound',
    examples: [
      { word: 'time', highlight: 'i_e' },
      { word: 'buy', highlight: 'uy' },
      { word: 'height', highlight: 'ei' }
    ]
  },
  {
    symbol: 'ɔɪ',
    description: 'OY sound',
    examples: [
      { word: 'boy', highlight: 'oy' },
      { word: 'coin', highlight: 'oi' },
      { word: 'voice', highlight: 'oi' }
    ]
  },
  {
    symbol: 'əʊ',
    description: 'OH sound (British)',
    examples: [
      { word: 'go', highlight: 'o' },
      { word: 'home', highlight: 'o_e' },
      { word: 'boat', highlight: 'oa' }
    ]
  },
  {
    symbol: 'aʊ',
    description: 'OW sound',
    examples: [
      { word: 'how', highlight: 'ow' },
      { word: 'house', highlight: 'ou' },
      { word: 'cloud', highlight: 'ou' }
    ]
  }
];

const consonants: PhoneticSymbol[] = [
  {
    symbol: 'θ',
    description: 'TH sound (voiceless)',
    examples: [
      { word: 'think', highlight: 'th' },
      { word: 'bath', highlight: 'th' },
      { word: 'tooth', highlight: 'th' }
    ]
  },
  {
    symbol: 'ð',
    description: 'TH sound (voiced)',
    examples: [
      { word: 'this', highlight: 'th' },
      { word: 'mother', highlight: 'th' },
      { word: 'breathe', highlight: 'th' }
    ]
  },
  {
    symbol: 'ʃ',
    description: 'SH sound',
    examples: [
      { word: 'shop', highlight: 'sh' },
      { word: 'nation', highlight: 'ti' },
      { word: 'special', highlight: 'ci' }
    ]
  },
  {
    symbol: 'ʒ',
    description: 'ZH sound',
    examples: [
      { word: 'vision', highlight: 'si' },
      { word: 'pleasure', highlight: 's' },
      { word: 'beige', highlight: 'ge' }
    ]
  },
  {
    symbol: 'tʃ',
    description: 'CH sound',
    examples: [
      { word: 'church', highlight: 'ch' },
      { word: 'match', highlight: 'tch' },
      { word: 'nature', highlight: 'tu' }
    ]
  },
  {
    symbol: 'dʒ',
    description: 'J sound',
    examples: [
      { word: 'jump', highlight: 'j' },
      { word: 'edge', highlight: 'dge' },
      { word: 'giant', highlight: 'g' }
    ]
  },
  {
    symbol: 'ŋ',
    description: 'NG sound',
    examples: [
      { word: 'sing', highlight: 'ng' },
      { word: 'think', highlight: 'nk' },
      { word: 'tongue', highlight: 'ngue' }
    ]
  }
];

export default function PhoneticsReference() {
  const [activeTab, setActiveTab] = useState<'vowels' | 'diphthongs' | 'consonants'>('vowels');

  const getActiveSymbols = () => {
    switch (activeTab) {
      case 'vowels':
        return vowels;
      case 'diphthongs':
        return diphthongs;
      case 'consonants':
        return consonants;
      default:
        return vowels;
    }
  };

  const highlightWord = (word: string, highlight: string): string => {
    const index = word.toLowerCase().indexOf(highlight.replace('_', ''));
    if (index === -1) return word;
    
    // Handle patterns like "a_e" (magic e)
    if (highlight.includes('_')) {
      const parts = highlight.split('_');
      const pattern = new RegExp(`(${parts[0]})(.*?)(${parts[1]})`, 'i');
      return word.replace(pattern, (match, p1, p2, p3) => 
        `${p1}${p2}<span class="text-red-600 dark:text-red-400 font-bold underline">${p3}</span>`
      );
    }
    
    // Return HTML string instead of JSX
    return `${word.slice(0, index)}<span class="text-red-600 dark:text-red-400 font-bold underline">${word.slice(index, index + highlight.length)}</span>${word.slice(index + highlight.length)}`;
  };

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('vowels')}
          className={`px-4 py-2 text-xs rounded-sm font-medium transition-colors ${
            activeTab === 'vowels'
              ? 'bg-gray-800 dark:bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Vowels (모음)
        </button>
        <button
          onClick={() => setActiveTab('diphthongs')}
          className={`px-4 py-2 text-xs rounded-sm font-medium transition-colors ${
            activeTab === 'diphthongs'
              ? 'bg-gray-800 dark:bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Diphthongs (이중모음)
        </button>
        <button
          onClick={() => setActiveTab('consonants')}
          className={`px-4 py-2 text-xs rounded-sm font-medium transition-colors ${
            activeTab === 'consonants'
              ? 'bg-gray-800 dark:bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Special Consonants
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {getActiveSymbols().map((phonetic, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-3 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">/{phonetic.symbol}/</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{phonetic.description}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Examples:</div>
              {phonetic.examples.map((example, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span 
                    className="text-xs text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightWord(example.word, example.highlight)
                    }}
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-500">/{example.word}/</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-4 bg-yellow-50 dark:bg-gray-700 border border-yellow-200 dark:border-gray-600 rounded-sm p-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Quick Reference</h3>
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <li>• Red highlights show where the sound appears in spelling</li>
          <li>• Long vowels are marked with ː</li>
          <li>• Schwa /ə/ is the most common sound in unstressed syllables</li>
        </ul>
      </div>
    </div>
  );
}