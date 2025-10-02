/**
 * gameLogic.js
 * マッチ判定、スペシャルピースの生成・効果発動など、ゲームのコアロジックを管理するモジュール
 * 【改修版】スペシャルピースの生成条件が満たされた際に、ピースを生成せず効果を即時発動させる仕様に変更。
 */

// ===================================================================================
// インポート
// ===================================================================================
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
// ▼▼▼ 変更点 ① ▼▼▼
// ui.jsからのshow/hideComboを削除し、effectsモジュールを直接インポート
import { updateUI, createCell, updateCellPosition } from './ui.js';
import * as effects from './effects.js'; // 演出モジュールをインポート
// ▲▲▲ 変更点 ① ▲▲▲
import {
    sleep, getCellElement, swapGridData, swapAnimation,
    isValidCoords, getCellCoords, areAdjacent, getRandomImageName,
    calculatePoints, checkLevelUp
} from './utils.js';
import { dom } from './dom.js';
// ===================================================================================
// 公開(export)する関数
// ===================================================================================

/**
 * 2つのセルを入れ替える処理。ゲーム操作の起点。
 * @param {HTMLElement} cellA - 選択元のセル
 * @param {HTMLElement} cellB - 選択先のセル
 */
export async function handleSwap(cellA, cellB) {
    if (gameState.isProcessing || !cellA || !cellB) return;
    gameState.isProcessing = true; // 処理中の多重操作を防止
    
    // アニメーションとデータのスワップ
    await swapAnimation(cellA, cellB);
    swapGridData(cellA, cellB);
    
    const matchGroups = findMatchGroups();
    if (matchGroups.length > 0) {
        // マッチが存在すれば、連鎖処理を開始
        const { row: r1, col: c1 } = getCellCoords(cellA);
        const { row: r2, col: c2 } = getCellCoords(cellB);
        const swapInfo = { coords: [`${r1}-${c1}`, `${r2}-${c2}`] };
        await processMatches(matchGroups, swapInfo);
    } else {
        // マッチがなければ、元の位置に戻す
        await sleep(100);
        await swapAnimation(cellA, cellB);
        swapGridData(cellA, cellB);
    }
    
    gameState.isProcessing = false; // 処理ロックを解除
}

/**
 * セルが選択された時の処理
 * @param {HTMLElement} cellElement - 選択されたセル
 */
export async function handleSelection(cellElement) {
    if (gameState.isProcessing) return;

    if (!gameState.selectedCell) {
        // 1つ目のセル選択
        cellElement.classList.add('selected');
        gameState.selectedCell = cellElement;
    } else {
        // 2つ目のセル選択
        if (gameState.selectedCell === cellElement) {
            // 同じセルを選択した場合は選択解除
            gameState.selectedCell.classList.remove('selected');
            gameState.selectedCell = null;
            return;
        }

        if (areAdjacent(gameState.selectedCell, cellElement)) {
            // 隣接していればスワップ処理へ
            await handleSwap(gameState.selectedCell, cellElement);
        }

        // 選択状態をリセット
        gameState.selectedCell.classList.remove('selected');
        gameState.selectedCell = null;
    }
}

/**
 * ゲームの盤面データを初期生成する
 */
export function createGridData() {
    gameState.grid = [];
    for (let row = 0; row < gameState.gridSize; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < gameState.gridSize; col++) {
            gameState.grid[row][col] = { type: 'normal', image: getRandomImageName() };
        }
    }
}

/**
 * マッチしたピースを処理し、スコアを加算し、新しいピースを補充する一連の流れを管理します。
 * 連鎖（コンボ）が続く限り、この処理を繰り返します。
 */
export async function handleMatches() {
    let comboCount = 0;
    let totalScoreThisTurn = 0;

    // isProcessingフラグで多重実行を防止 (これはgameStateで管理することを推奨)
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;

    // findMatchesが盤面上のマッチを返す限りループ
    let matches = findMatches();
    while (matches.length > 0) {
        comboCount++;
        
        // --- ▼▼▼ 演出呼び出し箇所 ▼▼▼ ---
        // 1. コンボ演出の再生 (2コンボ目以降)
        if (comboCount > 1) {
            await ui.playComboEffect(comboCount);
        }

        // 2. マッチしたピースをDOM上で特定
        const matchedCellElements = [];
        matches.forEach(match => {
            match.forEach(({ row, col }) => {
                const cell = dom.gridContainer.querySelector(`.cell[style*="--row: ${row};"][style*="--col: ${col};"]`);
                if (cell) {
                    matchedCellElements.push(cell);
                }
            });
        });
        
        // 3. パーティクル演出の再生
        ui.playMatchEffect(matchedCellElements);
        // --- ▲▲▲ 演出呼び出し箇所 ▲▲▲ ---

        // (既存のマッチ処理ロジック)
        // スコア計算、ピースの削除、盤面の更新など...
        // ...
        
        // 次の連鎖判定へ
        matches = findMatches();
    }
    
    gameState.isProcessing = false;
}

// ===================================================================================
// 内部関数 (コアロジック)
// ===================================================================================

/**
 * マッチ処理のメインループ。消去、効果発動、補充、連鎖判定を担う。
 * @param {Array} initialMatchGroups - 最初に発見されたマッチグループの配列
 * @param {object | null} swapInfo - どのスワップがトリガーになったかの情報
 */
async function processMatches(initialMatchGroups, swapInfo = null) {
    
    // --- 1. 消去範囲の特定 ---
    // これから消える、あるいは効果を発動するピースの座標を管理するSet
    let coordsToProcess = new Set(initialMatchGroups.flatMap(g => g.coords.map(c => `${c.row}-${c.col}`)));
    
    // ★★★【ロジック変更点 ①】★★★
    // スペシャルピースを「生成」する代わりに、その「効果」を即座にcoordsToProcessに追加する
    for (const group of initialMatchGroups) {
        for (const pieceConfig of Object.values(CONFIG.SPECIAL_PIECES)) {
            const cond = pieceConfig.creationCondition;
            let isMatch = false;
            if (cond.type === 'shape' && cond.shape.includes(group.shape)) { isMatch = true; } 
            else if (cond.type === 'match' && group.length === cond.length && group.shape === 'line') { isMatch = true; }

            if (isMatch) {
                // 効果発動の中心点を決定 (スワップしたピースを優先)
                const centerCoord = group.intersection || 
                                    (swapInfo ? group.coords.find(c => swapInfo.coords.includes(`${c.row}-${c.col}`)) : null) || 
                                    group.coords[Math.floor(group.length / 2)];
                const { row, col } = centerCoord;
                
                // スペシャルピースの種類に応じて、効果範囲の座標を消去リストに追加
                switch (pieceConfig.type) {
                    case 'bomb':
                        for (let r = row - 1; r <= row + 1; r++) { for (let c = col - 1; c <= col + 1; c++) { if (isValidCoords(r, c)) coordsToProcess.add(`${r}-${c}`); } }
                        break;
                    case 'cross_bomb':
                        for (let i = 0; i < gameState.gridSize; i++) { if (isValidCoords(row, i)) coordsToProcess.add(`${row}-${i}`); if (isValidCoords(i, col)) coordsToProcess.add(`${i}-${col}`); }
                        break;
                    case 'line_bomb':
                        for (let i = 0; i < gameState.gridSize; i++) {
                            if (group.orientation === 'vertical') { if (isValidCoords(i, col)) coordsToProcess.add(`${i}-${col}`); } 
                            else { if (isValidCoords(row, i)) coordsToProcess.add(`${row}-${i}`); }
                        }
                        break;
                }
                break; // 1つのマッチグループからは1種類の効果のみ発動
            }
        }
    }

    // --- 2. 連鎖的な効果発動の処理 ---
    let allClearedCoords = new Set(); // 最終的に消去される全ての座標
    let processedSpecials = new Set(); // 処理済みのスペシャルピース (無限ループ防止)

    while (coordsToProcess.size > 0) {
        const currentCoordStr = coordsToProcess.values().next().value;
        coordsToProcess.delete(currentCoordStr);

        if (allClearedCoords.has(currentCoordStr) || processedSpecials.has(currentCoordStr)) continue;
        
        allClearedCoords.add(currentCoordStr);
        const [row, col] = currentCoordStr.split('-').map(Number);
        const piece = gameState.grid[row]?.[col];

        // 盤上に既存のスペシャルピースがあれば、その効果を誘発させる
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
    
    // ★★★【ロジック変更点 ②】★★★
    // ピースを生成する処理 (piecesToCreate) は不要になったため、関連コードを全て削除

    // --- 3. 消去、スコア加算、補充 ---
    if (allClearedCoords.size > 0) {
        gameState.combo++;
        effects.showComboDisplay(gameState.combo);
        if (gameState.combo > 1) {
            effects.playScreenShake();
        }
        gameState.score += calculatePoints(Array.from(allClearedCoords));
        gameState.exp += allClearedCoords.size;
        
        await removeMatchedCells(Array.from(allClearedCoords));
        await dropAndRefillCells();
        
        updateUI();
        checkLevelUp();

        // --- 4. 連鎖（リカーシブコール） ---
        const newMatchGroups = findMatchGroups();
        if (newMatchGroups.length > 0) {
            await sleep(100); // 連鎖の間にわずかな間を追加
            await processMatches(newMatchGroups);
        } else {
            // 連鎖が終了
            gameState.combo = 0;
        }
    }
}

/**
 * 盤面全体をスキャンして、3つ以上並んだピースのグループを見つける
 * @returns {Array} マッチしたグループの情報の配列
 */
export function findMatchGroups() {
    const { grid, gridSize } = gameState;
    const finalGroups = [];
    let consumedCoords = new Set();
    const coordToString = ({row, col}) => `${row}-${col}`;
    
    // 水平方向と垂直方向の直線マッチをすべて検出
    const horizontalLines = [];
    const verticalLines = [];
    for (let r = 0; r < gridSize; r++) { for (let c = 0; c < gridSize; c++) { if (!grid[r][c]) continue; const image = grid[r][c].image; if (c <= gridSize - 3 && grid[r][c+1]?.image === image && grid[r][c+2]?.image === image) { const line = []; let len = c; while(len < gridSize && grid[r][len]?.image === image) { line.push({row: r, col: len}); len++; } horizontalLines.push(line); c = len - 1; } } }
    for (let c = 0; c < gridSize; c++) { for (let r = 0; r < gridSize; r++) { if (!grid[r][c]) continue; const image = grid[r][c].image; if (r <= gridSize - 3 && grid[r+1][c]?.image === image && grid[r+2][c]?.image === image) { const line = []; let len = r; while(len < gridSize && grid[len][c]?.image === image) { line.push({row: len, col: c}); len++; } verticalLines.push(line); r = len - 1; } } }
    
    // L字、T字、十字の形状を検出
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
    
    // 形状として消費されなかった直線マッチを追加
    horizontalLines.forEach(line => {
        if (line.every(pos => !consumedCoords.has(coordToString(pos)))) {
            finalGroups.push({ coords: line, shape: 'line', length: line.length, orientation: 'vertical' });
            line.forEach(pos => consumedCoords.add(coordToString(pos)));
        }
    });
    verticalLines.forEach(line => {
        if (line.every(pos => !consumedCoords.has(coordToString(pos)))) {
            finalGroups.push({ coords: line, shape: 'line', length: line.length, orientation: 'horizontal' });
            line.forEach(pos => consumedCoords.add(coordToString(pos)));
        }
    });
    return finalGroups;
}

/**
 * 指定された座標のセルを盤面から消去する (アニメーション付き)
 * @param {Array<string>} matchedCoords - 消去するセルの座標文字列の配列 (e.g., ["0-1", "0-2"])
 */
async function removeMatchedCells(matchedCoords) {
    const promises = matchedCoords.map(coord => {
        const [row, col] = coord.split('-').map(Number);
        const cell = getCellElement(row, col);
        if (cell) {
            effects.playParticleEffect(cell);
            cell.classList.add('fade-out'); // 消去アニメーション
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

/**
 * セルを落下させ、空いたスペースに新しいセルを補充する
 */
async function dropAndRefillCells() {
    const { gridSize } = gameState;
    const fragment = document.createDocumentFragment(); // DOM操作のパフォーマンス最適化

    // 1. 落下処理
    for (let c = 0; c < gridSize; c++) {
        let writeRow = gridSize - 1; // ピースを書き込むべき最も下の行
        for (let r = gridSize - 1; r >= 0; r--) {
            if (gameState.grid[r][c] !== null) {
                if (writeRow !== r) {
                    // ピースを下に移動
                    gameState.grid[writeRow][c] = gameState.grid[r][c];
                    gameState.cellElements[writeRow][c] = gameState.cellElements[r][c];
                    gameState.grid[r][c] = null;
                    gameState.cellElements[r][c] = null;
                    const cell = getCellElement(writeRow, c);
                    if (cell) {
                        cell.dataset.row = writeRow;
                        updateCellPosition(cell, writeRow, c); // UI上の位置を更新
                    }
                }
                writeRow--;
            }
        }
    }

    // 2. 新規ピースの補充
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

    dom.gridContainer.appendChild(fragment); // 新規セルを一括でDOMに追加
    await sleep(CONFIG.ANIMATION_DURATION);
}