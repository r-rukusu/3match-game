/**
 * storage.js
 * localStorageを使ったデータの永続化を管理するモジュール
 */
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import { dom } from './dom.js';

/**
 * localStorageからハイスコアを安全に読み込み、gameStateとUIに反映する
 */
export function loadHighScore() {
    try {
        const score = localStorage.getItem(CONFIG.STORAGE_KEY);
        gameState.highScore = parseInt(score, 10) || 0;
    } catch (error) {
        console.error('ハイスコアの読み込みに失敗しました:', error);
        gameState.highScore = 0;
    }
    dom.highScoreStart.textContent = gameState.highScore;
}

/**
 * 新しいハイスコアをlocalStorageに保存する
 * @param {number} score - 保存するスコア
 */
export function saveHighScore(score) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, score);
    } catch (error) {
        console.error('ハイスコアの保存に失敗しました:', error);
    }
}