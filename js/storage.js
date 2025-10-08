// js/storage.js (修正案)

import { CONFIG } from './config.js'; 
import { gameState } from './gameState.js';
import { dom } from './dom.js';
import { loadHighScoreFromDB, saveHighScoreToDB } from './firebase.js'; 

// ★★★ 修正点1: LOCAL_KEY をプレフィックス形式で定義 (CONFIGの修正が必要) ★★★
// ※ CONFIG.STORAGE_KEYS.LOCAL_HIGH_SCORE_PREFIX が存在することを前提とします。

/**
 * ユーザーの自己ベストのキーをモードごとに生成
 * @param {string} mode - ゲームモード ('easy' or 'normal')
 * @returns {string} LocalStorageキー
 */
function getLocalKey(mode) {
    // ⚠️ CONFIG.STORAGE_KEYS.LOCAL_HIGH_SCORE_PREFIX が必要
    return CONFIG.STORAGE_KEYS.LOCAL_HIGH_SCORE_PREFIX + mode;
}


// ----------------------------------------------------
// Firebase (グローバルハイスコア) 関連関数
// ----------------------------------------------------

/**
 * ハイスコアを読み込み、gameStateとUIを更新します。
 * @param {string} mode - ゲームモード ★ [引数追加]
 * @returns {Promise<void>}
 */
export async function loadHighScore(mode) { // ★ [引数追加]
    const path = `highscores/global_${mode}`; // ★ [モードごとのパス生成]
    
    gameState.highScore = 0; 
    const score = await loadHighScoreFromDB(path); // ★ [pathを引数に追加]

    gameState.highScore = score;
    // UIの更新 (dom.js経由でDOM操作を行う)
    dom.highScoreStart.textContent = score.toLocaleString();
    dom.highScoreEnd.textContent = score.toLocaleString();
    
    console.log(`Storage: 現在のハイスコア (${mode}): ${gameState.highScore}`);
}

/**
 * 新しいスコアがハイスコアを上回っていれば保存します。
 * @param {number} score - 今回のゲームで達成したスコア。
 * @param {string} mode - ゲームモード ★ [引数追加]
 * @returns {Promise<boolean>} ハイスコアが更新された場合に true。
 */
export async function saveHighScore(score, mode) { // ★ [引数追加]
    const path = `highscores/global_${mode}`; // ★ [モードごとのパス生成]
    
    if (score <= gameState.highScore) {
        return false; 
    }
    
    const updatedScore = await saveHighScoreToDB(score, path); // ★ [pathを引数に追加]

    const isNewHighScore = updatedScore > gameState.highScore;
    gameState.highScore = updatedScore;

    if (isNewHighScore) {
        dom.highScoreStart.textContent = updatedScore.toLocaleString();
        dom.highScoreEnd.textContent = updatedScore.toLocaleString();
    }
    
    return isNewHighScore;
}

// ----------------------------------------------------
// LocalStorage (ユーザー自己ベスト) 関連関数
// ----------------------------------------------------

/**
 * ユーザーの自己ベスト（ローカル）をローカルストレージから読み込み、gameStateに保存する。
 * @param {string} mode - ゲームモード ★ [引数追加]
 * @returns {number} ユーザーのハイスコア、または0
 */
export function loadUserHighScore(mode) { // ★ [引数追加]
    const key = getLocalKey(mode); // ★ [モード対応キーの取得]
    const storedScore = localStorage.getItem(key);
    const score = parseInt(storedScore, 10);
    
    gameState.userHighScore = (isNaN(score) || score < 0) ? 0 : score;
    console.log(`Storage: ユーザーハイスコア (Local ${mode}) 読み込み完了: ${gameState.userHighScore}`);
        // 1. DOM要素名を作成 (例: 'localHighScoreStartEasy')
    const elementKey = `localHighScoreStart${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    
    // 2. 該当するDOM要素が存在するかチェックし、更新
    if (dom[elementKey]) {
        dom[elementKey].textContent = gameState.userHighScore.toLocaleString();
    }
    return gameState.userHighScore;
}

/**
 * 今回のスコアがユーザーの自己ベストを上回っていれば、ローカルストレージを更新する。
 * 【修正点】比較対象を gameState.userHighScore ではなく、LocalStorageの値から取得した値と比較し、確実に更新する。
 * @param {number} newScore - 今回の最終スコア
 * @param {string} mode - ゲームモード
 * @returns {boolean} ハイスコアが更新されたかどうか
 */
export function saveUserHighScore(newScore, mode) { 
    const key = getLocalKey(mode);
    
    // 1. ローカルストレージから、現在のモードのベストスコアを確実に取得する
    const storedScore = localStorage.getItem(key);
    const currentBest = parseInt(storedScore, 10);
    // 読み込みエラーや値がない場合は 0 とする
    const safeCurrentBest = (isNaN(currentBest) || currentBest < 0) ? 0 : currentBest;
    
    if (newScore > safeCurrentBest) {
        // 2. 更新が必要であれば、gameState と LocalStorage の両方を更新
        console.log(`Storage: ユーザーハイスコアを更新: ${safeCurrentBest} -> ${newScore} (Mode: ${mode})`);
        
        gameState.userHighScore = newScore;
        localStorage.setItem(key, newScore.toString());
        return true; // 更新あり
    }
    return false; // 更新なし
}