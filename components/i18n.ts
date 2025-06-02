/// <reference types="chrome" />

/**
 * 國際化輔助函數
 * 使用瀏覽器API獲取翻譯後的字符串
 * 
 * @param messageName 消息名稱
 * @param substitutions 替換參數（可選）
 * @returns 翻譯後的字符串
 */
export function getMessage(messageName: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(messageName, substitutions);
}

/**
 * 取得目前的瀏覽器語言
 * @returns 當前瀏覽器語言代碼
 */
export function getCurrentLanguage(): string {
  return chrome.i18n.getUILanguage();
}

/**
 * 初始化頁面中的i18n字符串
 * 自動替換所有有i18n-msg屬性的元素內容
 */
export function initI18n(): void {
  document.querySelectorAll('[i18n-msg]').forEach(element => {
    const msgKey = element.getAttribute('i18n-msg');
    if (msgKey) {
      element.textContent = getMessage(msgKey);
    }
  });
}

/**
 * 用於初始化包含佔位符的i18n字符串
 * 例如：<span i18n-msg-format="welcomeUser" i18n-msg-args="John"></span>
 */
export function initI18nWithFormat(): void {
  document.querySelectorAll('[i18n-msg-format]').forEach(element => {
    const msgKey = element.getAttribute('i18n-msg-format');
    const msgArgs = element.getAttribute('i18n-msg-args');
    if (msgKey && msgArgs) {
      const args = msgArgs.split(',').map(arg => arg.trim());
      element.textContent = getMessage(msgKey, args);
    }
  });
}

/**
 * 頁面初始化時執行的函數，處理所有i18n相關的初始化
 */
export function setupI18n(): void {
  initI18n();
  initI18nWithFormat();
} 