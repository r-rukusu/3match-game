/**
 * ui.js
 * UIの描画や更新に関する処理を管理するモジュール
 */
import { dom } from './dom.js';
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import * as effects from './effects.js';

export function showScreen(screenName) {
    dom.startScreen.classList.remove('active');
    dom.gameScreen.classList.remove('active');
    dom.gameOverScreen.classList.remove('active');
    if (screenName === 'start') dom.startScreen.classList.add('active');
    else if (screenName === 'game') dom.gameScreen.classList.add('active');
    else if (screenName === 'gameOver') dom.gameOverScreen.classList.add('active');
}

export function updateUI() {
    dom.score.textContent = gameState.score;
    dom.level.textContent = gameState.level;
    dom.timeLeft.textContent = gameState.timeLeft;
    const requiredExp = CONFIG.LEVEL_UP_EXP_BASE * gameState.level;
    const expPercentage = (gameState.exp / requiredExp) * 100;
    dom.expBar.style.width = `${expPercentage}%`;
}

/**
 * マッチしたセルが消える演出を再生します。
 * 複数のセルに対して同時にパーティクルエフェクトを発生させます。
 * @param {Array<HTMLElement>} matchedCellElements - マッチしたセルのDOM要素の配列
 */
export function playMatchEffect(matchedCellElements) {
    matchedCellElements.forEach(cellEl => {
        effects.playParticleEffect(cellEl);
    });
}

/**
 * コンボ演出を再生します。
 * コンボ数表示と画面シェイクを同時に行います。
 * @param {number} comboCount - 現在のコンボ数
 */
export async function playComboEffect(comboCount) {
    if (comboCount < 2) return;
    
    effects.showComboDisplay(comboCount);
    await effects.playScreenShake();
}

export function showCombo(combo) {
    if (combo < 2) return;
    dom.comboDisplay.textContent = `${combo} COMBO!`;
    dom.comboDisplay.classList.add('show');
}

export function hideCombo() {
    dom.comboDisplay.classList.remove('show');
}

// ★★★ 依存関係エラーを修正: utils.jsから使われるためexportする
export function updateCellPosition(cell, row, col) {
    cell.style.setProperty('--row', row);
    cell.style.setProperty('--col', col);
}

export function createCell(row, col, piece) {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    if (piece.type !== 'normal') {
        const pieceConfig = Object.values(CONFIG.SPECIAL_PIECES).find(p => p.type === piece.type);
        if (pieceConfig) {
            cell.classList.add(pieceConfig.className);
            if (piece.type === 'line_bomb' && piece.orientation) {
                cell.classList.add(`${pieceConfig.className}-${piece.orientation}`);
            }
        }
    }
    
    cell.dataset.row = row;
    cell.dataset.col = col;
    updateCellPosition(cell, row, col);
    const img = document.createElement('img');
    img.onerror = function() {
    // 1. 将来のerrorイベントでこの関数が再度呼ばれるのを防ぐ
    this.onerror = null;
    
    // 2. 代替の画像ソースを設定する
    this.src = CONFIG.DUMMY_IMAGE_SRC;
    };
    img.src = `${CONFIG.IMAGE_PATH}${piece.image}`;
    cell.appendChild(img);
    return cell;
}

export function renderGrid() {
    dom.gridContainer.innerHTML = '';
    gameState.cellElements = [];
    gameState.grid.forEach((row, rowIndex) => {
        gameState.cellElements[rowIndex] = [];
        row.forEach((piece, colIndex) => {
            const cell = createCell(rowIndex, colIndex, piece);
            dom.gridContainer.appendChild(cell);
            gameState.cellElements[rowIndex][colIndex] = cell;
        });
    });
}