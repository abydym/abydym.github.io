document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素获取 ---
    const gameBoard = document.getElementById('game-board');
    const nextPieceElement = document.getElementById('next-piece');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const startButton = document.getElementById('start-button');
    const pauseScreen = document.getElementById('pause-screen');
    const resumeButton = document.getElementById('resume-button');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreElement = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    
    // 虚拟按键元素
    const toggleControlsButton = document.getElementById('toggle-controls-button');
    const virtualControls = document.getElementById('virtual-controls');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const downBtn = document.getElementById('down-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    let isVirtualControlsVisible = false;

    // --- 音效获取 ---
    const moveSound = document.getElementById('move-sound');
    const rotateSound = document.getElementById('rotate-sound');
    const lineClearSound = document.getElementById('line-clear-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.volume = 0.1; // 背景音乐音量调小一些

    // --- 游戏常量 ---
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const NEXT_PIECE_GRID_SIZE = 4;

    // --- 俄罗斯方块定义 (形状和颜色/类名) ---
    const TETROMINOES = {
        'I': { shape: [[1, 1, 1, 1]], className: 'I' },
        'J': { shape: [[0, 1, 0], [0, 1, 0], [1, 1, 0]], className: 'J' },
        'L': { shape: [[0, 1, 0], [0, 1, 0], [0, 1, 1]], className: 'L' },
        'O': { shape: [[1, 1], [1, 1]], className: 'O' },
        'S': { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], className: 'S' },
        'T': { shape: [[1, 1, 1], [0, 1, 0], [0, 0, 0]], className: 'T' },
        'Z': { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], className: 'Z' }
    };
    const TETROMINO_NAMES = 'IJLOSTZ';

    // --- 游戏状态变量 ---
    let board = createEmptyBoard();
    let currentPiece;
    let nextPiece;
    let score = 0;
    let lines = 0;
    let level = 1;
    let isGameOver = false;
    let isPaused = false;
    let dropInterval;
    let dropSpeed = 1000;

    // --- 函数 ---

    // 创建一个空的游戏区域矩阵
    function createEmptyBoard() {
        return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    }
    
    // 创建一个空的预览区域网格
    function createNextPieceGrid() {
        nextPieceElement.innerHTML = ''; // 清空
        for(let i=0; i < NEXT_PIECE_GRID_SIZE * NEXT_PIECE_GRID_SIZE; i++) {
            const cell = document.createElement('div');
            nextPieceElement.appendChild(cell);
        }
    }

    // 生成一个新的随机方块
    function generateNewPiece() {
        const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
        const tetromino = TETROMINOES[name];
        return {
            ...tetromino,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0
        };
    }

    // 绘制游戏主区域
    function draw() {
        gameBoard.innerHTML = '';
        // 绘制已经固定的方块
        board.forEach(row => {
            row.forEach(cellClassName => {
                const cell = document.createElement('div');
                if (cellClassName) {
                    cell.className = cellClassName;
                }
                gameBoard.appendChild(cell);
            });
        });

        // 绘制当前正在下落的方块
        if (currentPiece) {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const boardX = currentPiece.x + x;
                        const boardY = currentPiece.y + y;
                        const cellIndex = boardY * BOARD_WIDTH + boardX;
                        if(gameBoard.children[cellIndex]) {
                            gameBoard.children[cellIndex].className = currentPiece.className;
                        }
                    }
                });
            });
        }
    }
    
    // 绘制预览区域
    function drawNextPiece() {
        const gridCells = Array.from(nextPieceElement.children);
        gridCells.forEach(cell => cell.className = ''); // 清空

        const shape = nextPiece.shape;
        const className = nextPiece.className;
        const offset_x = Math.floor((NEXT_PIECE_GRID_SIZE - shape[0].length) / 2);
        const offset_y = Math.floor((NEXT_PIECE_GRID_SIZE - shape.length) / 2);
        
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const index = (y + offset_y) * NEXT_PIECE_GRID_SIZE + (x + offset_x);
                    if (gridCells[index]) {
                         gridCells[index].className = className;
                    }
                }
            });
        });
    }

    // 碰撞检测
    function checkCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;
                    // 检查是否越界
                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                        return true;
                    }
                    // 检查是否碰到已固定的方块
                    if (newY >= 0 && board[newY] && board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 将方块固定在游戏区域
    function lockPiece() {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[currentPiece.y + y][currentPiece.x + x] = currentPiece.className;
                }
            });
        });
    }

    // 检查并消除满行
    function clearLines() {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== null)) {
                // 消除这一行
                board.splice(y, 1);
                // 在顶部增加新的一行
                board.unshift(Array(BOARD_WIDTH).fill(null));
                linesCleared++;
                y++; // 重新检查当前行
            }
        }
        if (linesCleared > 0) {
            lineClearSound.play();
            updateScore(linesCleared);
        }
    }

    // 更新分数、行数和等级
    function updateScore(linesCleared) {
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesCleared] * level;
        lines += linesCleared;
        
        // 每消除10行升一级
        if (lines >= level * 10) {
            level++;
            // 加快下落速度
            dropSpeed = Math.max(100, 1000 - (level - 1) * 50);
            if (dropInterval) {
                clearInterval(dropInterval);
                dropInterval = setInterval(gameLoop, dropSpeed);
            }
        }
        
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
    }
    
    // 重置游戏
    function resetGame() {
        score = 0;
        lines = 0;
        level = 1;
        dropSpeed = 1000;
        board = createEmptyBoard();
        isGameOver = false;
        isPaused = false;
        
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;

        gameOverScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
    }

    // 开始新一轮方块
    function nextTurn() {
        currentPiece = nextPiece;
        nextPiece = generateNewPiece();
        if (checkCollision(currentPiece)) {
            // 新生成的方块直接碰撞，游戏结束
            endGame();
        }
        draw();
        drawNextPiece();
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || isGameOver) return;
        
        const nextPos = { ...currentPiece, y: currentPiece.y + 1 };
        if (checkCollision(nextPos)) {
            lockPiece();
            clearLines();
            nextTurn();
        } else {
            currentPiece.y++;
        }
        draw();
    }

    // --- 玩家操作 ---
    function move(dir) {
        if (isPaused || isGameOver) return;
        const nextPos = { ...currentPiece, x: currentPiece.x + dir };
        if (!checkCollision(nextPos)) {
            currentPiece.x = nextPos.x;
            moveSound.play();
        }
        draw();
    }

    function rotate() {
        if (isPaused || isGameOver) return;
        
        const shape = currentPiece.shape;
        const N = shape.length;
        const newShape = Array.from({ length: N }, () => Array(N).fill(0));

        // 矩阵转置
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                newShape[x][y] = shape[y][x];
            }
        }
        // 翻转每一行 (顺时针旋转)
        newShape.forEach(row => row.reverse());
        
        const originalX = currentPiece.x;
        const nextPos = { ...currentPiece, shape: newShape };
        
        if (!checkCollision(nextPos)) {
            currentPiece.shape = newShape;
            rotateSound.play();
        } else {
            // 尝试"踢墙"
            let kick = 1;
            nextPos.x = originalX + kick;
            if (!checkCollision(nextPos)) {
                currentPiece.shape = newShape;
                currentPiece.x = nextPos.x;
                rotateSound.play();
                return;
            }
            kick = -1;
            nextPos.x = originalX + kick;
            if (!checkCollision(nextPos)) {
                currentPiece.shape = newShape;
                currentPiece.x = nextPos.x;
                rotateSound.play();
                return;
            }
             kick = 2;
            nextPos.x = originalX + kick;
            if (!checkCollision(nextPos)) {
                currentPiece.shape = newShape;
                currentPiece.x = nextPos.x;
                rotateSound.play();
                return;
            }
             kick = -2;
            nextPos.x = originalX + kick;
            if (!checkCollision(nextPos)) {
                currentPiece.shape = newShape;
                currentPiece.x = nextPos.x;
                rotateSound.play();
                return;
            }
        }
        draw();
    }
    
    function drop() {
        if (isPaused || isGameOver) return;
        const nextPos = { ...currentPiece, y: currentPiece.y + 1 };
        if (checkCollision(nextPos)) {
            lockPiece();
            clearLines();
            nextTurn();
        } else {
            currentPiece.y++;
        }
        draw();
    }

    // --- 游戏流程控制 ---
    function startGame() {
        resetGame();
        nextPiece = generateNewPiece();
        nextTurn();
        
        if (dropInterval) clearInterval(dropInterval);
        dropInterval = setInterval(gameLoop, dropSpeed);
        
        startButton.textContent = "重新开始";
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
    }

    function togglePause() {
        if(isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseScreen.style.display = 'flex';
            clearInterval(dropInterval);
            backgroundMusic.pause();
        } else {
            pauseScreen.style.display = 'none';
            dropInterval = setInterval(gameLoop, dropSpeed);
            backgroundMusic.play();
        }
    }

    function resumeGame() {
        togglePause();
    }

    function endGame() {
        isGameOver = true;
        clearInterval(dropInterval);
        gameOverSound.play();
        backgroundMusic.pause();
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
    }

    // --- 事件监听 ---
    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;

        if (e.key === 'ArrowLeft') move(-1);
        if (e.key === 'ArrowRight') move(1);
        if (e.key === 'ArrowDown') drop();
        if (e.key === 'ArrowUp' || e.key === ' ') {
            e.preventDefault(); // 防止空格键滚动页面
            rotate();
        }
        if (e.key === 'p' || e.key === 'P') togglePause();
    });

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    resumeButton.addEventListener('click', resumeGame);

    // 虚拟按键事件监听
    toggleControlsButton.addEventListener('click', () => {
        isVirtualControlsVisible = !isVirtualControlsVisible;
        if (isVirtualControlsVisible) {
            virtualControls.style.display = 'block';
            toggleControlsButton.textContent = '隐藏虚拟按键';
        } else {
            virtualControls.style.display = 'none';
            toggleControlsButton.textContent = '显示虚拟按键';
        }
    });

    // 虚拟按键控制事件
    leftBtn.addEventListener('click', () => move(-1));
    rightBtn.addEventListener('click', () => move(1));
    downBtn.addEventListener('click', drop);
    rotateBtn.addEventListener('click', rotate);
    pauseBtn.addEventListener('click', togglePause);

    // 添加触摸事件支持，防止在移动设备上双击
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); move(-1); });
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); move(1); });
    downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); drop(); });
    rotateBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rotate(); });
    pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });

    // --- 初始设置 ---
    createNextPieceGrid();
    draw(); // 初始绘制一个空的面板
});