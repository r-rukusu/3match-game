/**
 * @file audioManager.js
 * @description 音声の読み込み、再生、管理を専門に担うモジュール
 *
 * 【設計思想】
 * - 責務の分離: 音声関連のロジックをゲームのコアロジックから完全に分離。
 * - 状態管理: BGMや効果音のAudioオブジェクト、ミュート状態を一元管理。
 * - UXへの配慮: ブラウザの自動再生ポリシーに対応し、ユーザーの初回アクションでオーディオを有効化。
 * また、ミュート設定をlocalStorageに保存し、ユーザー体験の一貫性を保つ。
 * - 堅牢性: 効果音の多重再生に対応するため、再生の都度オーディオ要素のクローンを作成。
 */
import { CONFIG } from './config.js';

// オーディオ要素を格納するオブジェクト
const audios = {
    bgm: null,
    tap: null,
    gameOver: null,
    match: null,
};

// モジュールの状態
let isMuted = false;
let audioContextInitialized = false; // オーディオコンテキストが初期化されたか
const MUTE_STORAGE_KEY = 'game_mute_state';

/**
 * オーディオコンテキストを初期化する
 * ブラウザの自動再生ポリシーにより、ユーザーのインタラクション後に実行する必要がある
 */
function initAudioContext() {
    if (audioContextInitialized) return;
    try {
        // ダミーのAudioContextを作成し、オーディオ再生のロックを解除
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const context = new AudioContext();
            // Safariで特に有効なアンロック処理
            if (context.state === 'suspended') {
                context.resume();
            }
        }
        audioContextInitialized = true;
        console.log('Audio context initialized.');
    } catch (e) {
        console.error('Failed to initialize Audio Context:', e);
    }
}

/**
 * ミュートボタンの表示を更新する
 * @param {HTMLElement} muteButton - ミュートボタンのDOM要素
 */
function updateMuteButtonUI(muteButton) {
    if (!muteButton) return;
    muteButton.textContent = isMuted ? '🔇' : '🔊';
}

/**
 * 音声ファイルを事前に読み込む
 * @returns {Promise<void>} すべての音声ファイルの読み込みが完了したら解決するPromise
 */
export async function preloadAudios() {
    const audioConfig = CONFIG.AUDIO;
    const promises = [
        loadAudio('bgm', audioConfig.BGM_PATH, true, audioConfig.DEFAULT_BGM_VOLUME),
        loadAudio('tap', audioConfig.TAP_SE_PATH, false, audioConfig.DEFAULT_SE_VOLUME),
        loadAudio('match', audioConfig.MATCH_SE_PATH, false, audioConfig.DEFAULT_SE_VOLUME),
        loadAudio('gameOver', audioConfig.GAME_OVER_SE_PATH, false, audioConfig.DEFAULT_SE_VOLUME)
    ];
    await Promise.all(promises);
    console.log('All audios preloaded.');
}

/**
 * 個別の音声ファイルを読み込む内部関数
 * @param {string} name - 管理用の名前 (e.g., 'bgm')
 * @param {string} src - 音声ファイルのパス
 * @param {boolean} loop - ループ再生するか
 * @param {number} volume - デフォルトの音量
 * @returns {Promise<void>}
 */
function loadAudio(name, src, loop, volume) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.volume = volume;
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', (e) => {
            console.error(`Error loading audio: ${name} (${src})`, e);
            reject(e); // エラーが発生しても処理は継続させる
        });
        audios[name] = audio;
    });
}

/**
 * BGMを再生する
 */
export function playBGM() {
    initAudioContext(); // 再生前にコンテキストを初期化
    if (audios.bgm && !isMuted) {
        audios.bgm.currentTime = 0;
        audios.bgm.play().catch(e => console.error("BGM play failed:", e));
    }
}

/**
 * BGMを停止する
 */
export function stopBGM() {
    if (audios.bgm) {
        audios.bgm.pause();
        audios.bgm.currentTime = 0;
    }
}

/**
 * 効果音を再生する
 * @param {'tap' | 'gameover' | 'match'} name - 再生する効果音の名前
 */
export function playSE(name) {
    initAudioContext(); // 再生前にコンテキストを初期化
    if (audios[name] && !isMuted) {
        // 多重再生に対応するため、クローンを作成して再生する
        const se = audios[name].cloneNode();
        se.volume = audios[name].volume;
        se.play().catch(e => console.error(`SE (${name}) play failed:`, e));
    }
}

/**
 * ミュート状態を切り替える
 * @param {HTMLElement} muteButton - UIを更新するためのミュートボタン要素
 */
export function toggleMute(muteButton) {
    isMuted = !isMuted;
    localStorage.setItem(MUTE_STORAGE_KEY, isMuted);
    updateMuteButtonUI(muteButton);

    // BGMの再生/停止を制御
    if (isMuted) {
        audios.bgm.pause();
    } else {
        // ゲームが進行中であればBGMを再生
        if (!audios.bgm.paused || audios.bgm.currentTime > 0) {
             audios.bgm.play().catch(e => console.error("BGM play failed after unmute:", e));
        }
    }
}

/**
 * localStorageからミュート設定を読み込み、初期化する
 * @param {HTMLElement} muteButton - UIを更新するためのミュートボタン要素
 */
export function initializeMuteState(muteButton) {
    const savedMuteState = localStorage.getItem(MUTE_STORAGE_KEY);
    isMuted = savedMuteState === 'true';
    updateMuteButtonUI(muteButton);
}