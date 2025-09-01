document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 元素获取 ---
    const gameBoard = document.getElementById('game-board');
    const levelDisplay = document.getElementById('level-display');
    const movesDisplay = document.getElementById('moves-display');
    const pushesDisplay = document.getElementById('pushes-display');
    const restartButton = document.getElementById('restart-button');
    const prevLevelButton = document.getElementById('prev-level-button');
    const nextLevelButton = document.getElementById('next-level-button');
    const levelCompleteModal = document.getElementById('level-complete-modal');
    const completedLevelSpan = document.getElementById('completed-level');
    const nextLevelModalButton = document.getElementById('next-level-modal-button');

    // --- 关卡数据 ---
    // W = Wall (墙), ' ' = Floor (地板), P = Player (玩家)
    // B = Box (箱子), T = Target (目标), * = Box on Target, + = Player on Target
    const LEVELS = [
        [ // Level 1
            "  WWWWW ",
            "WWW   W ",
            "W T B W ",
            "WWW B W ",
            "W T W W ",
            "W   P WW",
            "WWWWWWW "
        ],
        [ // Level 2
            "WWWWWWWW",
            "W P T  W",
            "W B B  W",
            "W      W",
            "WWWWWWWW"
        ],
        [ // Level 3
            "    WWWWW ",
            "    W   W ",
            "    W B W ",
            "  WWW B WWW",
            "  W T T B W",
            "WWW W WWW W",
            "W   W P   W",
            "W B T  T  W",
            "WWWWWWWWWWW"
        ],
        [ // Level 4
            "WWWWWWWWWWWW",
            "W     W    W",
            "W P B W B  W",
            "W     W    W",
            "W T T W T TWW",
            "W     W    W",
            "WWWWWWWWWWWW",
        ]
    ];

    // --- 游戏状态变量 ---
    let currentLevelIndex = 0;
    let moves = 0;
    let pushes = 0;
    let gameState = []; // 存放当前关卡的二维数组
    let playerPos = { x: 0, y: 0 };
    let history = []; // 用于撤销操作 (本次暂不实现，但结构预留)

    // --- 游戏初始化 ---
    function initGame() {
        loadLevel(currentLevelIndex);
        setupEventListeners();
    }

    // --- 加载关卡 ---
    function loadLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
        
        currentLevelIndex = levelIndex;
        moves = 0;
        pushes = 0;
        
        // 深拷贝关卡数据到 gameState
        gameState = LEVELS[levelIndex].map(row => row.split(''));

        // 找到玩家初始位置
        for (let y = 0; y < gameState.length; y++) {
            const x = gameState[y].indexOf('P');
            if (x !== -1) {
                playerPos = { x, y };
                break;
            }
        }
        
        updateUI();
        renderBoard();
        levelCompleteModal.style.display = 'none';
    }

    // --- 渲染游戏面板 ---
    function renderBoard() {
        gameBoard.innerHTML = '';
        const levelHeight = gameState.length;
        const levelWidth = Math.max(...gameState.map(row => row.length));

        gameBoard.style.gridTemplateColumns = `repeat(${levelWidth}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${levelHeight}, 1fr)`;

        gameState.forEach(row => {
            row.forEach(cellType => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                switch (cellType) {
                    case 'W': cell.classList.add('wall'); break;
                    case ' ': cell.classList.add('floor'); break;
                    case 'P': cell.classList.add('player'); break;
                    case 'B': cell.classList.add('box'); break;
                    case 'T': cell.classList.add('target'); break;
                    case '*': cell.classList.add('box', 'box-on-target'); break; // Box on Target
                    case '+': cell.classList.add('player', 'target'); break; // Player on Target
                }
                gameBoard.appendChild(cell);
            });
        });
    }
    
    // --- 更新UI信息 ---
    function updateUI() {
        levelDisplay.textContent = currentLevelIndex + 1;
        movesDisplay.textContent = moves;
        pushesDisplay.textContent = pushes;
    }

    // --- 玩家移动逻辑 ---
    function handlePlayerMove(dx, dy) {
        const { x, y } = playerPos;
        const nextX = x + dx;
        const nextY = y + dy;
        const afterNextX = nextX + dx;
        const afterNextY = nextY + dy;

        // 边界检查
        if (nextX < 0 || nextY < 0 || nextY >= gameState.length || nextX >= gameState[nextY].length) {
            return;
        }

        const nextCell = gameState[nextY][nextX];

        if (nextCell === 'W') return; // 撞墙，不动

        // 如果下一个位置是箱子
        if (nextCell === 'B' || nextCell === '*') {
            // 箱子前方的格子
            const afterNextCell = gameState[afterNextY][afterNextX];
            if (afterNextCell === 'W' || afterNextCell === 'B' || afterNextCell === '*') {
                return; // 箱子前方是墙或另一个箱子，推不动
            }
            
            // 移动箱子
            moveBox(nextX, nextY, afterNextX, afterNextY);
            pushes++;
        }

        // 移动玩家
        movePlayer(x, y, nextX, nextY);
        moves++;
        
        updateUI();
        renderBoard();
        
        // 检查是否胜利
        if (checkWinCondition()) {
            setTimeout(showWinModal, 300); // 延迟显示，让玩家看到最后一步
        }
    }
    
    // 移动玩家的具体实现
    function movePlayer(fromX, fromY, toX, toY) {
        // 更新玩家新位置
        playerPos = { x: toX, y: toY };
        const newPlayerCell = (gameState[toY][toX] === 'T' || gameState[toY][toX] === '*') ? '+' : 'P';
        gameState[toY][toX] = newPlayerCell;
        
        // 清理玩家旧位置
        const oldPlayerCell = (gameState[fromY][fromX] === '+') ? 'T' : ' ';
        gameState[fromY][fromX] = oldPlayerCell;
    }
    
    // 移动箱子的具体实现
    function moveBox(fromX, fromY, toX, toY) {
        // 更新箱子新位置
        const newBoxCell = (gameState[toY][toX] === 'T') ? '*' : 'B';
        gameState[toY][toX] = newBoxCell;

        // 清理箱子旧位置 (现在是玩家要站上去的地方，所以不用改)
        // 旧位置由 movePlayer 函数处理
    }
    
    // --- 胜利条件检查 ---
    function checkWinCondition() {
        // 只要地图上还有一个 T (空的目标点)，就说明没赢
        return !gameState.some(row => row.includes('T'));
    }
    
    // --- 显示胜利弹窗 ---
    function showWinModal() {
        completedLevelSpan.textContent = currentLevelIndex + 1;
        levelCompleteModal.style.display = 'flex';
        // 如果是最后一关，隐藏“下一关”按钮
        if (currentLevelIndex >= LEVELS.length - 1) {
            nextLevelModalButton.textContent = "恭喜通关！";
            nextLevelModalButton.disabled = true;
        } else {
            nextLevelModalButton.textContent = "下一关";
            nextLevelModalButton.disabled = false;
        }
    }

    // --- 事件监听设置 ---
    function setupEventListeners() {
        // 键盘输入
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp': handlePlayerMove(0, -1); break;
                case 'ArrowDown': handlePlayerMove(0, 1); break;
                case 'ArrowLeft': handlePlayerMove(-1, 0); break;
                case 'ArrowRight': handlePlayerMove(1, 0); break;
            }
        });

        // 虚拟按键
        document.getElementById('btn-up').addEventListener('click', () => handlePlayerMove(0, -1));
        document.getElementById('btn-down').addEventListener('click', () => handlePlayerMove(0, 1));
        document.getElementById('btn-left').addEventListener('click', () => handlePlayerMove(-1, 0));
        document.getElementById('btn-right').addEventListener('click', () => handlePlayerMove(1, 0));

        // 功能按钮
        restartButton.addEventListener('click', () => loadLevel(currentLevelIndex));
        prevLevelButton.addEventListener('click', () => loadLevel(currentLevelIndex - 1));
        nextLevelButton.addEventListener('click', () => loadLevel(currentLevelIndex + 1));
        nextLevelModalButton.addEventListener('click', () => loadLevel(currentLevelIndex + 1));
    }

    // --- 启动游戏 ---
    initGame();
});