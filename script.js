const boardSize = 100;
const boardCols = 10;
const boardRows = 10;

const board = document.getElementById('board');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const diceNumberSpan = document.getElementById('dice-number');
const turnIndicator = document.getElementById('current-player');
const questionContainer = document.getElementById('question-container');
const questionText = document.getElementById('question-text');
const answersDiv = document.getElementById('answers');
const winnerMessage = document.getElementById('winner-message');

let currentPlayer = 1;
let positions = [0, 0]; // index 0 = player1 pos, index 1 = player2 pos
let isMoving = false;

// Tangga dan ular, format: dari -> ke
const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const snakes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

// Pertanyaan pilihan ganda Indonesia
const questions = [
  {
    q: "Ibukota Indonesia adalah?",
    options: ["Jakarta", "Bandung", "Surabaya", "Medan"],
    answer: 0,
  },
  {
    q: "Sungai terpanjang di Indonesia adalah?",
    options: ["Kapuas", "Mahakam", "Barito", "Musik"],
    answer: 0,
  },
  {
    q: "Pahlawan nasional dari Aceh yang terkenal?",
    options: ["Cut Nyak Dhien", "Sukarno", "Diponegoro", "Gatotkaca"],
    answer: 0,
  },
  {
    q: "Lagu kebangsaan Indonesia adalah?",
    options: ["Indonesia Raya", "Tanah Airku", "Halo-Halo Bandung", "Bagimu Negeri"],
    answer: 0,
  },
  {
    q: "Pulau terbesar di Indonesia?",
    options: ["Kalimantan", "Sumatra", "Jawa", "Sulawesi"],
    answer: 0,
  },
  {
    q: "Presiden pertama Indonesia?",
    options: ["Sukarno", "Soeharto", "Habibie", "Jokowi"],
    answer: 0,
  },
  {
    q: "Bahasa resmi Indonesia adalah?",
    options: ["Bahasa Indonesia", "Bahasa Jawa", "Bahasa Sunda", "Bahasa Melayu"],
    answer: 0,
  },
  {
    q: "Monumen nasional di Jakarta dikenal sebagai?",
    options: ["Monas", "Tugu", "Candi", "Gedung Sate"],
    answer: 0,
  },
  {
    q: "Mata uang Indonesia adalah?",
    options: ["Rupiah", "Dollar", "Euro", "Ringgit"],
    answer: 0,
  },
  {
    q: "Suku terbesar di Indonesia?",
    options: ["Jawa", "Batak", "Bugis", "Minangkabau"],
    answer: 0,
  },
];

// Akan digunakan untuk menampilkan pertanyaan acak dan tidak berulang
let askedQuestions = new Set();

// Generate papan 10x10, nomor kotak 1 sampai 100 (snake and ladder board)
function createBoard() {
  board.innerHTML = '';
  for (let i = boardSize; i >= 1; i--) {
    const sq = document.createElement('div');
    sq.classList.add('square');
    sq.dataset.index = i;

    // Ular dan tangga ditandai
    if (ladders[i]) sq.style.backgroundColor = '#adebad'; // hijau muda tangga
    if (snakes[i]) sq.style.backgroundColor = '#f5b7b1'; // merah muda ular

    // Nomor kotak ditampilkan
    sq.textContent = i;
    board.appendChild(sq);
  }
}

// Posisi pion berdasarkan nomor kotak, hitung posisi grid untuk CSS absolute
function getSquarePosition(n) {
  // Papan ular tangga biasanya zig-zag tiap baris
  // Baris dihitung dari bawah ke atas
  const rowFromBottom = Math.floor((n - 1) / boardCols);
  let col = (n - 1) % boardCols;

  // Jika baris ganjil (dari bawah), kolom terbalik
  if (rowFromBottom % 2 === 1) {
    col = boardCols - 1 - col;
  }
  // Posisi X dan Y piksel
  const x = col * 50 + 3; // padding + offset pion
  const y = (boardRows - 1 - rowFromBottom) * 50 + 3;
  return { x, y };
}

function createPion(playerNum) {
  const pion = document.createElement('div');
  pion.classList.add('pion');
  pion.classList.add(`player${playerNum}`);
  pion.style.position = 'absolute';
  pion.style.width = '24px';
  pion.style.height = '24px';
  board.appendChild(pion);
  return pion;
}

const pion1 = createPion(1);
const pion2 = createPion(2);

function movePion(playerNum, position) {
  const pion = playerNum === 1 ? pion1 : pion2;
  if (position < 1) position = 1;
  if (position > boardSize) position = boardSize;
  const pos = getSquarePosition(position);
  pion.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

// Animasi per langkah pion bergerak satu per satu (Promise based)
function animateMove(playerNum, fromPos, toPos) {
  return new Promise(async (resolve) => {
    let step = fromPos;
    const pion = playerNum === 1 ? pion1 : pion2;
    while (step < toPos) {
      step++;
      const pos = getSquarePosition(step);
      pion.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      await new Promise(r => setTimeout(r, 300));
    }
    resolve();
  });
}

// Dadu
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// Tampilkan pertanyaan acak yang belum ditanya
function getRandomQuestion() {
  if (askedQuestions.size >= 10) askedQuestions.clear(); // reset jika semua sudah ditanya
  let idx;
  do {
    idx = Math.floor(Math.random() * questions.length);
  } while (askedQuestions.has(idx));
  askedQuestions.add(idx);
  return questions[idx];
}

async function handleTurn() {
  if (isMoving) return;
  isMoving = true;
  rollDiceBtn.disabled = true;
  diceNumberSpan.textContent = '-';

  // lempar dadu dengan animasi kecil
  for (let i = 0; i < 10; i++) {
    diceNumberSpan.textContent = Math.floor(Math.random() * 6) + 1;
    await new Promise(r => setTimeout(r, 50));
  }

  const diceRoll = rollDice();
  diceNumberSpan.textContent = diceRoll;

  const playerIdx = currentPlayer - 1;
  let from = positions[playerIdx];
  let to = from + diceRoll;
  if (to > boardSize) to = from; // Tidak bergerak jika melebihi 100

  // Animasi gerak pion
  await animateMove(currentPlayer, from, to);
  positions[playerIdx] = to;

  // Cek ular atau tangga
  if (ladders[to]) {
    const ladderTo = ladders[to];
    await animateMove(currentPlayer, to, ladderTo);
    positions[playerIdx] = ladderTo;
    to = ladderTo;
  } else if (snakes[to]) {
    const snakeTo = snakes[to];
    await animateMove(currentPlayer, to, snakeTo);
    positions[playerIdx] = snakeTo;
    to = snakeTo;
  }

  // Cek apakah di titik pertanyaan (10 titik)
  // Tentukan 10 titik pertanyaan di board (acakan tapi tetap sama tiap game)
  const questionPoints = [7, 15, 23, 34, 42, 56, 65, 77, 88, 97];
  if (questionPoints.includes(to)) {
    await askQuestion(currentPlayer);
  }

  // Cek menang
  if (positions[playerIdx] === boardSize) {
    winnerMessage.textContent = `🎉 Pemain ${currentPlayer} menang! Selamat! 🎉`;
    winnerMessage.classList.remove('hidden');
    rollDiceBtn.disabled = true;
    isMoving = false;
    return;
  }

  // Ganti giliran
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  turnIndicator.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? 'Merah' : 'Kuning'})`;
  rollDiceBtn.disabled = false;
  isMoving = false;
}

function askQuestion(playerNum) {
  return new Promise((resolve) => {
    rollDiceBtn.disabled = true;
    questionContainer.classList.remove('hidden');

    const q = getRandomQuestion();
    questionText.textContent = q.q;
    answersDiv.innerHTML = '';

    let answered = false;

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (idx === q.answer) {
          btn.classList.add('correct');
          questionText.textContent = 'Jawaban benar! Kamu boleh lanjut.';
          setTimeout(() => {
            questionContainer.classList.add('hidden');
            rollDiceBtn.disabled = false;
            resolve(true);
          }, 1500);
        } else {
          btn.classList.add('wrong');
          questionText.textContent = 'Jawaban salah! Kamu mundur 3 langkah.';
          // mundur 3 langkah
          setTimeout(async () => {
            let playerIdx = playerNum - 1;
            let pos = positions[playerIdx];
            let newPos = pos - 3;
            if (newPos < 1) newPos = 1;
            await animateMove(playerNum, pos, newPos);
            positions[playerIdx] = newPos;
            questionContainer.classList.add('hidden');
            rollDiceBtn.disabled = false;
            resolve(false);
          }, 1500);
        }
      };
      answersDiv.appendChild(btn);
    });
  });
}

function init() {
  createBoard();
  positions = [1, 1];
  movePion(1, 1);
  movePion(2, 1);
  currentPlayer = 1;
  turnIndicator.textContent = `Player ${currentPlayer} (Merah)`;
  diceNumberSpan.textContent = '-';
  winnerMessage.classList.add('hidden');
  rollDiceBtn.disabled = false;
  questionContainer.classList.add('hidden');
}

rollDiceBtn.addEventListener('click', () => {
  handleTurn();
});

init();
