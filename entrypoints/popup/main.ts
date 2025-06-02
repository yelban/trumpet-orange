import './style.css';
import { DEBUG_MODE, logDebug } from '../../components/logger';
import { setupI18n, getMessage } from '../../components/i18n';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="top-row">
      <div class="color-block trumpet-block" id="sw-tro-orange" i18n-msg="trumpetOrange">TrumpetOrange</div>
      <div class="color-block xinred-block" id="sw-tro-red" i18n-msg="xinlagRed">XigulagRed</div>
    </div>
    <div class="bottom-row">
      <button id="recolorButton" i18n-msg="recolorButton">Recolor</button>
    </div>
  </div>
`;

// 初始化國際化
setupI18n();

// 常量定義
const THEME_STORAGE_KEY = 'trumpet-orange-theme';
const DEFAULT_THEME = 'trx-orange';

// 設置按鈕活動狀態
function setActiveButton(themeKey: string) {
  // 移除所有按鈕的 active 類
  document.querySelectorAll('.color-block').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 根據當前主題設置對應按鈕的 active 類
  if (themeKey === 'trx-red') {
    document.querySelector('#sw-tro-red')?.classList.add('active');
  } else if (themeKey === 'trx-orange') {
    document.querySelector('#sw-tro-orange')?.classList.add('active');
  }
}

// 儲存主題到 storage
async function saveTheme(themeKey: string): Promise<boolean> {
  try {
    await browser.storage.local.set({ [THEME_STORAGE_KEY]: themeKey });
    logDebug(`Popup: 已儲存主題 ${themeKey} 到 storage`);
    return true;
  } catch (error) {
    logDebug('Popup: 儲存主題失敗', error);
    return false;
  }
}

// 從 storage 獲取當前主題設定
async function getCurrentTheme(): Promise<string> {
  try {
    const result = await browser.storage.local.get(THEME_STORAGE_KEY);
    if (result && result[THEME_STORAGE_KEY]) {
      return result[THEME_STORAGE_KEY];
    }
  } catch (error) {
    console.error('Popup: 讀取主題設定失敗', error);
  }
  return DEFAULT_THEME;
}

// 發送訊息到 background 並增加重試機制
async function sendMessageToBackground(message: any): Promise<any> {
  // 嘗試次數和延遲時間
  const maxRetries = 3;
  const retryDelay = 300; // 毫秒
  
  // 顯示處理中狀態
  logDebug(`Popup: 嘗試發送訊息到 background: ${JSON.stringify(message)}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 發送訊息並等待回應
      const response = await browser.runtime.sendMessage(message);
      logDebug(`Popup: 收到 background 回應:`, response);
      return response;
    } catch (error) {
      logDebug(`Popup: 第 ${attempt} 次嘗試發送訊息失敗:`, error);
      
      // 最後一次嘗試失敗則拋出錯誤
      if (attempt === maxRetries) {
        logDebug('Popup: 所有重試均失敗，無法連接到 background');
        throw error;
      }
      
      // 等待一段時間後重試
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// 主題按鈕點擊事件監聽
document.addEventListener('DOMContentLoaded', async () => {
  logDebug('Popup: DOM 已載入，設置按鈕事件');
  
  // 讀取當前主題並設置按鈕狀態
  const currentTheme = await getCurrentTheme();
  setActiveButton(currentTheme);
  logDebug(`Popup: 當前主題 ${currentTheme}，已設置對應按鈕狀態`);
  
  // 確保 background 連接處於活動狀態
  browser.runtime.sendMessage({ type: 'PING' })
    .then(() => logDebug('Popup: background 連接正常'))
    .catch(() => logDebug('Popup: background 連接測試失敗，但仍將嘗試發送訊息'));
  
  // 紅色主題按鈕
  const redButton = document.querySelector<HTMLDivElement>('#sw-tro-red');
  redButton?.addEventListener('click', async () => {
    logDebug('Popup: 點擊切換到紅色主題');
    try {
      // 先儲存主題到 storage
      await saveTheme('trx-red');
      
      // 通知背景腳本發送訊息給所有頁面
      await sendMessageToBackground({
        type: 'SWITCH_THEME',
        theme: 'trx-red'
      });
      
      logDebug('Popup: 紅色主題訊息已發送成功');
      setActiveButton('trx-red');
    } catch (error) {
      logDebug('Popup: 紅色主題訊息發送最終失敗', error);
    }
  });

  // 橙色主題按鈕
  const orangeButton = document.querySelector<HTMLDivElement>('#sw-tro-orange');
  orangeButton?.addEventListener('click', async () => {
    logDebug('Popup: 點擊切換到橙色主題');
    try {
      // 先儲存主題到 storage
      await saveTheme('trx-orange');
      
      // 通知背景腳本發送訊息給所有頁面
      await sendMessageToBackground({
        type: 'SWITCH_THEME',
        theme: 'trx-orange'
      });
      
      logDebug('Popup: 橙色主題訊息已發送成功');
      setActiveButton('trx-orange');
    } catch (error) {
      logDebug('Popup: 橙色主題訊息發送最終失敗', error);
    }
  });
  
  logDebug('Popup: 按鈕事件設置完成');
});

// 為重新上色按鈕添加事件監聽器
const recolorButton = document.querySelector<HTMLButtonElement>('#recolorButton');
if (recolorButton) {
  recolorButton.addEventListener('click', async () => {
    logDebug('Popup: 點擊重新上色');
    try {
      await sendMessageToBackground({
        type: 'RECOLOR'
      });
      logDebug('Popup: 重新上色訊息已發送成功');
    } catch (error) {
      logDebug('Popup: 重新上色訊息發送最終失敗', error);
    }
  });
}
