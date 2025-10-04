`main.js`を除く、各JavaScriptモジュールの内部構造と主要な関数の役割をまとめたドキュメント
---

# JavaScriptモジュール構造ドキュメント

## 概要
このドキュメントは、「画像マッチゲーム」の各JavaScriptモジュールの内部構造と主要な関数の役割を解説します。各モジュールは単一責任の原則に基づき、特定の機能に特化しています。

---

### `config.js`
**役割:** ゲーム全体の設定値を一元管理します。ゲームバランスの調整やデザイン変更は、主にこのファイルを修正することで行います。

#### 主要なオブジェクト
- `export const CONFIG`
  - ゲームの動作を定義するすべての設定値を格納したオブジェクトです。
  - **`STORAGE_KEY`**: `localStorage` にハイスコアを保存する際のキー。
  - **`IMAGE_NAMES`**: ゲームに登場するピースの画像ファイル名の配列。
  - **`MODES`**: ゲームモードごとの設定（盤面サイズ、制限時間など）。
  - **`SPECIAL_PIECES`**: スペシャルピースの種類、CSSクラス名、生成条件を定義します。
  - **`effects`**: パーティクルや画面シェイクなどの演出に関する詳細設定（数、色、持続時間など）を格納します。

---

### `dom.js`
**役割:** HTMLのDOM要素への参照を一元管理します。これにより、他のモジュールはDOMクエリを直接発行する必要がなくなり、HTML構造の変更に強くなります。

#### 主要なオブジェクト
- `export const dom`
  - `document.getElementById` や `document.querySelectorAll` で取得したDOM要素への参照をプロパティとして持つオブジェクトです。
  - 例: `gridContainer`, `score`, `timeLeft`, `startScreen` など、操作対象となるほぼすべての要素が含まれます。

---

### `gameState.js`
**役割:** ゲームの現在の状態（ステート）を一元管理します。スコア、盤面データ、制限時間など、動的に変化するすべての情報を保持します。

#### 主要な変数
- `export let gameState`
  - ゲームの状態をすべて保持するオブジェクト。
  - **`grid`**: 盤面の2次元配列。各要素がピースの情報を持つオブジェクトです。
  - **`cellElements`**: 盤面に対応するDOM要素の参照を保持する2次元配列。
  - **`score`**, **`level`**, **`exp`**, **`timeLeft`**, **`combo`**: 現在のスコアやレベル、コンボ数など。
  - **`isProcessing`**: 多重操作を防ぐためのロックフラグ。`true`の間、ユーザーの入力は受け付けません。
  - **`selectedCell`**: プレイヤーが選択中のセルDOM要素。

#### 主要な関数
- `export function resetGameState(mode)`
  - ゲームの状態を初期化します。ゲーム開始時に`gameFlow.js`から呼び出されます。ハイスコアは維持されます。

---

### `storage.js`
**役割:** `localStorage`を利用したデータの永続化（保存・読み込み）を担当します。主にハイスコアの管理に使用されます。

#### 主要な関数
- `export function loadHighScore()`
  - `localStorage`からハイスコアを読み込み、`gameState.highScore`とUI表示を更新します。
- `export function saveHighScore(score)`
  - 新しいハイスコアを`localStorage`に保存します。

---

### `utils.js`
**役割:** 特定のモジュールに依存しない、汎用的な補助関数を提供します。

#### 主要な関数
- `export function getRandomImageName()`: ランダムなピースの画像名を返します。
- `export function getCellCoords(cell)`: セルDOM要素から行・列の座標オブジェクトを取得します。
- `export function getCellElement(row, col)`: 座標からセルDOM要素を取得します。
- `export function areAdjacent(cellA, cellB)`: 2つのセルが隣接しているか判定します。
- `export function isValidCoords(row, col)`: 座標が盤面内であるか判定します。
- `export function swapGridData(cellA, cellB)`: `gameState`内の盤面データとセル要素参照を入れ替えます。
- `export function swapAnimation(cellA, cellB)`: 2つのセルのCSS `transform` を変更して、入れ替わるアニメーションを再生します。
- `export function calculatePoints(matches)`: 消したピースの数とコンボ数からスコアを計算します。
- `export function checkLevelUp()`: 経験値が閾値に達したか判定し、レベルアップ処理を行います。
- `export function sleep(ms)`: 指定時間、処理を待機させる`Promise`を返します。`async/await`と組み合わせて使用します。

---

### `effects.js`
**役割:** ゲーム内の視覚的な演出（エフェクト）に関するロジックを専門に扱います。UIの描画ロジック(`ui.js`)から演出を分離することで、コードの責務を明確にしています。

#### 主要な関数
- `export function playParticleEffect(cellElement)`
  - 指定されたセルの中心から、複数のパーティクルを放射状に放出するエフェクトを再生します。
- `export function playScreenShake()`
  - 画面全体を揺らすエフェクトを再生します。コンボ発生時などに使用されます。
- `export function showComboDisplay(comboCount)`
  - コンボ数を画面中央にアニメーション付きで表示します。
- `export function resetAllEffects()`
  - ゲーム終了時やリスタート時に、画面上に残っている可能性のあるエフェクト用のCSSクラスやDOM要素をすべてクリーンアップします。

---
### 'audioManager.js'
**役割:** ゲーム内のすべての音声（BGM、効果音）の読み込み、再生、停止、ミュート状態の管理を専門に扱います。音声関連のロジックを他のモジュールから完全に分離し、保守性と拡張性を高めます。

#### 主要な関数
- `export async function preloadAudios()`

  - ゲーム開始前に、config.jsで定義されたすべての音声ファイルを非同期で読み込みます。

- `export function playBGM()`

  - BGMをループ再生します。ミュート中は再生されません。

- `export function stopBGM()`

    - BGMの再生を停止します。

- `export function playSE(name)`

    - 指定された名前の効果音（'tap', 'gameOver'など）を再生します。連続で呼ばれても音が重なって再生されるように設計されています。

- `export function toggleMute(muteButton)`

    - 音声のミュート状態を切り替え、その状態をlocalStorageに保存します。UIボタンの表示も更新します。

- `export function initializeMuteState(muteButton)`

    - ページ読み込み時にlocalStorageから前回のミュート設定を復元します。


### `ui.js`
**役割:** UIの描画と更新を担当します。`gameState`のデータに基づいてDOM要素の見た目を変更したり、新しいDOM要素を生成したりします。

#### 主要な関数
- `export function showScreen(screenName)`
  - `'start'`, `'game'`, `'gameOver'`のいずれかの画面に切り替えます。
- `export function updateUI()`
  - スコア、レベル、残り時間、経験値バーなど、ゲーム中のHUD（ヘッドアップディスプレイ）を`gameState`に基づいて更新します。
- `export function playMatchEffect(matchedCellElements)`: `effects.js`のパーティクルエフェクトを呼び出すためのラッパー関数です。
- `export function playComboEffect(comboCount)`: `effects.js`のコンボ演出を呼び出すためのラッパー関数です。
- `export function updateCellPosition(cell, row, col)`
  - セルDOM要素のCSSカスタムプロパティ (`--row`, `--col`) を更新し、CSS `transform` を利用して正しい位置に配置します。
- `export function createCell(row, col, piece)`
  - ピースの情報に基づいて、新しいセルDOM要素（画像タグを含む）を生成します。
- `export function renderGrid()`
  - `gameState.grid`のデータに基づいて、盤面全体のセルDOM要素を一度に生成し、画面に描画します。

---

### `input.js`
**役割:** ユーザーからの入力（クリック、タッチ、スワイプ）を検知し、対応するゲームロジックを呼び出します。イベント委譲パターンを用いて、盤面全体で1つのイベントリスナーを共有し、パフォーマンスを最適化しています。

#### 主要な関数
- `export function initializeInput()`
  - ゲーム開始時に一度だけ呼ばれ、盤面コンテナ(`gridContainer`)に必要なイベントリスナー (`click`, `touchstart`, `touchmove`, `touchend`) を登録します。
- 内部関数 `handleCellClick(event)`: クリックされたセルに対して`gameLogic.js`の`handleSelection`を呼び出します。
- 内部関数 `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`: タッチ操作を解釈し、単純なタップであれば`handleSelection`を、スワイプであれば`handleSwap`を適切な引数で呼び出します。

---

### `gameFlow.js`
**役割:** ゲームの全体的な流れ（セッション管理）を制御します。ゲームの開始、タイマーの管理、ゲームオーバー処理など、一連のシーケンスを担当します。

#### 主要な関数
- `export function startGame(mode)`
  - ゲームモードを受け取り、ゲームを開始します。`gameState`のリセット、初期盤面の生成、UIの描画、タイマーの開始などを行います。
- `export function gameOver()`
  - ゲームを終了します。タイマーを停止し、エフェクトをリセットし、スコアを判定して、ゲームオーバー画面を表示します。
- 内部関数 `startTimer()` / `stopTimer()`: `setInterval`を使用してゲームタイマーを管理します。
- 内部関数 `updateGameOverScreen(...)`: ゲームオーバー画面の表示内容（スコア、ハイスコア更新メッセージなど）を更新します。
- 内部関数 `animateScoreCounter(...)`: スコアが0から最終スコアまでカウントアップするアニメーションを実装しています。

---

### `gameLogic.js`
**役割:** ゲームの核となるロジックを担当します。ピースの交換、マッチ判定、連鎖処理、スペシャルピースの効果発動など、ゲームのルールそのものを実装しています。

#### 主要な関数
- `export async function handleSwap(cellA, cellB)`
  - 2つのセルを入れ替えるメインの処理。マッチが発生すれば連鎖処理(`processMatches`)を呼び出し、発生しなければ元の位置に戻します。
- `export async function handleSelection(cellElement)`
  - プレイヤーがセルを選択した際の処理。1つ目の選択か2つ目の選択かを判断し、隣接していれば`handleSwap`を呼び出します。
- `export function createGridData()`
  - `gameState.grid`に初期ピースデータを生成します。
- `export function findMatchGroups()`
  - 盤面全体をスキャンし、3つ以上並んだピースのグループ（直線、L字、T字、十字）をすべて検出して返します。
- 内部関数 `async function processMatches(initialMatchGroups, swapInfo)`
  - **このモジュールで最も重要な関数**。
  - 1. **消去範囲の特定**: マッチしたピースと、それによって発動するスペシャルピースの効果範囲を計算し、消去対象の座標リストを作成します。
  - 2. **連鎖的な効果発動**: 消去対象にスペシャルピースが含まれていた場合、その効果をさらに誘発させ、消去範囲を拡大します。
  - 3. **消去と補充**: 確定した範囲のピースを消去し、スコアを加算し、上から新しいピースを落下・補充します。
  - 4. **再帰呼び出し**: 新しいピースが補充された結果、新たなマッチが発生した場合、この関数自身を再度呼び出し、連鎖（コンボ）を処理します。
- 内部関数 `async function removeMatchedCells(matchedCoords)`: 指定された座標のセルをフェードアウトさせ、DOMと`gameState`から削除します。
- 内部関数 `async function dropAndRefillCells()`: 空いたマスを埋めるために上のピースを落下させ、一番上の空マスに新しいピースを生成します。