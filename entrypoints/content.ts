import { DEBUG_MODE, logDebug } from '../components/logger';

export default defineContentScript({
  // 設定要注入的網頁，擴展到更多網站
  matches: [
    'https://chatgpt.com/*',
    'https://grok.com/*',
    'https://gemini.google.com/app*',
    'https://aistudio.google.com/prompts/*'
  ],

  runAt: 'document_start',

  // Content Script 的主要執行函數
  main() {
    logDebug('Content Script: 已注入到頁面', window.location.href);

    // 主題存儲相關
    const THEME_STORAGE_KEY = 'trumpet-orange-theme';
    
    // 定義主題類型
    type ThemeType = {
      backgroundColor: string;
      color: string;
    };
    
    type ThemesType = {
      [key: string]: ThemeType;
    };

    // 定義兩種主題樣式
    const THEMES: ThemesType = {
      'trx-orange': {
        backgroundColor: '#ffaa00',
        color: '#330000'
      },
      'trx-red': {
        backgroundColor: '#a10000',
        color: '#ffffce'
      }
    };
    
    // 預設主題
    const DEFAULT_THEME_KEY = 'trx-orange';
    
    // 保存當前顏色主題（初始設為預設值，等待從 storage 獲取真正設定）
    let currentThemeKey = DEFAULT_THEME_KEY;
    let currentTheme = THEMES[currentThemeKey];
    
    // 取得所有主題類別列表
    const ALL_THEME_CLASSES = Object.keys(THEMES);

    // 從 storage 讀取當前主題設定
    async function loadSavedTheme() {
      try {
        const result = await browser.storage.local.get(THEME_STORAGE_KEY);
        if (result && result[THEME_STORAGE_KEY] && THEMES[result[THEME_STORAGE_KEY]]) {
          currentThemeKey = result[THEME_STORAGE_KEY];
          currentTheme = THEMES[currentThemeKey];
          logDebug(`Content: 已從 storage 載入主題設定: ${currentThemeKey}`);
          return true;
        } else {
          currentThemeKey = DEFAULT_THEME_KEY;
          currentTheme = THEMES[currentThemeKey];
          // 保存預設主題到 storage 以確保一致性
          await browser.storage.local.set({ [THEME_STORAGE_KEY]: DEFAULT_THEME_KEY });
          logDebug(`Content: 未找到已保存的主題，使用預設值: ${currentThemeKey}`);
          return false;
        }
      } catch (error) {
        logDebug('Content: 讀取主題設定失敗', error);
        return false;
      }
    }

    // 根據當前網站選擇適當的選擇器
    const getCurrentSelector = () => {
      const currentURL = window.location.hostname;
      if (currentURL.includes('chatgpt.com')) {
        return '.bg-token-message-surface';
      } else if (currentURL.includes('grok.com')) {
        return '.items-end .bg-surface-l2';
      } else if (currentURL.includes('gemini.google.com')) {
        return '.user-query-bubble-with-background.ng-star-inserted';
      } else if (currentURL.includes('aistudio.google.com')) {
        return '.user-prompt-container .text-chunk';
      } else {
        logDebug('未知的網站，無法套用高亮');
        return null;
      }
    };

    // 創建並添加全局樣式
    const createGlobalStyle = () => {
      const styleId = 'tro-custom-styles';
      // 如果已經存在則移除舊樣式
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }

      // 創建新樣式元素
      const style = document.createElement('style');
      style.id = styleId;
      
      // 創建所有主題的 CSS 類
      let cssContent = '';
      Object.entries(THEMES).forEach(([key, theme]) => {
        cssContent += `
          .${key} {
            background-color: ${theme.backgroundColor} !important;
            color: ${theme.color} !important;
          }
        `;
      });
      
      style.textContent = cssContent;
      document.head.appendChild(style);
      logDebug('已創建全局樣式');
    };

    // 判斷元素是否已套用任何主題
    const hasAnyThemeClass = (element: Element): boolean => {
      return ALL_THEME_CLASSES.some(themeClass => element.classList.contains(themeClass));
    };

    // 更新主題並保存到 storage - 更改所有已套用主題的元素
    const changeTheme = async (themeKey: string) => {
      if (!THEMES[themeKey]) {
        logDebug(`主題 ${themeKey} 不存在`);
        return;
      }
      
      // 更新當前主題
      currentThemeKey = themeKey;
      currentTheme = THEMES[themeKey];
      
      // 保存到 storage 以確保持久化
      try {
        await browser.storage.local.set({ [THEME_STORAGE_KEY]: themeKey });
        logDebug(`已保存主題 ${themeKey} 到 storage`);
      } catch (error) {
        logDebug('保存主題到 storage 失敗', error);
      }
      
      // 找出所有已套用主題的元素
      const themeSelectors = ALL_THEME_CLASSES.map(cls => `.${cls}`).join(',');
      const elements = document.querySelectorAll(themeSelectors);
      
      elements.forEach(element => {
        // 移除所有主題類
        ALL_THEME_CLASSES.forEach(key => {
          element.classList.remove(key);
        });
        // 添加新主題類
        element.classList.add(themeKey);
      });
      
      logDebug(`已切換到主題: ${themeKey}，共更新 ${elements.length} 個元素`);
    };

    // 重新上色所有匹配元素，包括已套用和未套用主題的元素
    const recolorAllElements = () => {
      const selector = getCurrentSelector();
      if (!selector) return;
      
      // 選擇所有符合選擇器的元素
      const allElements = document.querySelectorAll(selector);
      let updatedCount = 0;
      let newCount = 0;
      
      allElements.forEach(element => {
        if (hasAnyThemeClass(element)) {
          // 已有主題類的元素，先移除再添加當前主題
          ALL_THEME_CLASSES.forEach(key => {
            element.classList.remove(key);
          });
          element.classList.add(currentThemeKey);
          updatedCount++;
        } else {
          // 沒有主題類的新元素
          element.classList.add(currentThemeKey);
          newCount++;
        }
      });
      
      logDebug(`重新上色完成: 更新 ${updatedCount} 個已有元素，新增 ${newCount} 個元素，總計 ${allElements.length} 個元素`);
    };

    // 套用樣式函數 - 只對沒有主題類別的元素應用
    const applyStyles = () => {
      const selector = getCurrentSelector();
      if (!selector) return;
      
      // 選擇所有符合選擇器的元素
      const allElements = document.querySelectorAll(selector);
      
      // 過濾出沒有套用任何主題的元素
      const newElements: Element[] = [];
      allElements.forEach(element => {
        if (!hasAnyThemeClass(element)) {
          element.classList.add(currentThemeKey);
          newElements.push(element);
        }
      });
      
      if (newElements.length > 0) {
        logDebug(`已套用樣式到 ${newElements.length} 個新元素 (選擇器: ${selector})`);
      }
    };

    // 初始化時建立全局樣式並套用
    async function initializeTheme() {
      try {
        // 先從 storage 讀取已保存的主題
        await loadSavedTheme();
        
        // 創建樣式並應用
        createGlobalStyle();
        // 對所有元素進行重新上色，無論它們之前是否已有主題
        recolorAllElements();
      } catch (error) {
        logDebug('Content: 獲取初始顏色主題失敗', error);
      }
    }

    // 添加自定義介面
    interface CustomMutationObserver extends MutationObserver {
      throttleTimeout?: ReturnType<typeof setTimeout>;
    }

    // 設置 MutationObserver 監聽 DOM 變化
    function setupMutationObserver() {
      // 監聽新訊息
      const observer = new MutationObserver(mutations => {
        // 為了避免過於頻繁地套用樣式，使用節流函數
        if ((observer as CustomMutationObserver).throttleTimeout) return;
        (observer as CustomMutationObserver).throttleTimeout = setTimeout(() => {
          applyStyles(); // 使用當前保存的主題
          delete (observer as CustomMutationObserver).throttleTimeout;
        }, 300); // 300毫秒內只執行一次
      }) as CustomMutationObserver;

      // 開始觀察整個文件
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });
      } else {
        logDebug('Body element not found, waiting for DOM content loaded');
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
          });
        });
      }
    }

    // 確保初始化在 DOM 載入完成後執行
    const setupExtension = () => {
      logDebug('Content: DOM 已載入，開始設置擴充功能');
      
      // 初始化主題並監聽 DOM 變化
      setTimeout(() => {
        logDebug('Content: 準備初始化主題');
        // 使用標記來追蹤初始化成功與否
        let initializeSuccess = false;
        
        try {
          initializeTheme().then(() => {
            initializeSuccess = true;
            logDebug('Content: 初始化主題成功');
          });
        } catch (error) {
          logDebug('Content: 初始化主題失敗', error);
          // 只有在第一次初始化失敗時才嘗試第二次
          setTimeout(() => {
            logDebug('Content: 初次失敗，再次嘗試初始化主題');
            initializeTheme();
          }, 3000);
        }
      }, 2000);
      
      // 設置 MutationObserver 監聽 DOM 變化
      setupMutationObserver();
    };

    // 如果 DOM 已經載入完成，立即運行設置；否則等待 DOMContentLoaded 事件
    if (document.readyState === 'loading') {
      logDebug('Content: 等待 DOM 載入完成');
      document.addEventListener('DOMContentLoaded', setupExtension);
    } else {
      logDebug('Content: DOM 已經載入完成，直接開始設置');
      setupExtension();
    }

    // 監聽來自 Background Script 的訊息，用於主題切換
    browser.runtime.onMessage.addListener((message: any, sender: any) => {
      logDebug('Content Script: 收到訊息', message);

      if (message.type === 'CHANGE_THEME' && message.theme) {
        if (message.theme === currentThemeKey) {
          // 如果是當前主題，則執行重新上色以確保所有元素都有主題應用
          logDebug(`Content: 重新應用當前主題 ${message.theme} 到所有元素`);
          recolorAllElements();
        } else {
          // 切換到新主題
          logDebug(`Content: 切換到新主題 ${message.theme}`);
          changeTheme(message.theme);
          // 對尚未套用主題的元素應用新主題
          applyStyles();
        }
        return Promise.resolve({ success: true });
      }
      
      return true;
    });
  },
});