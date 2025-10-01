/**
 * config.js
 * ゲーム全体の設定値を一元管理するモジュール
 */

// 設定オブジェクトをエクスポート
export const CONFIG = {
    STORAGE_KEY: 'matchGameHighScore',
    LEVEL_UP_EXP_BASE: 100,
    CLEAR_IMAGE_NAME: 'clear.png',
    IMAGE_NAMES: ['1.png', '2.png', '3.png', '4.png', '5.png'],
    IMAGE_PATH: './img/',
    DUMMY_IMAGE_SRC: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    ANIMATION_DURATION: 300,
    COMBO_BONUS_MULTIPLIER: 0.1,
    SWIPE_THRESHOLD: 10,
    INIT_LOOP_SAFETY_LIMIT: 500,
    MODES: {
        easy:   { GRID_SIZE: 6, GAME_TIME_SECONDS: 60, CLEAR_SCORE_THRESHOLD: 4000 },
        normal: { GRID_SIZE: 8, GAME_TIME_SECONDS: 60, CLEAR_SCORE_THRESHOLD: 4000 },
    },
    SPECIAL_PIECES: {
        LINE_BOMB: { type: 'line_bomb', className: 'line-bomb', creationCondition: { type: 'match', length: 4 } },
        BOMB: { type: 'bomb', className: 'bomb', creationCondition: { type: 'shape', shape: ['L', 'T'] } },
        CROSS_BOMB: { type: 'cross_bomb', className: 'cross-bomb', creationCondition: { type: 'shape', shape: ['cross'] } },
    }
};