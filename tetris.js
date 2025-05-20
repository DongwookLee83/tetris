const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// 블록 크기 설정
const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;

// 테트리스 블록 모양 정의
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// 색상 정의
const COLORS = [
    '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE138',
    '#3877FF'
];

let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;

// 게임 보드 초기화
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// 현재 블록 생성
let currentPiece = {
    shape: null,
    color: null,
    x: 0,
    y: 0
};

// 게임 초기화
function initGame() {
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverModal.classList.remove('show');
    createPiece();
}

// 새 블록 생성
function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPiece = {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
        y: 0
    };
}

// 충돌 검사
function collision() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                if (
                    boardX < 0 ||
                    boardX >= COLS ||
                    boardY >= ROWS ||
                    (boardY >= 0 && board[boardY][boardX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 블록 회전
function rotate() {
    const rotated = [];
    for (let y = 0; y < currentPiece.shape[0].length; y++) {
        rotated[y] = [];
        for (let x = 0; x < currentPiece.shape.length; x++) {
            rotated[y][x] = currentPiece.shape[currentPiece.shape.length - 1 - x][y];
        }
    }
    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = previousShape;
    }
}

// 블록 이동
function move(dir) {
    currentPiece.x += dir;
    if (collision()) {
        currentPiece.x -= dir;
    }
}

// 블록 하강
function drop() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        merge();
        clearLines();
        createPiece();
        if (collision()) {
            gameOver = true;
            showGameOver();
        }
    }
    dropCounter = 0;
}

// 하드 드롭
function hardDrop() {
    while (!collision()) {
        currentPiece.y++;
    }
    currentPiece.y--;
    merge();
    clearLines();
    createPiece();
    if (collision()) {
        gameOver = true;
        showGameOver();
    }
    dropCounter = 0;
}

// 블록 고정
function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

// 줄 제거
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) continue outer;
        }
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

// 게임 오버 표시
function showGameOver() {
    finalScoreElement.textContent = score;
    gameOverModal.classList.add('show');
}

// 게임 보드 그리기
function draw() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 고정된 블록 그리기
    board.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });

    // 현재 블록 그리기
    if (currentPiece.shape) {
        ctx.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillRect(
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
}

// 게임 루프
function update(time = 0) {
    if (gameOver) {
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
    }
    draw();
    requestAnimationFrame(update);
}

// 터치 컨트롤 설정
document.getElementById('leftBtn').addEventListener('click', () => move(-1));
document.getElementById('rightBtn').addEventListener('click', () => move(1));
document.getElementById('rotateBtn').addEventListener('click', rotate);
document.getElementById('downBtn').addEventListener('click', drop);
document.getElementById('hardDropBtn').addEventListener('click', hardDrop);
restartBtn.addEventListener('click', () => {
    initGame();
    update();
});

// 게임 시작
initGame();
update(); 