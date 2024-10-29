const wordForm = document.getElementById('wordForm');
const wordList = document.getElementById('wordList');
const toggleDarkModeButton = document.getElementById('toggleDarkMode');

// 로컬 스토리지에서 단어 목록을 불러옵니다.
function loadWords() {
    const words = JSON.parse(localStorage.getItem('words')) || [];
    wordList.innerHTML = '';
    words.forEach((wordObj, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.textContent = `${wordObj.word}: ${wordObj.meaning}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.onclick = () => deleteWord(index);
        wordItem.appendChild(deleteButton);
        wordList.appendChild(wordItem);
    });
}

// 단어를 추가합니다.
wordForm.onsubmit = function(event) {
    event.preventDefault();
    const word = document.getElementById('word').value;
    const meaning = document.getElementById('meaning').value;
    const words = JSON.parse(localStorage.getItem('words')) || [];
    words.push({ word, meaning });
    localStorage.setItem('words', JSON.stringify(words));
    loadWords();
    wordForm.reset();
};

// 단어를 삭제합니다.
function deleteWord(index) {
    const words = JSON.parse(localStorage.getItem('words')) || [];
    words.splice(index, 1);
    localStorage.setItem('words', JSON.stringify(words));
    loadWords();
}

// 다크 모드 전환
toggleDarkModeButton.onclick = function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
};

// 페이지 로드 시 단어 목록과 다크 모드 상태를 불러옵니다.
function initialize() {
    loadWords();
    const isDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

initialize();
