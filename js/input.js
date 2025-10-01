/**
 * input.js
 * ユーザーの入力(クリック、タッチ、スワイプ)を処理するモジュール。
 * イベント委譲パターンを採用し、パフォーマンスを最適化。
 */
import { dom } from './dom.js';
import { handleSelection, handleSwap } from './gameLogic.js';
import { getCellCoords, isValidCoords, getCellElement } from './utils.js';
import { CONFIG } from './config.js';

let touchStartCoords = null;

function handleCellClick(event) {
    const cellElement = event.target.closest('.cell');
    if (cellElement) {
        handleSelection(cellElement);
    }
}

function handleTouchStart(event) {
    const cellElement = event.target.closest('.cell');
    if (cellElement) {
        event.preventDefault();
        touchStartCoords = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            target: cellElement
        };
    }
}

function handleTouchMove(event) {
    event.preventDefault();
}

function handleTouchEnd(event) {
    if (!touchStartCoords) return;
    const cellElement = event.target.closest('.cell');
    if (!cellElement) {
        touchStartCoords = null;
        return;
    }

    const dx = event.changedTouches[0].clientX - touchStartCoords.x;
    const dy = event.changedTouches[0].clientY - touchStartCoords.y;

    if (Math.abs(dx) < CONFIG.SWIPE_THRESHOLD && Math.abs(dy) < CONFIG.SWIPE_THRESHOLD) {
        handleSelection(touchStartCoords.target);
    } else {
        const { row, col } = getCellCoords(touchStartCoords.target);
        let targetRow = row, targetCol = col;
        if (Math.abs(dx) > Math.abs(dy)) {
            targetCol += (dx > 0) ? 1 : -1;
        } else {
            targetRow += (dy > 0) ? 1 : -1;
        }
        if (isValidCoords(targetRow, targetCol)) {
            handleSwap(touchStartCoords.target, getCellElement(targetRow, targetCol));
        }
    }
    touchStartCoords = null;
}

/**
 * 入力イベントリスナーを初期化する
 */
export function initializeInput() {
    dom.gridContainer.addEventListener('click', handleCellClick);
    dom.gridContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    dom.gridContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    dom.gridContainer.addEventListener('touchend', handleTouchEnd);
}