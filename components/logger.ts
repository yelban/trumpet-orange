/**
 * 集中式日誌控制功能
 * 可以在這裡統一修改 DEBUG_MODE 來控制整個應用的日誌輸出
 */

// 全局日誌控制開關
// export const DEBUG_MODE = true; // 開發時設為 true
export const DEBUG_MODE = false; // 發布前設為 false

/**
 * 日誌輸出函數
 * 只有當 DEBUG_MODE 為 true 時才會輸出日誌
 * @param args 要輸出的參數
 */
export function logDebug(...args: any[]) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
} 