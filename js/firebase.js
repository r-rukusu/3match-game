/**
 * firebase.js
 * Firebase Realtime Databaseとの通信を担当するモジュール。
 *
 * 【安全性・安定性への配慮】
 * - 通信処理はすべて非同期 (async/await) で行い、UIフリーズを防ぎます。
 * - エラーハンドリングを実装し、通信失敗時は0や空のデータを返すことで、システム全体が停止するのを防ぎます。
 * - スコアデータはクライアント側で厳密に検証できませんが、ここではユーザーIDなど認証情報を利用せず、匿名ユーザーのハイスコアとして扱います。
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { CONFIG } from './config.js';
import { sleep } from './utils.js'; // 動作テスト用に遅延を追加する場合はインポート

const app = initializeApp(CONFIG.FIREBASE_CONFIG);
const database = getDatabase(app);
// データのパス (例: /highscores/global)
const HIGH_SCORE_PATH = 'highscores/global';

/**
 * データベースから現在のハイスコアを読み込みます。
 * @returns {Promise<number>} 現在のハイスコア、または通信エラー時は 0。
 */
export async function loadHighScoreFromDB() {
    try {
        console.log("Firebase: ハイスコアを読み込み中...");
        
        // 開発環境での動作テスト用に意図的な遅延を挿入可能
        // await sleep(500); 

        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, HIGH_SCORE_PATH));

        if (snapshot.exists()) {
            const data = snapshot.val();
            // データが存在し、かつ数値であることを確認 (安全性の考慮)
            const score = typeof data === 'number' && !isNaN(data) ? data : 0;
            console.log(`Firebase: 読み込み完了。スコア: ${score}`);
            return score;
        } else {
            console.log("Firebase: データベースにハイスコアが存在しません。初期値 0 を返します。");
            return 0;
        }
    } catch (error) {
        // エラー耐性: 通信失敗やFirebaseのセットアップミスの場合、ゲームを停止させず 0 を返します。
        console.error("Firebase: ハイスコアの読み込みに失敗しました:", error);
        return 0;
    }
}

/**
 * 新しいスコアが現在のハイスコアより高ければ、データベースに保存し、更新後の値を返します。
 * @param {number} newScore - 新しく記録されたスコア。
 * @returns {Promise<number>} 更新後のハイスコア (newScore または既存のハイスコア)。
 */
export async function saveHighScoreToDB(newScore) {
    if (typeof newScore !== 'number' || newScore < 0) {
        console.warn("Firebase: 無効なスコアが入力されました。", newScore);
        return await loadHighScoreFromDB(); // 既存のスコアを返す
    }
    
    // ロックフラグは gameFlow.js や gameState.js 側で管理するため、ここでは純粋なDB操作に専念
    
    try {
        console.log(`Firebase: ハイスコアをチェック中... (新スコア: ${newScore})`);
        
        // 開発環境での動作テスト用に意図的な遅延を挿入可能
        // await sleep(500);

        const currentHighScore = await loadHighScoreFromDB();

        if (newScore > currentHighScore) {
            console.log(`Firebase: ハイスコアを更新します: ${currentHighScore} -> ${newScore}`);
            
            const scoreRef = ref(database, HIGH_SCORE_PATH);
            // データベースへの書き込み処理
            await set(scoreRef, newScore); 
            
            console.log("Firebase: ハイスコアの保存が完了しました。");
            return newScore;
        } else {
            console.log("Firebase: 新しいスコアはハイスコアを下回っています。更新しません。");
            return currentHighScore;
        }
    } catch (error) {
        // エラー耐性: 書き込み失敗時も、システムを停止させずエラーログのみ出力します。
        console.error("Firebase: ハイスコアの保存に失敗しました:", error);
        // 保存に失敗した場合、既存のスコアを返す
        return await loadHighScoreFromDB();
    }
}