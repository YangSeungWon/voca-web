export interface CSVWord {
  word: string;
  pronunciation?: string;
  definition: string;
  partOfSpeech?: string;
  level?: number;
  notes?: string;
}

export function parseCSV(text: string): CSVWord[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const wordIdx = headers.findIndex(h => h === 'word' || h === 'term' || h === 'vocabulary');
  const pronIdx = headers.findIndex(h => h === 'pronunciation' || h === 'phonetic' || h === 'ipa');
  const defIdx = headers.findIndex(h => h === 'definition' || h === 'meaning' || h === 'translation');
  const posIdx = headers.findIndex(h => h === 'part of speech' || h === 'type' || h === 'pos');
  const levelIdx = headers.findIndex(h => h === 'level' || h === 'difficulty');
  const notesIdx = headers.findIndex(h => h === 'notes' || h === 'memo' || h === 'comment');
  
  if (wordIdx === -1 || defIdx === -1) {
    throw new Error('CSV must have at least "Word" and "Definition" columns');
  }
  
  // Parse rows
  const words: CSVWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length <= wordIdx) continue;
    
    const word = values[wordIdx]?.trim();
    const definition = values[defIdx]?.trim();
    
    if (!word || !definition) continue;
    
    words.push({
      word,
      pronunciation: pronIdx !== -1 ? values[pronIdx]?.trim() : undefined,
      definition,
      partOfSpeech: posIdx !== -1 ? values[posIdx]?.trim() : undefined,
      level: levelIdx !== -1 ? parseInt(values[levelIdx] || '0') : 0,
      notes: notesIdx !== -1 ? values[notesIdx]?.trim() : undefined
    });
  }
  
  return words;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

export function generateCSV(words: any[]): string {
  const headers = ['Word', 'Pronunciation', 'Definition', 'Part of Speech', 'Level', 'Date Added'];
  
  const rows = words.map(item => {
    const word = item.word || item;
    return [
      word.word || '',
      word.pronunciation || '',
      word.definitions?.[0]?.meaning || '',
      word.definitions?.[0]?.partOfSpeech || '',
      (item.level || 0).toString(),
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function getCSVTemplate(): string {
  return `Word,Pronunciation,Definition,Part of Speech,Level,Notes
apple,/ˈæp.əl/,a round fruit with red or green skin,noun,0,common fruit
run,/rʌn/,to move quickly on foot,verb,0,basic verb
beautiful,/ˈbjuː.tɪ.fəl/,very attractive or pleasing,adjective,1,descriptive word
computer,/kəmˈpjuː.tər/,an electronic device for processing data,noun,0,technology
serendipity,/ˌser.ənˈdɪp.ə.ti/,finding something good by chance,noun,3,advanced vocabulary`;
}