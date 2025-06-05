import { DEBUG_MODE, logDebug } from '../components/logger';

export default defineContentScript({
  // 設定要注入的網頁，擴展到更多網站
  matches: [
    'https://chatgpt.com/*',
    'https://grok.com/*',
    'https://gemini.google.com/app*'
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
        // ChatGPT 使用多個候選選擇器，因為結構可能會變化
        const candidates = [
          '.bg-token-message-surface', // 舊版選擇器
          '[data-message-author-role="user"] .whitespace-pre-wrap', // 新版用戶訊息
          '[data-message-author-role="user"] .markdown', // 另一種可能的結構
          '[data-message-author-role="user"]', // 最廣泛的用戶訊息容器
          '.group.w-full.text-token-text-primary' // 可能的訊息容器
        ];
        
        for (const candidate of candidates) {
          if (document.querySelector(candidate)) {
            logDebug(`ChatGPT: 使用選擇器 ${candidate}`);
            return candidate;
          }
        }
        
        logDebug('ChatGPT: 未找到任何有效選擇器');
        return null;
      } else if (currentURL.includes('grok.com')) {
        // Grok 也使用多個候選選擇器
        const candidates = [
          '.items-end .bg-surface-l2', // 原始選擇器
          '.user-message .bg-surface-l2', // 可能的新結構
          '.message-user .bg-surface-l2', // 另一種可能的結構
          '.bg-surface-l2', // 最廣泛的選擇器
          '[data-role="user"]' // 用戶角色標識
        ];
        
        for (const candidate of candidates) {
          if (document.querySelector(candidate)) {
            logDebug(`Grok: 使用選擇器 ${candidate}`);
            return candidate;
          }
        }
        
        logDebug('Grok: 未找到任何有效選擇器');
        return null;
      } else if (currentURL.includes('gemini.google.com')) {
        return '.user-query-bubble-with-background.ng-star-inserted';
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
      let allElements = document.querySelectorAll(selector);
      
      // 根據網站進行額外過濾
      const currentURL = window.location.hostname;
      if (currentURL.includes('chatgpt.com') && (selector === '.group.w-full.text-token-text-primary' || selector === '.bg-token-message-surface')) {
        // 對於 ChatGPT 的廣泛選擇器，過濾出用戶訊息
        allElements = Array.from(allElements).filter(el => {
          return el.closest('[data-message-author-role="user"]') !== null ||
                 el.getAttribute('data-message-author-role') === 'user';
        }) as unknown as NodeListOf<Element>;
      } else if (currentURL.includes('grok.com') && selector === '.bg-surface-l2') {
        // 對於 Grok 的廣泛選擇器，過濾出用戶訊息
        allElements = Array.from(allElements).filter(el => {
          return el.closest('.items-end') !== null ||
                 el.closest('[data-role="user"]') !== null;
        }) as unknown as NodeListOf<Element>;
      }
      
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
      let allElements = document.querySelectorAll(selector);
      
      // 根據網站進行額外過濾
      const currentURL = window.location.hostname;
      if (currentURL.includes('chatgpt.com') && (selector === '.group.w-full.text-token-text-primary' || selector === '.bg-token-message-surface')) {
        // 對於 ChatGPT 的廣泛選擇器，過濾出用戶訊息
        allElements = Array.from(allElements).filter(el => {
          return el.closest('[data-message-author-role="user"]') !== null ||
                 el.getAttribute('data-message-author-role') === 'user';
        }) as unknown as NodeListOf<Element>;
      } else if (currentURL.includes('grok.com') && selector === '.bg-surface-l2') {
        // 對於 Grok 的廣泛選擇器，過濾出用戶訊息
        allElements = Array.from(allElements).filter(el => {
          return el.closest('.items-end') !== null ||
                 el.closest('[data-role="user"]') !== null;
        }) as unknown as NodeListOf<Element>;
      }
      
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
      const anchorId = `tro-msg-${Date.now()}-${index}`;
      
      // 只在元素還沒有我們的 ID 時才設定
      if (!messageEl.id || !messageEl.id.startsWith('tro-msg-')) {
        messageEl.id = anchorId;
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${messageEl.id}`; // 使用實際的 ID
      a.textContent = preview;

      a.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        
        logDebug(`Content: 點擊浮動面板項目，目標 ID: ${messageEl.id}`);
        
        // 添加點擊視覺反饋
        a.style.backgroundColor = '#007acc';
        a.style.color = '#fff';
        setTimeout(() => {
          a.style.backgroundColor = '';
          a.style.color = '';
        }, 200);
        
        // 定義滾動函數
        const scrollToTarget = (element: Element, retryCount: number = 0) => {
          if (retryCount > 3) {
            logDebug('Content: 滾動重試次數超限，停止嘗試');
            return;
          }
          
          try {
            // 確保元素仍然在 DOM 中
            if (!document.contains(element)) {
              logDebug('Content: 元素已不在 DOM 中，嘗試重新查找');
              const newTarget = document.getElementById(messageEl.id);
              if (newTarget) {
                scrollToTarget(newTarget, retryCount + 1);
              }
              return;
            }
            
            // 執行滾動
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest' 
            });
            
            logDebug(`Content: 滾動到元素 ${element.id}，重試次數: ${retryCount}`);
            
            // 檢查滾動是否成功
            setTimeout(() => {
              if (!isElementInViewport(element) && retryCount < 3) {
                logDebug('Content: 滾動未成功，嘗試 instant 滾動');
                element.scrollIntoView({ 
                  behavior: 'instant', 
                  block: 'center' 
                });
              }
            }, 500);
            
          } catch (error) {
            logDebug('Content: 滾動時發生錯誤', error);
            if (retryCount < 3) {
              setTimeout(() => scrollToTarget(element, retryCount + 1), 300);
            }
          }
        };
        
        // 首先嘗試使用 ID 查找最新的元素
        const targetElement = document.getElementById(messageEl.id);
        if (targetElement) {
          scrollToTarget(targetElement);
        } else {
          // 如果 ID 查找失敗，嘗試使用原始元素引用
          logDebug('Content: 使用 ID 未找到目標元素，使用原始引用');
          scrollToTarget(messageEl);
        }
      });

      li.appendChild(a);
      return li;
    };

    // 檢查元素是否在視窗中可見
    const isElementInViewport = (el: Element): boolean => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
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

        const currentURL = window.location.hostname;
        let messageElements: NodeListOf<Element> | null = null;

        // 根據網站選擇適當的選擇器
        if (currentURL.includes('chatgpt.com')) {
          // ChatGPT 使用多個候選選擇器來查找用戶訊息
          const candidates = [
            '[data-message-author-role="user"]', // 最常用的選擇器
            '.bg-token-message-surface', // 舊版選擇器
            '.group.w-full.text-token-text-primary', // 可能的訊息容器
            '[data-testid="user-message"]' // 可能的測試標識
          ];
          
          for (const candidate of candidates) {
            const elements = document.querySelectorAll(candidate);
            if (elements.length > 0) {
              messageElements = elements;
              logDebug(`ChatGPT 浮動面板: 使用選擇器 ${candidate}，找到 ${elements.length} 個元素`);
              break;
            }
          }
        } else if (currentURL.includes('grok.com')) {
          // Grok 使用多個候選選擇器
          const candidates = [
            '.items-end .bg-surface-l2', // 原始選擇器
            '.user-message .bg-surface-l2', // 可能的新結構
            '.bg-surface-l2', // 最廣泛的選擇器
            '[data-role="user"]' // 用戶角色標識
          ];
          
          for (const candidate of candidates) {
            const elements = document.querySelectorAll(candidate);
            if (elements.length > 0) {
              messageElements = elements;
              logDebug(`Grok 浮動面板: 使用選擇器 ${candidate}，找到 ${elements.length} 個元素`);
              break;
            }
          }
        } else if (currentURL.includes('gemini.google.com')) {
          messageElements = document.querySelectorAll('.user-query-bubble-with-background.ng-star-inserted');
        }

        if (messageElements && messageElements.length > 0) {
          // 收集當前所有訊息的唯一標識
          const currentMessages = Array.from(messageElements).map(el => ({
            element: el,
            text: el.textContent?.trim() || '',
            hasId: el.id && el.id.startsWith('tro-msg-')
          }));

          // 只有在訊息數量或內容發生變化時才更新面板
          const existingItems = ul.querySelectorAll('li');
          const needsUpdate = existingItems.length !== currentMessages.length ||
                             currentMessages.some((msg, idx) => {
                               const existingText = existingItems[idx]?.textContent?.trim() || '';
                               const currentText = msg.text.length > 30 ? `${msg.text.slice(0, 30)}...` : msg.text;
                               return existingText !== currentText;
                             });

          if (needsUpdate) {
            ul.innerHTML = '';
            const fragment = document.createDocumentFragment();
            
            currentMessages.forEach((msgData, idx) => {
              fragment.appendChild(createMessageItem(msgData.element, idx));
            });
            
            ul.appendChild(fragment);
            logDebug(`Content: 浮動面板已更新，共 ${currentMessages.length} 條訊息`);
          }
        } else {
          // 如果沒有訊息，清空面板
          if (ul.children.length > 0) {
            ul.innerHTML = '';
            logDebug('Content: 沒有找到訊息，已清空浮動面板');
          }
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
          } else if (currentURL.includes('gemini.google.com') &&
                     urlStr.includes('generativelanguage.googleapis.com')) {
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

    // 設置滾動事件監聽，用於修復高亮消失問題
    const setupScrollListener = (): void => {
      let scrollTimeout: ReturnType<typeof setTimeout>;
      
      const scrollHandler = () => {
        // 清除之前的計時器
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        // 設置新的計時器，在滾動停止後重新套用樣式
        scrollTimeout = setTimeout(() => {
          // 通用的滾動後樣式修復
          logDebug('Content: 滾動停止，重新套用樣式');
          applyStyles();
          updateFloatingPanel();
        }, 200); // 滾動停止 200ms 後執行
      };

      // 監聽視窗滾動事件
      window.addEventListener('scroll', scrollHandler, { passive: true });
      
      // 也監聽可能的滾動容器
      const scrollContainers = document.querySelectorAll('.scrollable, .overflow-auto, .overflow-y-auto');
      scrollContainers.forEach(container => {
        container.addEventListener('scroll', scrollHandler, { passive: true });
      });
    };

    // 初始化浮動面板功能
    const initializeFloatingPanel = (): void => {
      const currentURL = window.location.hostname;
      
      // 只在支援的網站啟用浮動面板
      if (
        currentURL.includes('chatgpt.com') ||
        currentURL.includes('grok.com') ||
        currentURL.includes('gemini.google.com')
      ) {
        createFloatingPanel();
        updateFloatingPanel();
        setupFetchInterception();
        setupClickListeners();
        setupScrollListener(); // 新增滾動監聽器
        logDebug('Content: 浮動面板功能已初始化');
      }
    };

    // 添加自定義介面
    interface CustomMutationObserver extends MutationObserver {
      throttleTimeout?: ReturnType<typeof setTimeout>;
    }

    // 設置表單提交和按鍵監聽器 - 更有效率的事件驅動模式
    function setupFormSubmissionListeners() {
      const currentURL = window.location.hostname;
      let submitTimeout: ReturnType<typeof setTimeout>;
      
      const handleMessageSubmission = () => {
        // 防止短時間內重複觸發
        if (submitTimeout) {
          clearTimeout(submitTimeout);
        }
        
        submitTimeout = setTimeout(() => {
          logDebug('Content: 檢測到訊息提交，更新樣式和浮動面板');
          applyStyles();
          updateFloatingPanel();
        }, 500); // 等待 DOM 更新完成
      };

      // 監聽表單提交事件
      document.addEventListener('submit', (e) => {
        const form = e.target as HTMLFormElement;
        if (form && form.tagName === 'FORM') {
          logDebug('Content: 檢測到表單提交');
          handleMessageSubmission();
        }
      });

      // 監聽 Enter 鍵提交 (針對不同網站的輸入框)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const target = e.target as HTMLElement;
          
          // 檢查是否在相關的輸入區域
          if (target && (
            target.tagName === 'TEXTAREA' ||
            target.contentEditable === 'true' ||
            target.closest('[contenteditable="true"]') ||
            target.closest('form') ||
            target.closest('.input-area') ||
            target.closest('.message-input')
          )) {
            logDebug('Content: 檢測到 Enter 鍵提交');
            handleMessageSubmission();
          }
        }
      });

      // 針對特定網站的提交按鈕點擊監聽
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        let isSubmitButton = false;

        if (currentURL.includes('chatgpt.com')) {
          isSubmitButton = target.closest('[data-testid="send-button"]') !== null;
        } else if (currentURL.includes('grok.com')) {
          isSubmitButton = target.closest('button[type="submit"]') !== null ||
                          target.closest('.send-button') !== null;
        } else if (currentURL.includes('gemini.google.com')) {
          isSubmitButton = target.closest('button[aria-label*="Send"]') !== null ||
                          target.closest('.send-button') !== null;
        }

        if (isSubmitButton) {
          logDebug('Content: 檢測到提交按鈕點擊');
          handleMessageSubmission();
        }
      });
    }

    // 輕量級 MutationObserver 作為備用 - 只監聽關鍵變化
    function setupLightweightObserver() {
      const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 檢查是否有新的訊息容器或相關元素被添加
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                const currentURL = window.location.hostname;
                
                // 檢查是否添加了新的訊息相關元素或包含訊息的容器
                if (
                  (currentURL.includes('chatgpt.com') && (
                    element.closest('[data-message-author-role="user"]') ||
                    element.querySelector('[data-message-author-role="user"]') ||
                    element.matches('.bg-token-message-surface')
                  )) ||
                  (currentURL.includes('grok.com') && (
                    element.closest('.bg-surface-l2') ||
                    element.querySelector('.bg-surface-l2')
                  )) ||
                  (currentURL.includes('gemini.google.com') && (
                    element.closest('.user-query-bubble-with-background') ||
                    element.querySelector('.user-query-bubble-with-background')
                  ))
                ) {
                  needsUpdate = true;
                }
              }
            });
          }
        });

        if (needsUpdate && !(observer as CustomMutationObserver).throttleTimeout) {
          (observer as CustomMutationObserver).throttleTimeout = setTimeout(() => {
            logDebug('Content: 輕量級觀察器檢測到新內容，更新樣式');
            applyStyles();
            updateFloatingPanel();
            delete (observer as CustomMutationObserver).throttleTimeout;
          }, 200);
        }
      }) as CustomMutationObserver;

      // 只觀察訊息容器的變化，減少監聽範圍
      const messageContainers = document.querySelectorAll(
        '.conversation, .chat-container, .messages, .message-list, main'
      );
      
      if (messageContainers.length > 0) {
        messageContainers.forEach(container => {
          observer.observe(container, {
            childList: true,
            subtree: true
          });
        });
      } else {
        // 如果找不到特定容器，監聽 body 但減少監聽選項
        observer.observe(document.body, {
          childList: true,
          subtree: false // 不監聽子樹，減少資源消耗
        });
      }
      
      logDebug('Content: 已設置輕量級觀察器');
    }

    // 頁面載入完成後的自動上色
    const initialPageStyling = () => {
      // 等待頁面內容載入後立即套用樣式
      const applyInitialStyles = () => {
        logDebug('Content: 執行頁面載入後的自動上色');
        applyStyles();
        updateFloatingPanel();
      };

      // 多次嘗試確保捕獲到動態載入的內容
      setTimeout(applyInitialStyles, 1000); // 1秒後
      setTimeout(applyInitialStyles, 3000); // 3秒後
      setTimeout(applyInitialStyles, 5000); // 5秒後 (確保所有動態內容都載入)
    };

    // 確保初始化在 DOM 載入完成後執行
    const setupExtension = () => {
      logDebug('Content: DOM 已載入，開始設置擴充功能');
      
      // 初始化主題並監聽 DOM 變化
      setTimeout(() => {
        logDebug('Content: 準備初始化主題');
        
        try {
          initializeTheme().then(() => {
            logDebug('Content: 初始化主題成功');
            // 主題初始化完成後立即執行自動上色
            initialPageStyling();
          });
        } catch (error) {
          logDebug('Content: 初始化主題失敗', error);
          // 只有在第一次初始化失敗時才嘗試第二次
          setTimeout(() => {
            logDebug('Content: 初次失敗，再次嘗試初始化主題');
            initializeTheme().then(() => {
              initialPageStyling();
            });
          }, 3000);
        }
      }, 2000);

      // 初始化浮動面板功能
      setTimeout(() => {
        initializeFloatingPanel();
      }, 3000);
      
      // 設置事件驅動的監聽系統 (更有效率)
      setupFormSubmissionListeners();
      
      // 設置輕量級觀察器作為備用
      setupLightweightObserver();
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