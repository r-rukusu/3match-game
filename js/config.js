/**
 * config.js
 * ゲーム全体の設定値を一元管理するモジュール
 */

// 設定オブジェクトをエクスポート
export const CONFIG = {
    STORAGE_KEY: 'matchGameHighScore',
    LEVEL_UP_EXP_BASE: 40,
    CLEAR_IMAGE_NAME: 'clear.png',
    IMAGE_NAMES: ['1.png', '2.png', '3.png', '4.png', '5.png'],
    IMAGE_PATH: './img/',
    DUMMY_IMAGE_SRC: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    ANIMATION_DURATION: 300,
    COMBO_BONUS_MULTIPLIER: 0.1,
    SWIPE_THRESHOLD: 10,
    INIT_LOOP_SAFETY_LIMIT: 500,
    STORAGE_KEYS: { // <--- [追加] 新しいキーを定義
        LOCAL_HIGH_SCORE_PREFIX: 'user_high_score_', // ユーザー自己ベスト用のローカルストレージキー
    },
    MODES: {
        easy:   { GRID_SIZE: 6, GAME_TIME_SECONDS: 60, CLEAR_SCORE_THRESHOLD: 5000, SCORE_MULTIPLIER: 2.0  },
        normal: { GRID_SIZE: 8, GAME_TIME_SECONDS: 60, CLEAR_SCORE_THRESHOLD: 5000, SCORE_MULTIPLIER: 1.0  },
    },
    SPECIAL_PIECES: {
        CROSS_RAINBOW: { type: 'cross_rainbow', className: 'cross-rainbow', creationCondition: { type: 'match', length: 5 } },
        LINE_BOMB: { type: 'line_bomb', className: 'line-bomb', creationCondition: { type: 'match', length: 4 } },
        BOMB: { type: 'bomb', className: 'bomb', creationCondition: { type: 'shape', shape: ['L', 'T'] } },
        CROSS_BOMB: { type: 'cross_bomb', className: 'cross-bomb', creationCondition: { type: 'shape', shape: ['cross'] } },
    },
    /**
     * 演出（エフェクト）に関する設定
     */
    effects: {
        // パーティクルエフェクトの設定
        particle: {
            count: 10, // 1回のマッチで放出されるパーティクルの数
            minSize: 5,  // パーティクルの最小サイズ (px)
            maxSize: 15, // パーティクルの最大サイズ (px)
            distance: 80, // パーティクルの飛距離 (px)
            duration: 600, // アニメーション時間 (ms)
            colors: ['#ffc107', '#ff85a2', '#8effa9', '#81c3d7'], // パーティクルの色のリスト
            timeBarStartColor: '#0cbaffff', // Green (High)
            timeBarMiddleColor: '#f707ff', // Yellow (Middle)
            timeBarEndColor: '#dc35a2', // Red (Low)
        },
        // 画面シェイクの設定
        screenShake: {
            duration: 600 // アニメーション時間 (ms)
        },
        // コンボ表示の設定
        combo: {
            duration: 1000 // 表示時間 (ms)
        }
    },
    AUDIO: {
        BGM_PATH: './audio/bgm.wav',
        TAP_SE_PATH: './audio/tap.mp3',
        GAME_OVER_SE_PATH: './audio/gameover.mp3',
        MATCH_SE_PATH: './audio/match.mp3',
        DEFAULT_BGM_VOLUME: 0.3,  // BGMの音量 (0.0 to 1.0)
        DEFAULT_SE_VOLUME: 0.6,   // 効果音の音量 (0.0 to 1.0)
    },

    FIREBASE_CONFIG: {
        apiKey: "AIzaSyAFqYPXeZHCwopZiA0WExfAtukQw3LVf_U",
        authDomain: "match-game-rks.firebaseapp.com",
        databaseURL: "https://match-game-rks-default-rtdb.firebaseio.com/", // データべースのリージョンに注意
        projectId: "match-game-rks",
        storageBucket: "match-game-rks.firebasestorage.app",
        messagingSenderId: "781079705187",
        appId: "1:781079705187:web:6dc504523e986a215c6a56"
    },
};