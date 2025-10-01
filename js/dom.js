/**
 * dom.js
 * DOM要素への参照をまとめて管理するモジュール
 */

// DOM要素参照オブジェクトをエクスポート
export const dom = {
    highScoreStart: document.getElementById('high-score-start'),
    highScoreEnd: document.getElementById('high-score-end'),
    newHighScoreMessage: document.getElementById('new-high-score-message'),
    modeButtons: document.querySelectorAll('.mode-button'),
    restartButton: document.getElementById('restart-button'),
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    gameOverTitle: document.getElementById('game-over-title'),
    gridContainer: document.getElementById('grid-container'),
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    timeLeft: document.getElementById('time-left'),
    expBar: document.getElementById('exp-bar'),
    finalScore: document.getElementById('final-score'),
    comboDisplay: document.getElementById('combo-display'),
    clearBonusImage: document.getElementById('clear-bonus-image'),
};