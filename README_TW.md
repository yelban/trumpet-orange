# TrumpetOrange  
Prompt Highlighter for ChatGPT / Grok / Gemini / Google AI Studio

> 讓你的提示詞永遠搶眼，對話流程順暢無阻。

---

## 🌟 一鍵安裝（推薦）
**現已上架 Chrome Web Store！**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kmjcealmacndbklfjgjppdncgebgicmp?label=Chrome%20Web%20Store&logo=google-chrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/trumpetorange/kmjcealmacndbklfjgjppdncgebgicmp)

**[📲 點此前往 Chrome Web Store 安裝 TrumpetOrange](https://chromewebstore.google.com/detail/trumpetorange/kmjcealmacndbklfjgjppdncgebgicmp)**

- ⭐ **5.0 星評價**，71+ 位使用者信賴
- 🌍 **支援 11 種語言**（繁中、簡中、英、日、韓、法、德、西、義、俄、阿拉伯文）
- 🌍 **零資料收集**，完全隱私導向

---

## 🚀 亮點功能
| 功能 | 說明 |
|------|------|
| 🎨 **高對比提示詞高亮** | 預設 Trumpet 橘，讓你的提問一眼即見。 |
| 🔴 **一鍵主題切換** | 橘／紅雙主題快速切換，立刻套用至所有分頁。 |
| 💾 **跨會話主題記憶** | 使用者首選配色自動保存，下次開啟即生效。 |
| 🧭 **全新浮動導覽面板** | 右側浮動清單即時收錄你的歷史提問，點擊即可跳轉，無需反覆捲動。 |
| 🛡️ **零追蹤・隱私至上** | 僅在本地運行，不蒐集、不上傳任何資料，100% 開源可稽核。 |
| ⚡ **輕量化架構** | 基於 [WXT](https://wxt.dev/) + TypeScript，無框架依賴，效能卓越。 |

---

## 📥 安裝方式

### 2. 開發者手動載入
> 適合想要最新功能或進行開發的使用者

1. 下載/clone 此 Repo  
   ```bash
   git clone https://github.com/yelban/trumpet-orange.git
   ```
2. 進入專案目錄並安裝依賴  
   ```bash
   pnpm i       # 或 npm i / yarn
   ```
3. 開發模式啟動（熱重載）  
   ```bash
   pnpm dev     # 預設 Chrome
   pnpm dev:firefox
   ```
4. 打包並匯入瀏覽器  
   ```bash
   pnpm build           # 生成 dist/
   ```

---

## 🖱️ 使用說明
1. 開啟 ChatGPT、Grok、Gemini 或 Google AI Studio。  
2. 在對話框輸入問題並送出，即可看到 **橘色高亮**。  
3. 點擊瀏覽器工具列圖示，於彈出視窗中：  
   - 切換 **Trumpet 橘 / XiGulag 紅** 主題  
   - 點擊 **Recolor** 強制重新套用樣式  
4. 右側將出現 **浮動導覽面板**：  
   - 自動列出所有歷史提問  
   - 點擊任一條即可平滑滾動至該訊息位置

---

## 🧑‍💻 專案結構
```
entrypoints/     # background / content / popup 腳本
components/      # 共用模組（i18n、logger）
public/_locales/ # Chrome i18n 語系檔
wxt.config.ts    # WebExtension Manifest 設定
```

---

## 🤝 貢獻方式
1. Fork ➜ Create branch ➜ Commit ➜ Pull Request  
2. 請遵循 Conventional Commits 格式 (`feat:`, `fix:`, `chore:` …)。  
3. 所有功能請對應 Issue 或開新討論，確保目標一致。

---

## 📜 授權
MIT License — 歡迎自由使用、修改與發佈。

---

> 2025/06/02 Update: **全新浮動導覽面板** — 點擊即可快速跳轉到過往提示詞，再也不用滑到天荒地老，靈感回顧隨手可得！ 