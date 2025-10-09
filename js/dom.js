/**
 * dom.js
 * DOM要素への参照をまとめて管理するモジュール
 */

// DOM要素参照オブジェクトをエクスポート
export const dom = {
    highScoreStart: document.getElementById('global-high-score-start'),
    highScoreEnd: document.getElementById('global-high-score-end'),
    newHighScoreMessage: document.getElementById('new-global-high-score-message'),
    localHighScoreStart: document.getElementById('local-high-score-start'),
    localHighScoreEnd: document.getElementById('local-high-score-end'),
    localHighScoreStartEasy: document.getElementById('local-high-score-start-easy'),
    localHighScoreStartNormal: document.getElementById('local-high-score-start-normal'),
    newLocalHighScoreMessage: document.getElementById('new-local-high-score-message'),
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
    timeBar: document.getElementById('time-bar'),
    timeBonusDisplay: document.getElementById('time-bonus-display'), 
    expBar: document.getElementById('exp-bar'),
    finalScore: document.getElementById('final-score'),
    comboDisplay: document.getElementById('combo-display'),
    clearBonusImage: document.getElementById('clear-bonus-image'),
    gameContainer: document.getElementById('game-container'), // screen-shake用
    muteButton: document.getElementById('mute-button'), // mute

};