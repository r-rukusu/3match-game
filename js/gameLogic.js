/**
 * gameLogic.js
 * マッチ判定、スペシャルピースの生成・効果発動など、ゲームのコアロ
ジックを管理するモジュール
 */

// ===================================================================================
// インポート
// ===================================================================================
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import { showCombo, hideCombo, updateUI, createCell, updateCellPosition } from './ui.js';
import { 
    sleep, getCellElement, swapGridData, swapAnimation, 
    isValidCoords, getCellCoords, areAdjacent, getRandomImageName, 
    calculatePoints, checkLevelUp 
} from './utils.js';
import { dom } from './dom.js';

// ===================================================================================
// 公開(export)する関数
// ===================================================================================

export async function handleSwap(cellA, cellB) {
    if (gameState.isProcessing || !cellA || !cellB) return;
    gameState.isProcessing = true;
    const { row: r1, col: c1 } = getCellCoords(cellA);
    const { row: r2, col: c2 } = getCellCoords(cellB);
    const swapInfo = { coords: [`${r1}-${c1}`, `${r2}-${c2}`] };

    await swapAnimation(cellA, cellB);
    swapGridData(cellA, cellB);
    
    const matchGroups = findMatchGroups();
    if (matchGroups.length > 0) {
        await processMatches(matchGroups, swapInfo);
    } else {
        await sleep(100);
        await swapAnimation(cellA, cellB);
        swapGridData(cellA, cellB);
    }
    gameState.isProcessing = false;
}

export async function handleSelection(cellElement) {
    if (gameState.isProcessing) return;
    if (!gameState.selectedCell) {
        cellElement.classList.add('selected');
        gameState.selectedCell = cellElement;
    } else {
        if (gameState.selectedCell === cellElement) {
            gameState.selectedCell.classList.remove('selected');
            gameState.selectedCell = null;
            return;
        }
        if (areAdjacent(gameState.selectedCell, cellElement)) {
            await handleSwap(gameState.selectedCell, cellElement);
        }
        gameState.selectedCell.classList.remove('selected');
        gameState.selectedCell = null;
    }
}

// ★★★ ここを修正: gameFlow.jsから呼び出せるようにexportを追加 ★★★
export function createGridData() {
    gameState.grid = [];
    for (let row = 0; row < gameState.gridSize; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < gameState.gridSize; col++) {
            gameState.grid[row][col] = { type: 'normal', image: getRandomImageName() };
        }
    }
}


// ===================================================================================
// 内部関数
// ===================================================================================

async function processMatches(initialMatchGroups, swapInfo = null) {
    const piecesToCreate = [];
    
    for (const group of initialMatchGroups) {
        const image = gameState.grid[group.coords[0].row][group.coords[0].col]?.image;
        if (!image) continue;
        for (const pieceConfig of Object.values(CONFIG.SPECIAL_PIECES)) {
            const cond = pieceConfig.creationCondition;
            let isMatch = false;
            if (cond.type === 'shape' && cond.shape.includes(group.shape)) {
                isMatch = true;
            } else if (cond.type === 'match' && group.length === cond.length && group.shape === 'line') {
                isMatch = true;
            }
            if (isMatch) {
                const creationCoord = group.intersection || (swapInfo ? group.coords.find(c => swapInfo.coords.includes(`${c.row}-${c.col}`)) : null) || group.coords[Math.floor(group.length / 2)];
                piecesToCreate.push({ ...creationCoord, image, type: pieceConfig.type, className: pieceConfig.className, orientation: group.orientation });
                break;
            }
        }
    }
    
    let allClearedCoords = new Set();
    let coordsToProcess = new Set(initialMatchGroups.flatMap(g => g.coords.map(c => `${c.row}-${c.col}`)));
    let processedSpecials = new Set();
    while (coordsToProcess.size > 0) {
        const currentCoordStr = coordsToProcess.values().next().value;
        coordsToProcess.delete(currentCoordStr);
        if (allClearedCoords.has(currentCoordStr) || processedSpecials.has(currentCoordStr)) continue;
        
        allClearedCoords.add(currentCoordStr);
        const [row, col] = currentCoordStr.split('-').map(Number);
        const piece = gameState.grid[row]?.[col];
        if (piece && piece.type !== 'normal') {
            processedSpecials.add(currentCoordStr);
            switch (piece.type) {
                case 'bomb':
                    for (let r = row - 1; r <= row + 1; r++) { for (let c = col - 1; c <= col + 1; c++) { if (isValidCoords(r, c)) coordsToProcess.add(`${r}-${c}`); } }
                    break;
                case 'cross_bomb':
                    for (let i = 0; i < gameState.gridSize; i++) { if (isValidCoords(row, i)) coordsToProcess.add(`${row}-${i}`); if (isValidCoords(i, col)) coordsToProcess.add(`${i}-${col}`); }
                    break;
                case 'line_bomb':
                    for (let i = 0; i < gameState.gridSize; i++) {
                        if (piece.orientation === 'vertical') { if (isValidCoords(i, col)) coordsToProcess.add(`${i}-${col}`); }
                        else { if (isValidCoords(row, i)) coordsToProcess.add(`${row}-${i}`); }
                    }
                    break;
            }
        }
    }

    piecesToCreate.forEach(p => allClearedCoords.delete(`${p.row}-${p.col}`));
    if (allClearedCoords.size > 0) {
        gameState.combo++;
        showCombo(gameState.combo);
        gameState.score += calculatePoints(Array.from(allClearedCoords));
        gameState.exp += allClearedCoords.size;
        
        await removeMatchedCells(Array.from(allClearedCoords));
        
        piecesToCreate.forEach(p => {
            gameState.grid[p.row][p.col] = { type: p.type, image: p.image, orientation: p.orientation };
            const cellElement = getCellElement(p.row, p.col);
            if (cellElement) {
                Object.values(CONFIG.SPECIAL_PIECES).forEach(spec => cellElement.classList.remove(spec.className));
                cellElement.classList.add(p.className);
                cellElement.classList.remove(`${p.className}-vertical`, `${p.className}-horizontal`);
                if (p.orientation) cellElement.classList.add(`${p.className}-${p.orientation}`);
            }
        });
        await dropAndRefillCells();
        updateUI();
        checkLevelUp();

        const newMatchGroups = findMatchGroups();
        if (newMatchGroups.length > 0) {
            await processMatches(newMatchGroups);
        } else {
            hideCombo();
            gameState.combo = 0;
        }
    }
}

export function findMatchGroups() {
    const { grid, gridSize } = gameState;
    const finalGroups = [];
    let consumedCoords = new Set();
    const coordToString = ({row, col}) => `${row}-${col}`;
    
    const horizontalLines = [];
    const verticalLines = [];
    for (let r = 0; r < gridSize; r++) { for (let c = 0; c < gridSize; c++) { if (!grid[r][c]) continue; const image = grid[r][c].image; if (c <= gridSize - 3 && grid[r][c+1]?.image === image && grid[r][c+2]?.image === image) { const line = []; let len = c; while(len < gridSize && grid[r][len]?.image === image) { line.push({row: r, col: len}); len++; } horizontalLines.push(line); c = len - 1; } } }
    for (let c = 0; c < gridSize; c++) { for (let r = 0; r < gridSize; r++) { if (!grid[r][c]) continue; const image = grid[r][c].image; if (r <= gridSize - 3 && grid[r+1][c]?.image === image && grid[r+2][c]?.image === image) { const line = []; let len = r; while(len < gridSize && grid[len][c]?.image === image) { line.push({row: len, col: c}); len++; } verticalLines.push(line); r = len - 1; } } }
    
    const intersections = new Map();
    horizontalLines.forEach((hLine, hIndex) => hLine.forEach(pos => { const key = coordToString(pos); if (!intersections.has(key)) intersections.set(key, {}); intersections.get(key).h = hIndex; }));
    verticalLines.forEach((vLine, vIndex) => vLine.forEach(pos => { const key = coordToString(pos); if (!intersections.has(key)) intersections.set(key, {}); intersections.get(key).v = vIndex; }));
    
    for (const [key, {h, v}] of intersections) {
        if (h === undefined || v === undefined || consumedCoords.has(key)) continue;
        const [row, col] = key.split('-').map(Number);
        const hLine = horizontalLines[h];
        const vLine = verticalLines[v];
        const allShapeCoords = new Set([...hLine, ...vLine].map(coordToString));
        if ([...allShapeCoords].some(c => consumedCoords.has(c))) continue;
        const up = vLine.some(p => p.row < row), down = vLine.some(p => p.row > row), left = hLine.some(p => p.col < col), right = hLine.some(p => p.col > col);
        const directions = [up, down, left, right].filter(Boolean).length;
        let shape = 'line';
        if (directions === 4) shape = 'cross';
        else if (directions === 3) shape = 'T';
        else if (directions === 2 && (up || down) && (left || right)) shape = 'L';
        if (shape !== 'line') {
            finalGroups.push({ coords: [...new Set([...hLine, ...vLine])], shape: shape, intersection: {row, col} });
            allShapeCoords.forEach(c => consumedCoords.add(c));
        }
    }
    
    horizontalLines.forEach(line => {
        if (line.every(pos => !consumedCoords.has(coordToString(pos)))) {
            finalGroups.push({ coords: line, shape: 'line', length: line.length, orientation: 'horizontal' });
            line.forEach(pos => consumedCoords.add(coordToString(pos)));
        }
    });
    verticalLines.forEach(line => {
        if (line.every(pos => !consumedCoords.has(coordToString(pos)))) {
            finalGroups.push({ coords: line, shape: 'line', length: line.length, orientation: 'vertical' });
            line.forEach(pos => consumedCoords.add(coordToString(pos)));
        }
    });
    return finalGroups;
}

async function removeMatchedCells(matchedCoords) {
    const promises = matchedCoords.map(coord => {
        const [row, col] = coord.split('-').map(Number);
        const cell = getCellElement(row, col);
        if (cell) {
            cell.classList.add('fade-out');
            return sleep(CONFIG.ANIMATION_DURATION).then(() => {
                if (cell.parentNode) cell.remove();
                gameState.grid[row][col] = null;
                gameState.cellElements[row][col] = null;
            });
        }
        return Promise.resolve();
    });
    await Promise.all(promises);
}

async function dropAndRefillCells() {
    const { gridSize } = gameState;
    const fragment = document.createDocumentFragment();
    for (let c = 0; c < gridSize; c++) {
        let writeRow = gridSize - 1;
        for (let r = gridSize - 1; r >= 0; r--) {
            if (gameState.grid[r][c] !== null) {
                if (writeRow !== r) {
                    gameState.grid[writeRow][c] = gameState.grid[r][c];
                    gameState.cellElements[writeRow][c] = gameState.cellElements[r][c];
                    gameState.grid[r][c] = null;
                    gameState.cellElements[r][c] = null;
                    const cell = getCellElement(writeRow, c);
                    if (cell) {
                        cell.dataset.row = writeRow;
                        updateCellPosition(cell, writeRow, c);
                    }
                }
                writeRow--;
            }
        }
    }
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (gameState.grid[r][c] === null) {
                const newPiece = { type: 'normal', image: getRandomImageName() };
                gameState.grid[r][c] = newPiece;
                const cell = createCell(r, c, newPiece);
                fragment.appendChild(cell);
                gameState.cellElements[r][c] = cell;
            }
        }
    }
    dom.gridContainer.appendChild(fragment);
    await sleep(CONFIG.ANIMATION_DURATION);
}