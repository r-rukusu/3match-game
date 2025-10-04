/**
 * @file main.js
 * @description アプリケーションのエントリーポイント
 *
 * 【役割】
 * - 各モジュールの初期化処理を呼び出す。
 * - UIイベント（ボタンクリックなど）に対するリスナーを設定し、
 * 適切なモジュール（gameFlow, inputなど）の関数に処理を委譲する。
 * - アプリケーション全体の起動シーケンスを管理する。
 *
 * 【主な変更点】
 * - audioManagerモジュールをインポート。
 * - 音声ファイルのプリロード処理とミュート機能の初期化を追加。
 * - ユーザーの最初のクリックイベントでオーディオコンテキストを初期化する処理を追加。
 */

import { dom } from './dom.js';
import { loadHighScore } from './storage.js';
import { showScreen } from './ui.js';
import { startGame } from './gameFlow.js';
import { initializeInput } from './input.js';
import { gameState } from './gameState.js'; // restartButtonの処理でgameStateを参照するため追加
import { initializeMuteState, preloadAudios, toggleMute } from './audioManager.js';

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    // ハイスコアを読み込んで表示
    loadHighScore();

    // 音声ファイルのプリロード
    preloadAudios().catch(error => {
        console.warn("Audio preloading failed. The game will continue without some sounds.", error);
    });

    // ミュートボタンの初期化
    initializeMuteState(dom.muteButton);

    // イベントリスナーの設定
    setupEventListeners();

    // スタート画面を表示
    showScreen('start');

    console.log("Game initialized.");
}

/**
 * すべてのイベントリスナーを設定する
 */
function setupEventListeners() {
    initializeInput();
    // モード選択ボタン
    dom.modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            startGame(mode);
        });
    });

    // リスタートボタン
    dom.restartButton.addEventListener('click', () => {
        showScreen('start');
    });

    // ミュートボタン
    dom.muteButton.addEventListener('click', () => {
        toggleMute(dom.muteButton);
    });

    // 【重要】最初のユーザーインタラクションでオーディオコンテキストを初期化
    // これにより、ブラウザの自動再生ポリシーをクリアする
    const initializeAudio = () => {
        // audioManager内の関数でコンテキスト初期化は行われるため、ここでは何もしない
        // このイベントリスナーは一度だけ実行されれば良い
        document.body.removeEventListener('click', initializeAudio, true);
        document.body.removeEventListener('touchstart', initializeAudio, true);
    };
    document.body.addEventListener('click', initializeAudio, true);
    document.body.addEventListener('touchstart', initializeAudio, true);
}


// DOMの読み込みが完了したらアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initializeApp);