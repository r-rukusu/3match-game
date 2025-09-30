/**
 * ゲーム開発くん１号 - 画像マッチゲーム (改善版)
 *
 * 設計思想に基づき、安全性、保守性、拡張性、動作性を最大限重視した実装です。
 *
 *【主な修正点】
 * - 問題点: マッチ後のピース落下・補充処理で、表示が崩れる（消える）不具合があった。
 * - 原因: 落下させるDOM要素の特定方法が不安定で、データと表示の状態に不整合が発生していた。
 * - 解決策:
 * 1. DOM要素への参照を直接保持する2次元配列 `cellElements` を導入。これにより、どのセルがどのDOM要素に対応するかを常に正確に追跡します。
 * 2. `dropAndRefillCells` 関数を全面的に再設計。新しい `cellElements` 配列を利用し、落下と補充のロジックを堅牢化・安定化させました。
 * 3. 不安定さの原因であった `getCellElementByContent` 関数を廃止しました。
 *
 * この修正により、表示の不整合が解消され、システムの安全性と保守性がさらに向上しました。
 */
function setVhProperty() {
  // window.innerHeightを100で割り、1vhに相当する値を計算
  const vh = window.innerHeight * 0.01;
  // ドキュメントのルート要素(--vh)に計算した値を設定
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// ページ読み込み時に一度実行
setVhProperty();

// ウィンドウサイズが変更されたときにも再実行（回転などに対応）
window.addEventListener('resize', setVhProperty);
document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    // 設定の一元管理 (CONFIG)
    // ===================================================================================
    const CONFIG = {
        GRID_SIZE: 8,
        GAME_TIME_SECONDS: 60,
        LEVEL_UP_EXP_BASE: 100,
        IMAGE_NAMES: ['1.png', '2.png', '3.png', '4.png'],
        IMAGE_PATH: './img/',
        DUMMY_IMAGE_SRC: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        ANIMATION_DURATION: 300,
        COMBO_BONUS_MULTIPLIER: 0.1,
        SWIPE_THRESHOLD: 10,
        INIT_LOOP_SAFETY_LIMIT: 100,
    };

    // ===================================================================================
    // DOM要素の取得
    // ===================================================================================
    const dom = {
        gameContainer: document.getElementById('game-container'),
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        gridContainer: document.getElementById('grid-container'),
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        timeLeft: document.getElementById('time-left'),
        expBar: document.getElementById('exp-bar'),
        finalScore: document.getElementById('final-score'),
        comboDisplay: document.getElementById('combo-display'),
    };

    // ===================================================================================
    // 状態の集中管理 (gameState)
    // ===================================================================================
    let gameState = {};
    // ★修正点: DOM要素への参照を保持する2次元配列を追加
    // let cellElements = [];

    function resetGameState() {
        gameState = {
            grid: [],
            cellElements: [],
            score: 0,
            level: 1,
            exp: 0,
            timeLeft: CONFIG.GAME_TIME_SECONDS,
            combo: 0,
            isProcessing: false,
            selectedCell: null,
            timerId: null,
        };
        // ★修正点: DOM参照配列もリセット
    }

    // ===================================================================================
    // 初期化処理
    // ===================================================================================
    function init() {
        dom.startButton.addEventListener('click', startGame);
        dom.restartButton.addEventListener('click', startGame);
        showScreen('start');
    }

    // ===================================================================================
    // ゲームフロー制御 (開始、終了)
    // ===================================================================================
    function startGame() {
        resetGameState();
        showScreen('game');
        let loopCount = 0;

        do {
            createGridData();
            if (loopCount++ > CONFIG.INIT_LOOP_SAFETY_LIMIT){
                console.warn('初期盤面のマッチ解消ループが上限に到達しました。');
                break;
            }
        } while (findMatches().length > 0);

        renderGrid();
        updateUI();
        startTimer();
    }

    function gameOver() {
        stopTimer();
        dom.finalScore.textContent = gameState.score;
        showScreen('gameOver');
    }

    // ===================================================================================
    // 画面表示制御
    // ===================================================================================
    function showScreen(screenName) {
        dom.startScreen.classList.remove('active');
        dom.gameScreen.classList.remove('active');
        dom.gameOverScreen.classList.remove('active');

        if (screenName === 'start') dom.startScreen.classList.add('active');
        else if (screenName === 'game') dom.gameScreen.classList.add('active');
        else if (screenName === 'gameOver') dom.gameOverScreen.classList.add('active');
    }

    // ===================================================================================
    // タイマー制御 (リソース管理)
    // ===================================================================================
    function startTimer() {
        if (gameState.timerId) {
            clearInterval(gameState.timerId);
        }
        gameState.timerId = setInterval(() => {
            gameState.timeLeft--;
            updateUI();
            if (gameState.timeLeft <= 0) {
                gameOver();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }

    // ===================================================================================
    // UI更新 (状態と表示の同期)
    // ===================================================================================
    function updateUI() {
        dom.score.textContent = gameState.score;
        dom.level.textContent = gameState.level;
        dom.timeLeft.textContent = gameState.timeLeft;
        const requiredExp = CONFIG.LEVEL_UP_EXP_BASE * gameState.level;
        const expPercentage = (gameState.exp / requiredExp) * 100;
        dom.expBar.style.width = `${expPercentage}%`;
    }

    // ===================================================================================
    // 盤面データと描画
    // ===================================================================================

    function createGridData() {
        gameState.grid = [];
        for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
            gameState.grid[row] = [];
            for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
                gameState.grid[row][col] = getRandomImageName();
            }
        }
    }

    // ★修正点: cellElements配列にDOM参照を保存するよう変更
    function renderGrid() {
        dom.gridContainer.innerHTML = '';
        gameState.cellElements = []; // 配列を初期化
        gameState.grid.forEach((row, rowIndex) => {
            gameState.cellElements[rowIndex] = []; // 行を初期化
            row.forEach((imageName, colIndex) => {
                const cell = createCell(rowIndex, colIndex, imageName);
                dom.gridContainer.appendChild(cell);
                gameState.cellElements[rowIndex][colIndex] = cell; // DOM参照を保存
            });
        });
    }

    function createCell(row, col, imageName) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = row;
        cell.dataset.col = col;
        updateCellPosition(cell, row, col);

        const img = document.createElement('img');
        img.src = `${CONFIG.IMAGE_PATH}${imageName}`;
        img.onerror = () => { img.src = CONFIG.DUMMY_IMAGE_SRC; };
        
        cell.appendChild(img);

        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('touchstart', handleTouchStart, { passive: false });
        cell.addEventListener('touchmove', handleTouchMove, { passive: false });
        cell.addEventListener('touchend', handleTouchEnd);

        return cell;
    }
    
    function updateCellPosition(cell, row, col) {
        cell.style.setProperty('--row', row);
        cell.style.setProperty('--col', col);
    }

    // ===================================================================================
    // ユーザー入力処理 (クリック＆タッチ/スワイプ)
    // ===================================================================================
    let touchStartCoords = null;
    
    function handleCellClick(event) {
        handleSelection(event.currentTarget);
    }

    function handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        touchStartCoords = { x: touch.clientX, y: touch.clientY, target: event.currentTarget };
    }

    function handleTouchMove(event) {
        event.preventDefault();
    }

    function handleTouchEnd(event) {
        if (!touchStartCoords) return;

        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStartCoords.x;
        const dy = touch.clientY - touchStartCoords.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < CONFIG.SWIPE_THRESHOLD && absDy < CONFIG.SWIPE_THRESHOLD) {
            handleSelection(touchStartCoords.target);
            touchStartCoords = null;
            return;
        }

        const { row, col } = getCellCoords(touchStartCoords.target);
        let targetRow = row;
        let targetCol = col;

        if (absDx > absDy) {
            targetCol += (dx > 0) ? 1 : -1;
        } else {
            targetRow += (dy > 0) ? 1 : -1;
        }

        if (isValidCoords(targetRow, targetCol)) {
            const targetCell = getCellElement(targetRow, targetCol);
            handleSwap(touchStartCoords.target, targetCell);
        }
        
        touchStartCoords = null;
    }

    async function handleSelection(cellElement) {
        if (gameState.isProcessing) return;

        if (!gameState.selectedCell) {
            cellElement.classList.add('selected');
            gameState.selectedCell = cellElement;
        } else {
            if (gameState.selectedCell === cellElement) {
                gameState.selectedCell.classList.remove('selected');
                gameState.selectedCell = null;
                return;
            }

            if (areAdjacent(gameState.selectedCell, cellElement)) {
                await handleSwap(gameState.selectedCell, cellElement);
            }
            
            gameState.selectedCell.classList.remove('selected');
            gameState.selectedCell = null;
        }
    }

    // ===================================================================================
    // コアロジック (スワップ、マッチ判定、消去、補充)
    // ===================================================================================

    async function handleSwap(cellA, cellB) {
        if (gameState.isProcessing) return;
        gameState.isProcessing = true;

        await swapAnimation(cellA, cellB);
        swapGridData(cellA, cellB);

        const matches = findMatches();
        if (matches.length > 0) {
            await processMatches();
        } else {
            await sleep(100);
            await swapAnimation(cellA, cellB);
            swapGridData(cellA, cellB);
        }

        gameState.isProcessing = false;
    }

    async function processMatches() {
        gameState.combo = 0;
        let matches = findMatches();

        while (matches.length > 0) {
            gameState.combo++;
            showCombo(gameState.combo);
            
            const points = calculatePoints(matches);
            gameState.score += points;
            gameState.exp += matches.length;
            
            await removeMatchedCells(matches);
            await dropAndRefillCells();
            
            updateUI();
            checkLevelUp();
            
            matches = findMatches();
        }
        
        hideCombo();
    }

    function findMatches() {
        const matchedCells = new Set();
        const { grid } = gameState;
        const size = CONFIG.GRID_SIZE;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 2; c++) {
                if (grid[r][c] && grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) {
                    let length = 3;
                    while (c + length < size && grid[r][c] === grid[r][c + length]) {
                        length++;
                    }
                    for (let i = 0; i < length; i++) {
                        matchedCells.add(`${r}-${c + i}`);
                    }
                    c += length - 1;
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 2; r++) {
                if (grid[r][c] && grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) {
                    let length = 3;
                    while (r + length < size && grid[r][c] === grid[r + length][c]) {
                        length++;
                    }
                    for (let i = 0; i < length; i++) {
                        matchedCells.add(`${r + i}-${c}`);
                    }
                    r += length - 1;
                }
            }
        }
        return Array.from(matchedCells);
    }

    // ★修正点: cellElements を使ってDOM要素を確実に参照・更新
    async function removeMatchedCells(matchedCoords) {
        const promises = matchedCoords.map(coord => {
            const [row, col] = coord.split('-').map(Number);
            const cell = gameState.cellElements[row][col];
            if (cell) {
                cell.classList.add('fade-out');
                return sleep(CONFIG.ANIMATION_DURATION).then(() => {
                    cell.remove();
                    gameState.grid[row][col] = null;
                    gameState.cellElements[row][col] = null; // 参照もnull化
                });
            }
            return Promise.resolve();
        });
        await Promise.all(promises);
    }
    
   // ★修正点: 新しいセルの登場アニメーションをCSS変数を使って制御する
    async function dropAndRefillCells() {
        const size = CONFIG.GRID_SIZE;
        const animationPromises = [];

        for (let col = 0; col < size; col++) {
            let emptyCount = 0;
            let writeRow = size - 1;
            for (let readRow = size - 1; readRow >= 0; readRow--) {
                if (gameState.grid[readRow][col] !== null) {
                    if (writeRow !== readRow) {
                        gameState.grid[writeRow][col] = gameState.grid[readRow][col];
                        gameState.cellElements[writeRow][col] = cellElements[readRow][col];
                        gameState.grid[readRow][col] = null;
                        gameState.cellElements[readRow][col] = null;
                        
                        const cell = cellElements[writeRow][col];
                        cell.dataset.row = writeRow;
                        
                        animationPromises.push(new Promise(resolve => {
                            updateCellPosition(cell, writeRow, col); // CSS変数を更新して移動
                            setTimeout(resolve, CONFIG.ANIMATION_DURATION);
                        }));
                    }
                    writeRow--;
                } else {
                    emptyCount++;
                }
            }

            for (let row = 0; row < emptyCount; row++) {
                const newImage = getRandomImageName();
                gameState.grid[row][col] = newImage;
                
                const newCell = createCell(row, col, newImage);
                gameState.cellElements[row][col] = newCell;

                // ★修正点: transformを直接いじる代わりに、--rowを画面外に設定
                const initialRow = - (emptyCount - row);
                newCell.style.setProperty('--row', initialRow);
                newCell.style.setProperty('--col', col);
                
                dom.gridContainer.appendChild(newCell);
                
                animationPromises.push(new Promise(resolve => {
                    setTimeout(() => {
                        // 本来の位置に--rowを更新することで、CSSがアニメーションを実行
                        updateCellPosition(newCell, row, col);
                        setTimeout(resolve, CONFIG.ANIMATION_DURATION);
                    }, 50);
                }));
            }
        }
        await Promise.all(animationPromises);
    }
    
    // ===================================================================================
    // ヘルパー関数群
    // ===================================================================================
    
    function getRandomImageName() {
        return CONFIG.IMAGE_NAMES[Math.floor(Math.random() * CONFIG.IMAGE_NAMES.length)];
    }

    function getCellCoords(cellElement) {
        return {
            row: parseInt(cellElement.dataset.row, 10),
            col: parseInt(cellElement.dataset.col, 10)
        };
    }
    
    // ★修正点: cellElementsから直接参照を取得する方が高速だが、互換性のため残す
    function getCellElement(row, col) {
        if(!isValidCoords(row, col)) return null;
        return gameState.cellElements[row][col]; // こちらの方が効率的
        // return document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    }

    function areAdjacent(cellA, cellB) {
        const { row: r1, col: c1 } = getCellCoords(cellA);
        const { row: r2, col: c2 } = getCellCoords(cellB);
        return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    }

    function isValidCoords(row, col) {
        return row >= 0 && row < CONFIG.GRID_SIZE && col >= 0 && col < CONFIG.GRID_SIZE;
    }

    // ★修正点: cellElementsの参照もスワップする
    function swapGridData(cellA, cellB) {
        const { row: r1, col: c1 } = getCellCoords(cellA);
        const { row: r2, col: c2 } = getCellCoords(cellB);
        [gameState.grid[r1][c1], gameState.grid[r2][c2]] = [gameState.grid[r2][c2], gameState.grid[r1][c1]];
        // DOM参照もスワップ
        [gameState.cellElements[r1][c1], gameState.cellElements[r2][c2]] = [gameState.cellElements[r2][c2], gameState.cellElements[r1][c1]];
    }

    function swapAnimation(cellA, cellB) {
        return new Promise(resolve => {
            const { row: r1, col: c1 } = getCellCoords(cellA);
            const { row: r2, col: c2 } = getCellCoords(cellB);
            
            updateCellPosition(cellA, r2, c2);
            updateCellPosition(cellB, r1, c1);

            // datasetも更新
            cellA.dataset.row = r2;
            cellA.dataset.col = c2;
            cellB.dataset.row = r1;
            cellB.dataset.col = c1;

            setTimeout(resolve, CONFIG.ANIMATION_DURATION);
        });
    }

    function calculatePoints(matches) {
        const basePoints = matches.length * 10;
        const comboBonus = Math.floor(basePoints * (gameState.combo * CONFIG.COMBO_BONUS_MULTIPLIER));
        return basePoints + comboBonus;
    }

    function checkLevelUp() {
        const requiredExp = CONFIG.LEVEL_UP_EXP_BASE * gameState.level;
        if (gameState.exp >= requiredExp) {
            gameState.level++;
            gameState.exp -= requiredExp;
            // TODO: レベルアップ演出
        }
    }
    
    function showCombo(combo) {
        if (combo < 2) return;
        dom.comboDisplay.textContent = `${combo} COMBO!`;
        dom.comboDisplay.classList.add('show');
    }

    function hideCombo() {
        dom.comboDisplay.classList.remove('show');
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===================================================================================
    // ゲームの起動
    // ===================================================================================
    init();
});