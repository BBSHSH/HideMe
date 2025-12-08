// utils/animations.js
import { useEffect } from 'react';

/**
 * フェードインアニメーション
 * @param {string} selector - 対象のCSSセレクタ
 */
export const fadeInPanels = (selector) => {
  useEffect(() => {
    const panels = document.querySelectorAll(selector);
    panels.forEach((panel, idx) => {
      panel.style.opacity = 0;
      panel.style.transform = 'translateY(20px)';
      setTimeout(() => {
        panel.style.transition = 'all 0.6s ease-out';
        panel.style.opacity = 1;
        panel.style.transform = 'translateY(0)';
      }, idx * 100);
    });
  }, [selector]);
};

/**
 * ボタンクリック時の押し込みアニメーション
 * @param {HTMLElement} btn - ボタン要素
 */
export const buttonClickAnimation = (btn) => {
  if (!btn) return;
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
  }, 100);
};
