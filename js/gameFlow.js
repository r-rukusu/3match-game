/**
 * gameFlow.js
 * ゲームの開始、終了、タイマーといった一連の流れを管理するモジュール
 */
import { CONFIG } from './config.js';
import { dom } from './dom.js';
import { gameState, resetGameState } from './gameState.js';
import { saveHighScore } from './storage.js';
import { showScreen, updateUI, renderGrid } from './ui.js';
import { createGridData, findMatchGroups } from './gameLogic.js';

let timerId = null;

/**
 * ゲームタイマーを開始する
 */
function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        gameState.timeLeft--;
        updateUI(gameState);
        if (gameState.timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

/**
 * ゲームタイマーを停止する
 */
function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

/**
 * ゲームを開始する
 * @param {string} mode - 選択されたゲームモード
 */
export function startGame(mode) {
    resetGameState(mode);
    document.documentElement.style.setProperty('--grid-size', gameState.gridSize);
    dom.clearBonusImage.classList.add('hidden');
    showScreen('game');
    
    let loopCount = 0;
    do {
        createGridData();
        if (loopCount++ > CONFIG.INIT_LOOP_SAFETY_LIMIT) {
            console.warn('初期盤面のマッチ解消ループが上限に到達しました。');
            break;
        }
    } while (findMatchGroups().length > 0);
    
    renderGrid();
    updateUI(gameState);
    startTimer();
}

/**
 * ゲームを終了する
 */
export function gameOver() {
    stopTimer();
    const modeConfig = CONFIG.MODES[gameState.currentMode];
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore(gameState.highScore);
        dom.newHighScoreMessage.classList.remove('hidden');
    }

    if (gameState.score >= modeConfig.CLEAR_SCORE_THRESHOLD) {
        dom.gameOverTitle.textContent = 'Game Clear!';
        dom.clearBonusImage.src = `${CONFIG.IMAGE_PATH}${CONFIG.CLEAR_IMAGE_NAME}`;
        dom.clearBonusImage.classList.remove('hidden');
    } else {
        dom.gameOverTitle.textContent = 'Game Over';
        dom.clearBonusImage.classList.add('hidden');
    }
    dom.finalScore.textContent = gameState.score;
    dom.highScoreEnd.textContent = gameState.highScore;
    showScreen('gameOver');
}