import { DEBUG_MODE, logDebug } from '../components/logger';

export default defineBackground({
  persistent: true, // 確保狀態在背景腳本重新載入時不會丟失
  main() {
    logDebug('Background: 腳本已載入');

    // 主題相關設定
    const THEME_STORAGE_KEY = 'trumpet-orange-theme';
    const DEFAULT_THEME = 'trx-orange'; // 預設主題
    
    // 允許的域名列表 - 與 wxt.config.ts 中的 host_permissions 保持一致
    const ALLOWED_HOSTS = [
      'chatgpt.com',
      'grok.com',
      'gemini.google.com',
      'aistudio.google.com'
    ];
    
    // 檢查URL是否匹配允許的域名
    function isUrlAllowed(url: string): boolean {
      if (!url) return false;
      try {
        const urlObj = new URL(url);
        return ALLOWED_HOSTS.some(host => urlObj.hostname.includes(host));
      } catch (e) {
        return false;
      }
    }
    
    // 設置圖標狀態 (啟用或禁用)
    async function updateIconState(tabId: number, url: string) {
      // 檢查是否在許可的網域中
      const allowed = isUrlAllowed(url);
      
      if (allowed) {
        // 啟用圖標
        await browser.action.enable(tabId);
        // 清除灰色徽章
        await browser.action.setBadgeText({ tabId, text: '' });
      } else {
        // 禁用圖標
        await browser.action.disable(tabId);
        // 可以選擇設置灰色徽章或其他視覺提示
        // await browser.action.setBadgeText({ tabId, text: ' ' });
        // await browser.action.setBadgeBackgroundColor({ tabId, color: '#888888' });
      }
      
      logDebug(`Background: 已更新標籤 ${tabId} 的圖標狀態為 ${allowed ? '啟用' : '禁用'}`);
    }
    
    // 從 storage 中讀取已保存的主題
    async function getCurrentTheme(): Promise<string> {
      try {
        const result = await browser.storage.local.get(THEME_STORAGE_KEY);
        if (result && result[THEME_STORAGE_KEY]) {
          logDebug(`Background: 已從 storage 載入主題: ${result[THEME_STORAGE_KEY]}`);
          return result[THEME_STORAGE_KEY];
        } else {
          logDebug(`Background: 未找到保存的主題，使用預設主題: ${DEFAULT_THEME}`);
          // 將預設主題寫入 storage 以確保一致性
          await browser.storage.local.set({ [THEME_STORAGE_KEY]: DEFAULT_THEME });
          return DEFAULT_THEME;
        }
      } catch (error) {
        logDebug('Background: 讀取主題設定失敗', error);
        return DEFAULT_THEME;
      }
    }
    
    // 保存主題到 storage
    async function saveTheme(theme: string) {
      try {
        await browser.storage.local.set({ [THEME_STORAGE_KEY]: theme });
        logDebug(`Background: 已保存主題 ${theme} 到 storage`);
        return true;
      } catch (error) {
        logDebug('Background: 保存主題設定失敗', error);
        return false;
      }
    }
    
    // 應用主題到所有標籤頁
    async function applyThemeToTabs(theme: string) {
      try {
        // 獲取所有當前活動的標籤頁
        const tabs = await browser.tabs.query({});
        
        // 向所有標籤頁發送主題切換訊息
        const results = await Promise.allSettled(
          tabs.map(tab => {
            if (tab.id) {
              // 僅在允許的域名上應用主題
              if (tab.url && isUrlAllowed(tab.url)) {
                return browser.tabs.sendMessage(tab.id, {
                  type: 'CHANGE_THEME',
                  theme: theme
                }).catch(error => {
                  // 忽略不支援的目標標籤頁錯誤 (不是所有頁面都有 content script)
                  if (!error.toString().includes('Could not establish connection')) {
                    logDebug(`Background: 向標籤頁 ${tab.id} 發送訊息失敗`, error);
                  }
                  return null;
                });
              }
            }
            return Promise.resolve(null);
          })
        );
        
        logDebug(`Background: 已嘗試向 ${tabs.length} 個標籤頁發送主題切換訊息`);
        return { success: true, tabCount: tabs.length };
      } catch (error: unknown) {
        logDebug('Background: 發送主題切換訊息失敗', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }

    // 初始化：載入已保存的主題設定並應用
    (async () => {
      try {
        // 載入已保存的主題設定
        const currentTheme = await getCurrentTheme();
        
        // 向現有標籤頁應用主題
        await applyThemeToTabs(currentTheme);
        
        // 更新所有標籤的圖標狀態
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            await updateIconState(tab.id, tab.url);
          }
        }
      } catch (error) {
        logDebug('Background: 初始套用主題失敗，稍後將重試', error);
      }
    })();

    // 監聽標籤頁更新事件，更新圖標狀態
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // 當頁面URL變更時更新圖標狀態
      if (changeInfo.url) {
        updateIconState(tabId, changeInfo.url);
      }
    });
    
    // 監聽標籤頁激活事件，確保圖標狀態正確
    browser.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await browser.tabs.get(activeInfo.tabId);
      if (tab.url) {
        updateIconState(tab.id!, tab.url);
      }
    });

    // 監聽來自 popup 的訊息
    browser.runtime.onMessage.addListener(async (message, sender) => {
      logDebug('Background: 收到訊息', message, '來自', sender);

      // 處理 PING 請求
      if (message.type === 'PING') {
        logDebug('Background: 收到 PING 請求，回應 PONG');
        return Promise.resolve({ type: 'PONG', time: new Date().toISOString() });
      }
      
      // 處理主題切換訊息
      if (message.type === 'SWITCH_THEME' && message.theme) {
        logDebug(`Background: 收到切換主題訊息 - ${message.theme}`);
        
        // 保存主題設定
        await saveTheme(message.theme);
        
        // 應用主題到所有標籤頁
        const result = await applyThemeToTabs(message.theme);
        
        return Promise.resolve({ 
          theme: message.theme,
          tabCount: result.tabCount,
          success: result.success,
          error: result.error
        });
      }
      
      // 處理重新上色請求
      if (message.type === 'RECOLOR') {
        logDebug(`Background: 收到重新上色請求`);
        
        // 獲取當前保存的主題
        const currentTheme = await getCurrentTheme();
        
        // 使用當前保存的主題重新應用到所有標籤頁
        const result = await applyThemeToTabs(currentTheme);
        
        return Promise.resolve({
          type: 'RECOLOR_RESULT',
          theme: currentTheme,
          tabCount: result.tabCount,
          success: result.success,
          error: result.error
        });
      }
      
      // 處理獲取當前主題請求
      if (message.type === 'GET_CURRENT_THEME') {
        const currentTheme = await getCurrentTheme();
        return Promise.resolve({ 
          success: true,
          theme: currentTheme
        });
      }
      
      return true;
    });

    // 擴充功能安裝或更新時
    browser.runtime.onInstalled.addListener(() => {
      logDebug('Background: 擴充功能已安裝/更新');
      
      // 延遲應用主題，等待頁面足夠時間載入
      setTimeout(async () => {
        try {
          const currentTheme = await getCurrentTheme();
          await applyThemeToTabs(currentTheme);
          
          // 更新所有標籤的圖標狀態
          const tabs = await browser.tabs.query({});
          for (const tab of tabs) {
            if (tab.id && tab.url) {
              await updateIconState(tab.id, tab.url);
            }
          }
        } catch (error) {
          logDebug('Background: 初始套用主題失敗，這可能是正常的', error);
        }
      }, 3000); // 等待 3 秒
    });
  }
});
