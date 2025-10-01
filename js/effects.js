/**
 * effects.js - 演出効果専門モジュール
 * * 概要:
 * このモジュールは、ゲーム内の視覚的な演出（エフェクト）に関するロジックをすべて担当します。
 * パーティクルの生成、画面シェイク、アニメーションなどを管理し、UIの描画更新(ui.js)から
 * 独立させることで、責務を明確に分離し、保守性と拡張性を高めます。
 * * 主な機能:
 * - ピースが消える際のパーティクルエフェクト
 * - コンボ発生時の画面シェイクとフラッシュエフェクト
 * - レベルアップ時のアニメーション
 * * 設計思想:
 * - パフォーマンスを考慮し、アニメーションの主制御はCSSに委譲します。
 * JavaScriptは、適切なタイミングでDOM要素にCSSクラスを追加・削除する役割に徹します。
 * - 各演出はPromiseを返すように設計されており、async/awaitを用いて
 * 「演出の完了を待ってから次の処理へ進む」といった非同期処理を簡潔に記述できます。
 * - 設定値はconfig.jsから受け取り、マジックナンバーを排除しています。
 */

import { dom } from './dom.js';
import { CONFIG } from './config.js';

/**
 * 指定された要素（セル）の中心からパーティクルを放射状に放出するエフェクトを再生します。
 * @param {HTMLElement} cellElement パーティクルを発生させる中心となるセルのDOM要素
 */
export function playParticleEffect(cellElement) {
    if (!cellElement) return;

    const rect = cellElement.getBoundingClientRect();
    const containerRect = dom.gridContainer.getBoundingClientRect();

    // セルのコンテナ内での相対座標を計算
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;

    for (let i = 0; i < CONFIG.effects.particle.count; i++) {
        createParticle(x, y);
    }
}

/**
 * パーティクル要素を1つ生成し、アニメーションを開始します。
 * アニメーション終了後に自動的にDOMから削除されます。
@param {number} x - 生成位置のX座標
@param {number} y - 生成位置のY座標
 */
function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    dom.gridContainer.appendChild(particle);

    const size = Math.random() * CONFIG.effects.particle.maxSize + CONFIG.effects.particle.minSize;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * CONFIG.effects.particle.distance;
    
    // 初期スタイル設定
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = CONFIG.effects.particle.colors[Math.floor(Math.random() * CONFIG.effects.particle.colors.length)];

    // アニメーション実行
    // requestAnimationFrameを挟むことで、要素がDOMに追加された後の描画フレームで
    // transformが適用され、CSSトランジションが確実に発火します。
    requestAnimationFrame(() => {
        const translateX = x + Math.cos(angle) * distance;
        const translateY = y + Math.sin(angle) * distance;
        particle.style.transform = `translate(-50%, -50%) translate(${translateX - x}px, ${translateY - y}px) scale(0)`;
        particle.style.opacity = '0';
    });

    // アニメーション終了後に要素を削除
    setTimeout(() => {
        particle.remove();
    }, CONFIG.effects.particle.duration);
}

/**
 * 画面全体を揺らすシェイクエフェクトを再生します。
 * @returns {Promise<void>} アニメーション完了時に解決されるPromise
 */
export function playScreenShake() {
    return new Promise(resolve => {
        dom.gameContainer.classList.add('screen-shake');
        setTimeout(() => {
            dom.gameContainer.classList.remove('screen-shake');
            resolve();
        }, CONFIG.effects.screenShake.duration);
    });
}

/**
 * コンボ数をアニメーション付きで表示します。
 * @param {number} comboCount - 表示するコンボ数
 */
export function showComboDisplay(comboCount) {
    if (comboCount < 2) return;

    dom.comboDisplay.textContent = `${comboCount} COMBO!`;
    dom.comboDisplay.classList.add('show');
    
    // アニメーション後に非表示にする
    setTimeout(() => {
        dom.comboDisplay.classList.remove('show');
    }, CONFIG.effects.combo.duration);
}