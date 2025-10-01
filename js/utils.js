/**
 * utils.js
 * 汎用的な補助関数を管理するモジュール
 */
import { gameState } from './gameState.js';
import { CONFIG } from './config.js';
// ★★★ 依存関係エラーを修正: ui.jsからupdateCellPositionをインポート
import { updateCellPosition } from './ui.js';

export function getRandomImageName() { return CONFIG.IMAGE_NAMES[Math.floor(Math.random() * CONFIG.IMAGE_NAMES.length)]; }
export function getCellCoords(cell) { return { row: parseInt(cell.dataset.row, 10), col: parseInt(cell.dataset.col, 10) }; }
export function getCellElement(row, col) { return isValidCoords(row, col) ? gameState.cellElements[row][col] : null; }
export function areAdjacent(cellA, cellB) { const { row: r1, col: c1 } = getCellCoords(cellA); const { row: r2, col: c2 } = getCellCoords(cellB); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; }
export function isValidCoords(row, col) { const { gridSize } = gameState; return row >= 0 && row < gridSize && col >= 0 && col < gridSize; }
export function swapGridData(cellA, cellB) { const { row: r1, col: c1 } = getCellCoords(cellA); const { row: r2, col: c2 } = getCellCoords(cellB);[gameState.grid[r1][c1], gameState.grid[r2][c2]] = [gameState.grid[r2][c2], gameState.grid[r1][c1]];[gameState.cellElements[r1][c1], gameState.cellElements[r2][c2]] = [gameState.cellElements[r2][c2], gameState.cellElements[r1][c1]]; }
export function swapAnimation(cellA, cellB) { return new Promise(resolve => { const { row: r1, col: c1 } = getCellCoords(cellA); const { row: r2, col: c2 } = getCellCoords(cellB); updateCellPosition(cellA, r2, c2); updateCellPosition(cellB, r1, c1); cellA.dataset.row = r2; cellA.dataset.col = c2; cellB.dataset.row = r1; cellB.dataset.col = c1; setTimeout(resolve, CONFIG.ANIMATION_DURATION); }); }
export function calculatePoints(matches) { const basePoints = matches.length * 10; const comboBonus = Math.floor(basePoints * (gameState.combo * CONFIG.COMBO_BONUS_MULTIPLIER)); return basePoints + comboBonus; }
export function checkLevelUp() { const requiredExp = CONFIG.LEVEL_UP_EXP_BASE * gameState.level; if (gameState.exp >= requiredExp) { gameState.level++; gameState.exp -= requiredExp; } }
export function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }