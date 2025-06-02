# TrumpetOrange
Prompt Highlighter for ChatGPT / Grok / Gemini / Google AI Studio

> Make your prompts always stand out and keep your conversation flow smooth.

---

## 🌟 One-Click Install (Recommended)
**Now available on the Chrome Web Store!**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kmjcealmacndbklfjgjppdncgebgicmp?label=Chrome%20Web%20Store&logo=google-chrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/trumpetorange/kmjcealmacndbklfjgjppdncgebgicmp)

**[📲 Click here to install TrumpetOrange from the Chrome Web Store](https://chromewebstore.google.com/detail/trumpetorange/kmjcealmacndbklfjgjppdncgebgicmp)**

- ⭐ **5.0 Star Rating**, trusted by 71+ users
- 🌍 **Supports 11 languages** (Traditional Chinese, Simplified Chinese, English, Japanese, Korean, French, German, Spanish, Italian, Russian, Arabic)
- 🔒 **Zero Data Collection**, completely privacy-oriented

---

## 🚀 Highlight Features
| Feature | Description |
|------|------|
| 🎨 **High-Contrast Prompt Highlighting** | Default Trumpet Orange, making your questions visible at a glance. |
| 🔴 **One-Click Theme Switching** | Quickly switch between Orange/Red themes, instantly applying to all tabs. |
| 💾 **Cross-Session Theme Memory** | User's preferred color scheme is automatically saved and applied on next launch. |
| 🧭 **New Floating Navigation Panel** | A floating list on the right instantly collects your historical prompts; click to jump, no more endless scrolling. |
| 🛡️ **Zero Tracking・Privacy First** | Runs locally only, does not collect or upload any data, 100% open-source and auditable. |
| ⚡ **Lightweight Architecture** | Based on [WXT](https://wxt.dev/) + TypeScript, no framework dependencies, excellent performance. |

---

## 📥 Installation Methods

### 2. Manual Load by Developer
> Suitable for users who want the latest features or for development purposes

1. Download/clone this Repo
   ```bash
   git clone https://github.com/yelban/trumpet-orange.git
   ```
2. Enter the project directory and install dependencies
   ```bash
   pnpm i       # Or npm i / yarn
   ```
3. Start in development mode (hot reload)
   ```bash
   pnpm dev     # Default Chrome
   pnpm dev:firefox
   ```
4. Build and import into browser
   ```bash
   pnpm build           # Generates dist/
   ```

---

## 🖱️ Usage Instructions
1. Open ChatGPT, Grok, Gemini, or Google AI Studio.
2. Enter your question in the dialog box and submit to see **orange highlighting**.
3. Click the browser toolbar icon, in the popup window:
   - Switch between **Trumpet Orange / XiGulag Red** themes
   - Click **Recolor** to force reapply styles
4. A **Floating Navigation Panel** will appear on the right:
   - Automatically lists all historical prompts
   - Click any item to smoothly scroll to that message location

---

## 🧑‍💻 Project Structure
```
entrypoints/     # background / content / popup scripts
components/      # Shared modules (i18n, logger)
public/_locales/ # Chrome i18n language files
wxt.config.ts    # WebExtension Manifest configuration
```

---

## 🤝 Contribution Guidelines
1. Fork ➜ Create branch ➜ Commit ➜ Pull Request
2. Please follow Conventional Commits format (`feat:`, `fix:`, `chore:` …).
3. All features should correspond to an Issue or start a new discussion to ensure alignment of goals.

---

## 📜 License
MIT License — Feel free to use, modify, and distribute.

---

> 2025/06/02 Update: **New Floating Navigation Panel** — Click to quickly jump to past prompts, no more endless scrolling, inspiration review at your fingertips!