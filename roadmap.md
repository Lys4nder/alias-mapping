# 🧠 Alias View Extension – Feature Roadmap

This is a list of planned and potential features to enhance the Alias View VSCode extension. The goal is to improve code readability across language barriers without altering the actual source code or git history.

---

## ✅ MVP (Implemented)
- [x] **Load alias mappings** from `.vscode/alias-mapping.json`
- [x] **Show inline ghost text** next to variables (non-intrusive)
- [x] **Toggle alias display** via command: `Alias View: Toggle Aliases`

---

## 🔄 Auto Reload on Save
- **Watch** `.vscode/alias-mapping.json` for changes.
- **Automatically reapply aliases** when the file is saved.

---

## 🧠 Hover Tooltips
- **Show a tooltip** when hovering over aliased variables.
- **Optional extra fields** like notes or categories:
    ```json
    {
        "anzahl": {
            "alias": "quantity",
            "note": "Used in invoice system"
        }
    }
    ```

---

## 🔎 Highlight Unmapped Identifiers
- **Underline or decorate** variables that have no alias.
- Helps identify untranslated code.

## 🧩 React-Based Alias Editor Panel
 - React + Webview sidebar to:
    - View current aliases
    - Edit inline
    - Add/remove entries
    - Save to JSON config
    - Filter/Search by alias


## 🧬 AST-based Smart Matching (Optional)
- Use a parser (e.g. TypeScript Compiler API or Tree-sitter) to:
- Avoid matching inside comments or strings
- Detect actual variable/function identifiers only
- Adds robustness for larger codebases

## 🌐 Shared Alias Mapping Support
 - Import/export .json alias maps
 - Sync between teammates
 - (Optional) GitHub Gist or simple local server for syncing

## 🔀 Language Toggle Mode
Switch alias direction:

German → English

English → German

Store multi-language entries:
```json
{
  "anzahl": { "en": "quantity", "de": "anzahl" }
}
```
## 🚥 Git Integration (Optional)
- Detect if alias-mapping.json is tracked by Git
- Optionally ignore for personal/local use
- Show status in the VSCode status bar or panel

## 🎨 Customization Settings
- Let users personalize:
    - Ghost text color
    - Text margin
    - Display mode (inline vs tooltip vs both)
- Configuration via settings.json:

```json
"aliasView.ghostTextColor": "#888888",
"aliasView.showTooltip": true
```
## 📚 Built-in Help / Docs Panel
 - Webview panel with:
    - Extension usage
    - Setup guide
    - Example alias maps
    - FAQ / troubleshooting tips

## 🧪 Future Ideas
- CodeLens with alias above declarations
- Inline commands (e.g., quick-add alias from code)
- Statistics: % of variables with aliases