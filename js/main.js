/**
 * main.js
 * アプリケーションのエントリーポイント。
 * 各モジュールをインポートし、ゲームの初期化とイベントリスナーの設定を行う。
 */

// 各モジュールから必要なパーツをインポート
import { dom } from './dom.js';
import { loadHighScore } from './storage.js';
import { showScreen } from './ui.js';
import { startGame } from './gameFlow.js';
import { initializeInput } from './input.js';
import { gameState } from './gameState.js'; // restartButtonの処理でgameStateを参照するため追加

/**
 * ゲームの初期化処理
 */
function init() {
    // ユーザー入力の受付を開始
    initializeInput();

    // --- イベントリスナーの設定 ---
    dom.modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // ゲーム開始機能を有効化
            startGame(event.currentTarget.dataset.mode);
        });
    });

    dom.restartButton.addEventListener('click', () => {
        dom.newHighScoreMessage.classList.add('hidden');
        // ハイスコア表示を最新の状態に更新
        dom.highScoreStart.textContent = gameState.highScore;
        // スタート画面表示を有効化
        showScreen('start');
    });
    
    // --- ゲームの開始 ---
    // ハイスコア読み込みとスタート画面表示を有効化
    loadHighScore();
    showScreen('start');
}


// --- メイン処理の実行 ---
// DOMの読み込みが完了したら初期化処理を実行
document.addEventListener('DOMContentLoaded', init);

