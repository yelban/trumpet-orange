import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    manifest: {
        // 確保至少有一個 name
        name: '__MSG_appName__',
        description: '__MSG_appDescription__',
        default_locale: 'en',
        // 加入必要的權限
        permissions: [
          "tabs", // 允許 Background Script 查詢和發送訊息給分頁
          // "activeTab", // 讓擴充功能能訪問當前活躍的標籤頁
          "storage" // 允許使用瀏覽器的儲存功能
        ],
        host_permissions: [
          // "*://*/*" // 允許在所有網站上運行內容腳本
          "https://chatgpt.com/*",
          "https://grok.com/*",
          "https://gemini.google.com/app*"
        ],
        icons: {
          "16": "icon/16.png",
          "32": "icon/32.png",
          "48": "icon/48.png",
          "96": "icon/96.png",
          "128": "icon/128.png",
          "256": "icon/256.png",
          "512": "icon/512.png"
        }
    }
});
