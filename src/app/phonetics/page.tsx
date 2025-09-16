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
  },
  {
    symbol: 'ɪə',
    description: 'EAR sound',
    examples: [
      { word: 'here', highlight: 'ere' },
      { word: 'fear', highlight: 'ear' },
      { word: 'deer', highlight: 'eer' }
    ]
  },
  {
    symbol: 'eə',
    description: 'AIR sound',
    examples: [
      { word: 'hair', highlight: 'air' },
      { word: 'care', highlight: 'are' },
      { word: 'where', highlight: 'ere' }
    ]
  },
  {
    symbol: 'ʊə',
    description: 'OOR sound',
    examples: [
      { word: 'poor', highlight: 'oor' },
      { word: 'sure', highlight: 'ure' },
      { word: 'tour', highlight: 'our' }
    ]
  }
];

const consonants: PhoneticSymbol[] = [
  {
    symbol: 'p',
    description: 'P sound (voiceless)',
    examples: [
      { word: 'pen', highlight: 'p' },
      { word: 'happy', highlight: 'pp' },
      { word: 'stop', highlight: 'p' }
    ]
  },
  {
    symbol: 'b',
    description: 'B sound (voiced)',
    examples: [
      { word: 'big', highlight: 'b' },
      { word: 'rabbit', highlight: 'bb' },
      { word: 'job', highlight: 'b' }
    ]
  },
  {
    symbol: 't',
    description: 'T sound (voiceless)',
    examples: [
      { word: 'top', highlight: 't' },
      { word: 'better', highlight: 'tt' },
      { word: 'cat', highlight: 't' }
    ]
  },
  {
    symbol: 'd',
    description: 'D sound (voiced)',
    examples: [
      { word: 'dog', highlight: 'd' },
      { word: 'ladder', highlight: 'dd' },
      { word: 'bad', highlight: 'd' }
    ]
  },
  {
    symbol: 'k',
    description: 'K sound (voiceless)',
    examples: [
      { word: 'cat', highlight: 'c' },
      { word: 'king', highlight: 'k' },
      { word: 'back', highlight: 'ck' }
    ]
  },
  {
    symbol: 'g',
    description: 'G sound (voiced)',
    examples: [
      { word: 'go', highlight: 'g' },
      { word: 'bigger', highlight: 'gg' },
      { word: 'dog', highlight: 'g' }
    ]
  },
  {
    symbol: 'f',
    description: 'F sound (voiceless)',
    examples: [
      { word: 'fish', highlight: 'f' },
      { word: 'phone', highlight: 'ph' },
      { word: 'laugh', highlight: 'gh' }
    ]
  },
  {
    symbol: 'v',
    description: 'V sound (voiced)',
    examples: [
      { word: 'van', highlight: 'v' },
      { word: 'over', highlight: 'v' },
      { word: 'love', highlight: 've' }
    ]
  },
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
    symbol: 's',
    description: 'S sound (voiceless)',
    examples: [
      { word: 'sun', highlight: 's' },
      { word: 'miss', highlight: 'ss' },
      { word: 'city', highlight: 'c' }
    ]
  },
  {
    symbol: 'z',
    description: 'Z sound (voiced)',
    examples: [
      { word: 'zoo', highlight: 'z' },
      { word: 'busy', highlight: 's' },
      { word: 'rose', highlight: 's' }
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
    symbol: 'h',
    description: 'H sound',
    examples: [
      { word: 'house', highlight: 'h' },
      { word: 'behind', highlight: 'h' },
      { word: 'who', highlight: 'wh' }
    ]
  },
  {
    symbol: 'm',
    description: 'M sound',
    examples: [
      { word: 'man', highlight: 'm' },
      { word: 'summer', highlight: 'mm' },
      { word: 'come', highlight: 'm' }
    ]
  },
  {
    symbol: 'n',
    description: 'N sound',
    examples: [
      { word: 'no', highlight: 'n' },
      { word: 'funny', highlight: 'nn' },
      { word: 'knife', highlight: 'kn' }
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
  },
  {
    symbol: 'l',
    description: 'L sound',
    examples: [
      { word: 'love', highlight: 'l' },
      { word: 'hello', highlight: 'll' },
      { word: 'ball', highlight: 'll' }
    ]
  },
  {
    symbol: 'r',
    description: 'R sound',
    examples: [
      { word: 'red', highlight: 'r' },
      { word: 'carry', highlight: 'rr' },
      { word: 'write', highlight: 'wr' }
    ]
  },
  {
    symbol: 'w',
    description: 'W sound',
    examples: [
      { word: 'water', highlight: 'w' },
      { word: 'quick', highlight: 'qu' },
      { word: 'one', highlight: 'o' }
    ]
  },
  {
    symbol: 'j',
    description: 'Y sound',
    examples: [
      { word: 'yes', highlight: 'y' },
      { word: 'use', highlight: 'u' },
      { word: 'few', highlight: 'ew' }
    ]
  }
];

export default function PhoneticsPage() {
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

  const highlightWord = (word: string, highlight: string) => {
    const index = word.toLowerCase().indexOf(highlight.replace('_', ''));
    if (index === -1) return word;
    
    // Handle patterns like "a_e" (magic e)
    if (highlight.includes('_')) {
      const parts = highlight.split('_');
      const pattern = new RegExp(`(${parts[0]})(.*?)(${parts[1]})`, 'i');
      return word.replace(pattern, (match, p1, p2, p3) => 
        `${p1}${p2}<span class="text-red-600 font-bold underline">${p3}</span>`
      );
    }
    
    return (
      <>
        {word.slice(0, index)}
        <span className="text-red-600 font-bold underline">
          {word.slice(index, index + highlight.length)}
        </span>
        {word.slice(index + highlight.length)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <header className="py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">English Phonetic Symbols (IPA)</h1>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200"
              >
                Back to Vocabulary
              </button>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('vowels')}
            className={`px-6 py-3 rounded-sm font-medium transition-colors ${
              activeTab === 'vowels'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vowels (모음)
          </button>
          <button
            onClick={() => setActiveTab('diphthongs')}
            className={`px-6 py-3 rounded-sm font-medium transition-colors ${
              activeTab === 'diphthongs'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Diphthongs (이중모음)
          </button>
          <button
            onClick={() => setActiveTab('consonants')}
            className={`px-6 py-3 rounded-sm font-medium transition-colors ${
              activeTab === 'consonants'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Consonants (자음)
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getActiveSymbols().map((phonetic, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-sm p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl font-bold text-gray-800">/{phonetic.symbol}/</div>
                <div className="text-xs text-gray-500 mt-2">{phonetic.description}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Examples:</div>
                {phonetic.examples.map((example, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span 
                      className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightWord(example.word, example.highlight) as string 
                      }}
                    />
                    <span className="text-xs text-gray-400">/{example.word}/</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">발음 학습 팁</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 빨간색으로 표시된 부분이 해당 발음기호가 나타나는 철자입니다</li>
            <li>• 같은 발음기호라도 다양한 철자로 표현될 수 있습니다</li>
            <li>• 모음은 단모음(short)과 장모음(long)으로 구분됩니다 (ː 표시)</li>
            <li>• 자음은 유성음(voiced)과 무성음(voiceless)으로 구분됩니다</li>
            <li>• Schwa /ə/는 영어에서 가장 흔한 소리로, 강세가 없는 음절에서 나타납니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}