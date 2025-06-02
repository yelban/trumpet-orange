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
    
    // 取得所有主題類別列表
    const ALL_THEME_CLASSES = Object.keys(THEMES);

    // 從 storage 讀取當前主題設定
    async function loadSavedTheme() {
      try {
        const result = await browser.storage.local.get(THEME_STORAGE_KEY);
        if (result && result[THEME_STORAGE_KEY] && THEMES[result[THEME_STORAGE_KEY]]) {
          currentThemeKey = result[THEME_STORAGE_KEY];
          logDebug(`Content: 已從 storage 載入主題設定: ${currentThemeKey}`);
          return true;
        } else {
          currentThemeKey = DEFAULT_THEME_KEY;
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

      // 添加浮動面板樣式
      cssContent += `
        /* 浮動面板樣式 */
        .ai-talk {
          position: fixed;
          inset: 0 0 0 auto;
          width: 300px;
          height: fit-content;
          margin-block: auto;
          max-height: 80vh;
          background: #000;
          box-shadow: 0 0 10px #0002;
          border-radius: 8px 0 0 8px;
          padding: 1ex;
          z-index: 99;
          overflow-y: auto;
          translate: calc(100% - 1.5em) 0;
          opacity: 1;
          transition: translate 0.3s, opacity 1s;
        }
        .ai-talk:hover {
          translate: 0;
        }
        .ai-talk:has(ul:empty) {
          opacity: 0;
        }
        .ai-talk ul {
          list-style: disc;
          padding: 0 0 0 1em;
          margin: 0;
        }
        .ai-talk li {
          margin: 0;
          color: #fff;
        }
        .ai-talk a {
          color: #fff;
          text-decoration: none;
          display: flex;
          padding: 5px;
          border-radius: 4px;
        }
        .ai-talk a:hover {
          background: #fff;
          color: #000;
        }
      `;
      
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

    // ========== 浮動面板功能 ==========
    
    // 檢查浮動面板是否已存在
    const checkFloatingPanelExists = (): boolean => {
      return document.querySelector('.ai-talk') !== null;
    };

    // 創建浮動面板元素
    const createFloatingPanel = (): void => {
      if (checkFloatingPanelExists()) return;

      const container = document.createElement('div');
      container.className = 'ai-talk';

      const ul = document.createElement('ul');
      container.appendChild(ul);

      document.body.appendChild(container);
      logDebug('Content: 已創建浮動面板');
    };

    // 為單個訊息創建目錄項目
    const createMessageItem = (messageEl: Element, index: number): HTMLLIElement => {
      const text = messageEl.textContent?.trim() || '';
      const preview = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      const anchorId = `message-${index}`;
      messageEl.id = anchorId;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${anchorId}`;
      a.textContent = preview;

      a.addEventListener('click', (evt) => {
        evt.preventDefault();
        messageEl.scrollIntoView({ behavior: 'smooth' });
      });

      li.appendChild(a);
      return li;
    };

    // 更新浮動面板內容
    const updateFloatingPanel = (): void => {
      try {
        if (!checkFloatingPanelExists()) {
          createFloatingPanel();
        }

        const container = document.querySelector('.ai-talk');
        const ul = container?.querySelector('ul');
        if (!ul) return;

        ul.innerHTML = '';

        const currentURL = window.location.hostname;
        let messageElements: NodeListOf<Element> | null = null;

        // 根據網站選擇適當的選擇器
        if (currentURL.includes('chatgpt.com')) {
          messageElements = document.querySelectorAll('[data-message-author-role="user"]');
        } else if (currentURL.includes('grok.com')) {
          messageElements = document.querySelectorAll('.items-end .bg-surface-l2');
        }

        if (messageElements && messageElements.length > 0) {
          const fragment = document.createDocumentFragment();
          messageElements.forEach((msgEl, idx) => {
            fragment.appendChild(createMessageItem(msgEl, idx));
          });
          ul.appendChild(fragment);
          logDebug(`Content: 浮動面板已更新，共 ${messageElements.length} 條訊息`);
        }
      } catch (error) {
        logDebug('Content: 更新浮動面板時發生錯誤', error);
      }
    };

    // 設置 fetch 攔截
    const setupFetchInterception = (): void => {
      // 保存原始 fetch
      if (!(window as any)._originalFetch) {
        (window as any)._originalFetch = window.fetch;
      }
      const originalFetch = (window as any)._originalFetch;

      window.fetch = async function(...args: any[]) {
        try {
          const urlStr = typeof args[0] === 'string'
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : '';

          const currentURL = window.location.hostname;

          // 根據網站攔截相應的 API 請求
          let shouldIntercept = false;
          if (currentURL.includes('chatgpt.com') && urlStr.includes('/backend-api/conversation')) {
            shouldIntercept = true;
          } else if (currentURL.includes('grok.com') && 
                     (urlStr.includes('/rest/app-chat/conversations') || 
                      urlStr.includes('/rest/app-chat/conversations/new'))) {
            shouldIntercept = true;
          }

          if (shouldIntercept) {
            logDebug('Content: 攔截到 API 請求', urlStr);
            const response = await originalFetch.apply(this, args);
            setTimeout(updateFloatingPanel, 500);
            return response;
          }

          return originalFetch.apply(this, args);
        } catch (error) {
          logDebug('Content: fetch 請求失敗', error);
          throw error;
        }
      };
    };

    // 設置點擊事件監聽
    const setupClickListeners = (): void => {
      const sidebar = document.querySelector('#sidebar');
      const newChatBtn = document.querySelector('[data-testid="create-new-chat-button"]');

      const clickHandler = (e: Event) => {
        const target = e.target as Element;
        const link = target.closest('a');
        if (
          (link && sidebar?.contains(link)) ||
          target.closest('[data-testid="create-new-chat-button"]')
        ) {
          setTimeout(updateFloatingPanel, 1000);
        }
      };

      sidebar?.removeEventListener('click', clickHandler);
      newChatBtn?.removeEventListener('click', clickHandler);
      sidebar?.addEventListener('click', clickHandler);
      newChatBtn?.addEventListener('click', clickHandler);
    };

    // 初始化浮動面板功能
    const initializeFloatingPanel = (): void => {
      const currentURL = window.location.hostname;
      
      // 只在支援的網站啟用浮動面板
      if (currentURL.includes('chatgpt.com') || currentURL.includes('grok.com')) {
        createFloatingPanel();
        updateFloatingPanel();
        setupFetchInterception();
        setupClickListeners();
        logDebug('Content: 浮動面板功能已初始化');
      }
    };

    // 添加自定義介面
    interface CustomMutationObserver extends MutationObserver {
      throttleTimeout?: ReturnType<typeof setTimeout>;
    }

    // 設置 MutationObserver 監聽 DOM 變化
    function setupMutationObserver() {
      // 監聽新訊息
      const observer = new MutationObserver(() => {
        // 為了避免過於頻繁地套用樣式，使用節流函數
        if ((observer as CustomMutationObserver).throttleTimeout) return;
        (observer as CustomMutationObserver).throttleTimeout = setTimeout(() => {
          applyStyles(); // 使用當前保存的主題
          updateFloatingPanel(); // 更新浮動面板
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
        
        try {
          initializeTheme().then(() => {
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

      // 初始化浮動面板功能
      setTimeout(() => {
        initializeFloatingPanel();
      }, 3000);
      
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
    browser.runtime.onMessage.addListener((message: any) => {
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