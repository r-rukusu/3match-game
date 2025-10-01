/**
 * gameState.js
 * ゲームの状態を一元管理するモジュール
 */
import { CONFIG } from './config.js';

// ゲームの状態オブジェクト本体。他のモジュールから変更されるためletで宣言。
export let gameState = {};

/**
 * ゲームの状態を初期化（リセット）する
 * @param {string} mode - 'easy' または 'normal'
 */
export function resetGameState(mode = 'normal') {
    const modeConfig = CONFIG.MODES[mode];
    gameState = {
        grid: [], cellElements: [], score: 0, level: 1, exp: 0,
        timeLeft: modeConfig.GAME_TIME_SECONDS,
        combo: 0, isProcessing: false, selectedCell: null, timerId: null,
        currentMode: mode, gridSize: modeConfig.GRID_SIZE,
        highScore: gameState.highScore || 0, // ハイスコアはリセットせずに引き継ぐ
    };
}