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
import { resetAllEffects } from './effects.js';
import { playBGM, playSE, stopBGM } from './audioManager.js';

let timerId = null;

/**
 * ゲームタイマーを開始する
 */
function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        gameState.timeLeft--;
        updateUI();
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
        if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    resetAllEffects();
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
    playBGM();

}

/**
 * ゲームを終了する
 */
export function gameOver() {
    // 1. 進行中のプロセスを停止
    stopTimer();
    playSE('gameover');

    stopBGM();
    
    // 2. 【最重要】画面遷移の前に、必ずエフェクトをリセットする
    resetAllEffects();

    // 3. スコアと状態を判定
    const modeConfig = CONFIG.MODES[gameState.currentMode];
    const isNewHighScore = gameState.score > gameState.highScore;
    const isGameClear = gameState.score >= modeConfig.CLEAR_SCORE_THRESHOLD;

    if (isNewHighScore) {
        gameState.highScore = gameState.score;
        saveHighScore(gameState.highScore);
    }
    
    // 4. UIの更新処理を呼び出し、アニメーションを開始
    updateGameOverScreen(isGameClear, isNewHighScore);
    
    // 5. 画面を表示
    showScreen('gameOver');
}

/**
 * ゲームオーバー画面のUI要素を更新し、演出を再生する
 * @param {boolean} isGameClear - ゲームクリアしたか
 * @param {boolean} isNewHighScore - ハイスコアを更新したか
 */
function updateGameOverScreen(isGameClear, isNewHighScore) {
    // テキストと画像の表示を更新
    dom.highScoreEnd.textContent = gameState.highScore;
    dom.newHighScoreMessage.classList.toggle('hidden', !isNewHighScore);

    if (isGameClear) {
        dom.gameOverTitle.textContent = 'Game Clear!';
        // 【安全性】画像読み込み失敗時のフォールバック処理を追加
        dom.clearBonusImage.onerror = () => {
            dom.clearBonusImage.classList.add('hidden'); // 失敗したら非表示に
        };
        dom.clearBonusImage.src = `${CONFIG.IMAGE_PATH}${CONFIG.CLEAR_IMAGE_NAME}`;
        dom.clearBonusImage.classList.remove('hidden');
    } else {
        dom.gameOverTitle.textContent = 'Game Over';
        dom.clearBonusImage.classList.add('hidden');
    }
    
    // 【UX向上】スコアをアニメーションさせて表示
    animateScoreCounter(dom.finalScore, gameState.score, 1000);
}


/**
 * スコアを指定時間かけてカウントアップさせるアニメーション
 * @param {HTMLElement} element - 数字を表示するDOM要素
 * @param {number} finalScore - 最終的なスコア
 * @param {number} duration - アニメーション時間 (ms)
 */
async function animateScoreCounter(element, finalScore, duration) {
    let currentScore = 0;
    const startTime = performance.now();

    function updateFrame(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1); // 0から1の進捗率
        
        currentScore = Math.floor(finalScore * progress);
        element.textContent = currentScore;

        if (progress < 1) {
            requestAnimationFrame(updateFrame);
        } else {
            element.textContent = finalScore; // 最終値を正確に設定
        }
    }
    requestAnimationFrame(updateFrame);
}