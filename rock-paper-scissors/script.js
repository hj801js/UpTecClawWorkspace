const CHOICES = ['scissors', 'rock', 'paper'];
const EMOJIS = { scissors: '\u270C\uFE0F', rock: '\u270A', paper: '\u270B' };
const LABELS = { scissors: '가위', rock: '바위', paper: '보' };
const WINS = {
    scissors: 'paper',
    rock: 'scissors',
    paper: 'rock'
};

class Game {
    constructor() {
        this.score = { wins: 0, losses: 0, draws: 0 };
    }

    getComputerChoice() {
        return CHOICES[Math.floor(Math.random() * 3)];
    }

    judge(player, computer) {
        if (player === computer) return 'draw';
        return WINS[player] === computer ? 'win' : 'lose';
    }

    play(playerChoice) {
        const computerChoice = this.getComputerChoice();
        const outcome = this.judge(playerChoice, computerChoice);

        if (outcome === 'win') this.score.wins++;
        else if (outcome === 'lose') this.score.losses++;
        else this.score.draws++;

        return { playerChoice, computerChoice, outcome };
    }

    reset() {
        this.score = { wins: 0, losses: 0, draws: 0 };
    }
}

// DOM 연결
const game = new Game();

const playerChoiceEl = document.querySelector('.player-choice');
const computerChoiceEl = document.querySelector('.computer-choice');
const resultTextEl = document.querySelector('.result-text');
const winsEl = document.getElementById('wins');
const lossesEl = document.getElementById('losses');
const drawsEl = document.getElementById('draws');

function updateDisplay({ playerChoice, computerChoice, outcome }) {
    // 이모지 표시
    playerChoiceEl.textContent = EMOJIS[playerChoice];
    computerChoiceEl.textContent = EMOJIS[computerChoice];

    // 애니메이션 재실행
    playerChoiceEl.classList.remove('animate');
    computerChoiceEl.classList.remove('animate');
    void playerChoiceEl.offsetWidth;
    playerChoiceEl.classList.add('animate');
    computerChoiceEl.classList.add('animate');

    // 결과 텍스트
    const p = LABELS[playerChoice];
    const c = LABELS[computerChoice];
    resultTextEl.className = 'result-text ' + outcome;

    if (outcome === 'win') {
        resultTextEl.textContent = `${p} > ${c} 승리!`;
    } else if (outcome === 'lose') {
        resultTextEl.textContent = `${p} < ${c} 패배!`;
    } else {
        resultTextEl.textContent = `${p} = ${c} 무승부!`;
    }

    // 전적 업데이트
    winsEl.textContent = game.score.wins;
    lossesEl.textContent = game.score.losses;
    drawsEl.textContent = game.score.draws;
}

// 버튼 이벤트 바인딩
document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const result = game.play(btn.dataset.choice);
        updateDisplay(result);
    });
});

document.querySelector('.reset-btn').addEventListener('click', () => {
    game.reset();
    playerChoiceEl.textContent = '-';
    computerChoiceEl.textContent = '-';
    resultTextEl.textContent = '선택하세요';
    resultTextEl.className = 'result-text';
    winsEl.textContent = '0';
    lossesEl.textContent = '0';
    drawsEl.textContent = '0';
});
