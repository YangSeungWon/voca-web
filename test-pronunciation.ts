/**
 * IPA to Korean pronunciation conversion test script
 */

import { formatPronunciation } from './src/lib/ipa-to-korean';

interface TestCase {
  word: string;
  ipa: string;
  expected?: string; // 기대되는 한글 발음 (선택)
}

const testCases: TestCase[] = [
  // 자음 군집 (consonant clusters)
  { word: 'promise', ipa: '/ˈpɹɒmɪs/', expected: '프로밋' },
  { word: 'tree', ipa: '/tɹiː/', expected: '트리' },
  { word: 'drive', ipa: '/dɹaɪv/', expected: '드라입' },
  { word: 'deprive', ipa: '/dɪˈpɹaɪv/', expected: '디프라입' },
  { word: 'problem', ipa: '/ˈpɹɒbləm/', expected: '프로브럼' },
  { word: 'try', ipa: '/tɹaɪ/', expected: '트라이' },
  { word: 'dream', ipa: '/dɹiːm/', expected: '드림' },
  { word: 'bring', ipa: '/bɹɪŋ/', expected: '브링' },
  { word: 'create', ipa: '/kɹiˈeɪt/', expected: '크리에이트' },
  { word: 'great', ipa: '/gɹeɪt/', expected: '그레읻' },
  { word: 'friend', ipa: '/fɹɛnd/', expected: '프렌드' },
  { word: 'print', ipa: '/pɹɪnt/', expected: '프린트' },
  { word: 'practice', ipa: '/ˈpɹæktɪs/', expected: '프랙팃' },
  { word: 'proud', ipa: '/pɹaʊd/', expected: '프라욷' },
  { word: 'brown', ipa: '/bɹaʊn/', expected: '브라운' },
  { word: 'train', ipa: '/tɹeɪn/', expected: '트레인' },
  { word: 'drink', ipa: '/dɹɪŋk/', expected: '드링크' },
  { word: 'green', ipa: '/gɹiːn/', expected: '그린' },
  { word: 'crime', ipa: '/kɹaɪm/', expected: '크라임' },
  { word: 'fruit', ipa: '/fɹuːt/', expected: '프룯' },

  // 이중모음 (diphthongs)
  { word: 'time', ipa: '/taɪm/', expected: '타임' },
  { word: 'day', ipa: '/deɪ/', expected: '데이' },
  { word: 'boy', ipa: '/bɔɪ/', expected: '보이' },
  { word: 'now', ipa: '/naʊ/', expected: '나우' },
  { word: 'go', ipa: '/goʊ/', expected: '고' },
  { word: 'say', ipa: '/seɪ/', expected: '세이' },
  { word: 'my', ipa: '/maɪ/', expected: '마이' },

  // 강세 마킹 (stress marking)
  { word: 'resilience', ipa: '/ɹɪˈzɪl.i.əns/', expected: '리지리언스' },
  { word: 'improvise', ipa: '/ˈɪm.pɹə.vaɪz/', expected: '임프러바잇' },
  { word: 'computer', ipa: '/kəmˈpjuːtə/', expected: '컴퓨터' },
  { word: 'important', ipa: '/ɪmˈpɔːtənt/', expected: '임포턴트' },
  { word: 'develop', ipa: '/dɪˈvɛləp/', expected: '디베럽' },

  // 복잡한 발음
  { word: 'beautiful', ipa: '/ˈbjuːtɪfəl/', expected: '뷰티펄' },
  { word: 'comfortable', ipa: '/ˈkʌmftəbəl/', expected: '컴프터벌' },
  { word: 'specific', ipa: '/spəˈsɪfɪk/', expected: '스퍼시픽' },
  { word: 'pronunciation', ipa: '/pɹəˌnʌnsiˈeɪʃən/', expected: '프러넌시에이선' },
  { word: 'interesting', ipa: '/ˈɪntɹəstɪŋ/', expected: '인트럿팅' },

  // 일반적인 단어들
  { word: 'hello', ipa: '/həˈləʊ/', expected: '허로' },
  { word: 'world', ipa: '/wɜːld/', expected: '월드' },
  { word: 'water', ipa: '/ˈwɔːtə/', expected: '웓어' },
  { word: 'student', ipa: '/ˈstuːdənt/', expected: '스투던트' },
  { word: 'teacher', ipa: '/ˈtiːtʃə/', expected: '티처' },
  { word: 'book', ipa: '/bʊk/', expected: '북' },
  { word: 'school', ipa: '/skuːl/', expected: '스쿨' },
  { word: 'happy', ipa: '/ˈhæpi/', expected: '해피' },
  { word: 'thank', ipa: '/θæŋk/', expected: '생크' },
  { word: 'think', ipa: '/θɪŋk/', expected: '싱크' },

  // 어려운 소리들
  { word: 'the', ipa: '/ðə/', expected: '더' },
  { word: 'this', ipa: '/ðɪs/', expected: '딧' },
  { word: 'vision', ipa: '/ˈvɪʒən/', expected: '비전' },
  { word: 'measure', ipa: '/ˈmɛʒə/', expected: '메저' },
  { word: 'garage', ipa: '/gəˈɹɑːʒ/', expected: '거랒' },

  // 일상 단어들
  { word: 'phone', ipa: '/foʊn/', expected: '폰' },
  { word: 'people', ipa: '/ˈpiːpəl/', expected: '피펄' },
  { word: 'person', ipa: '/ˈpɜːsən/', expected: '퍼선' },
  { word: 'place', ipa: '/pleɪs/', expected: '프레잇' },
  { word: 'work', ipa: '/wɜːk/', expected: '웍' },
  { word: 'family', ipa: '/ˈfæməli/', expected: '패머리' },
  { word: 'country', ipa: '/ˈkʌntɹi/', expected: '컨트리' },
  { word: 'company', ipa: '/ˈkʌmpəni/', expected: '컴퍼니' },
  { word: 'party', ipa: '/ˈpɑːti/', expected: '파티' },
  { word: 'story', ipa: '/ˈstɔːɹi/', expected: '스토리' },
  { word: 'money', ipa: '/ˈmʌni/', expected: '머니' },
  { word: 'office', ipa: '/ˈɒfɪs/', expected: '오핏' },
  { word: 'coffee', ipa: '/ˈkɒfi/', expected: '코피' },
  { word: 'market', ipa: '/ˈmɑːkɪt/', expected: '마킫' },
  { word: 'business', ipa: '/ˈbɪznəs/', expected: '빗넛' },
  { word: 'service', ipa: '/ˈsɜːvɪs/', expected: '서빗' },
  { word: 'system', ipa: '/ˈsɪstəm/', expected: '싯텀' },
  { word: 'program', ipa: '/ˈpɹoʊgɹæm/', expected: '프로그램' },
  { word: 'project', ipa: '/ˈpɹɒdʒɛkt/', expected: '프로젝트' },
  { word: 'product', ipa: '/ˈpɹɒdʌkt/', expected: '프로덕트' },

  // 학습 관련
  { word: 'learn', ipa: '/lɜːn/', expected: '런' },
  { word: 'study', ipa: '/ˈstʌdi/', expected: '스터디' },
  { word: 'language', ipa: '/ˈlæŋgwɪdʒ/', expected: '랭귖' },
  { word: 'english', ipa: '/ˈɪŋglɪʃ/', expected: '잉그릿' },
  { word: 'korean', ipa: '/kəˈɹiən/', expected: '커리언' },
  { word: 'class', ipa: '/klɑːs/', expected: '크랏' },
  { word: 'lesson', ipa: '/ˈlɛsən/', expected: '레선' },
  { word: 'practice', ipa: '/ˈpɹæktɪs/', expected: '프랙팃' },
  { word: 'example', ipa: '/ɪgˈzɑːmpəl/', expected: '익잠펄' },
  { word: 'answer', ipa: '/ˈɑːnsə/', expected: '안서' },
  { word: 'question', ipa: '/ˈkwɛstʃən/', expected: '크엣천' },

  // 기술 관련
  { word: 'internet', ipa: '/ˈɪntənet/', expected: '인터넫' },
  { word: 'website', ipa: '/ˈwɛbsaɪt/', expected: '엡사읻' },
  { word: 'application', ipa: '/ˌæplɪˈkeɪʃən/', expected: '앱리케이선' },
  { word: 'technology', ipa: '/tɛkˈnɒlədʒi/', expected: '텍노러지' },
  { word: 'digital', ipa: '/ˈdɪdʒɪtəl/', expected: '디지털' },
  { word: 'mobile', ipa: '/ˈmoʊbaɪl/', expected: '모바일' },
  { word: 'social', ipa: '/ˈsoʊʃəl/', expected: '소설' },
  { word: 'media', ipa: '/ˈmiːdiə/', expected: '미디어' },
  { word: 'video', ipa: '/ˈvɪdioʊ/', expected: '비디오' },
  { word: 'music', ipa: '/ˈmjuːzɪk/', expected: '뮤직' },

  // 동작 동사
  { word: 'start', ipa: '/stɑːt/', expected: '스탇' },
  { word: 'stop', ipa: '/stɒp/', expected: '스톱' },
  { word: 'play', ipa: '/pleɪ/', expected: '프레이' },
  { word: 'show', ipa: '/ʃoʊ/', expected: '소' },
  { word: 'change', ipa: '/tʃeɪndʒ/', expected: '체인즈' },
  { word: 'break', ipa: '/bɹeɪk/', expected: '브레익' },
  { word: 'trust', ipa: '/tɹʌst/', expected: '트럿트' },
  { word: 'travel', ipa: '/ˈtɹævəl/', expected: '트래벌' },
  { word: 'strong', ipa: '/stɹɒŋ/', expected: '스트롱' },
  { word: 'straight', ipa: '/stɹeɪt/', expected: '스트레읻' },
];

console.log('='.repeat(100));
console.log('IPA to Korean Pronunciation Conversion Test');
console.log('='.repeat(100));
console.log();

let passCount = 0;
let failCount = 0;
let noExpectedCount = 0;

for (const testCase of testCases) {
  const { korean } = formatPronunciation(testCase.ipa);

  // Remove HTML tags for comparison
  const cleanKorean = korean.replace(/<\/?strong>/g, '');

  let status = '   ';
  if (testCase.expected) {
    if (cleanKorean === testCase.expected) {
      status = '✓';
      passCount++;
    } else {
      status = '✗';
      failCount++;
    }
  } else {
    status = '-';
    noExpectedCount++;
  }

  console.log(`${status} ${testCase.word.padEnd(20)} ${testCase.ipa.padEnd(25)} → ${korean.padEnd(30)} ${testCase.expected ? `(expected: ${testCase.expected})` : ''}`);
}

console.log();
console.log('='.repeat(100));
console.log(`Results: ✓ ${passCount} passed | ✗ ${failCount} failed | - ${noExpectedCount} no expected`);
console.log('='.repeat(100));

// HTML로도 보여주기 (강세 표시 확인용)
console.log();
console.log('Sample with HTML (stress marking):');
console.log('-'.repeat(100));
const samples = ['deprive', 'resilience', 'improvise', 'pronunciation', 'computer'];
for (const word of samples) {
  const test = testCases.find(t => t.word === word);
  if (test) {
    const { korean } = formatPronunciation(test.ipa);
    console.log(`${test.word.padEnd(20)} → ${korean}`);
  }
}
