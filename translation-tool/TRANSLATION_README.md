# ADK Documentation Translation Tool

這是一個使用 Azure OpenAI Service 自動翻譯 ADK 文件的 Node.js 工具。

## 功能特色

- 🔄 自動掃描所有 `*.md` 文件進行翻譯
- 🧠 使用 Azure OpenAI Service (GPT-4/5) 進行英文到繁體中文翻譯
- 📊 自動品質分析和改進機制
- 📚 維護跨文件共用的翻譯字典
- 🔧 專有名詞處理（保持原文或中英對照）
- 🛡️ 錯誤處理和重試機制
- 📝 詳細的日誌記錄
- 💾 原始文件備份

## 安裝

1. 安裝 Node.js 依賴：

```bash
npm install
```

2. 複製環境變數範例檔案：

```bash
cp .env.example .env
```

3. 設定 Azure OpenAI 連接資訊：

編輯 `.env` 檔案，填入你的 Azure OpenAI 服務資訊：

```env
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## 使用方法

### 基本用法

```bash
npm run translate
```

或

```bash
node translate.js
```

### 環境變數配置

| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API 金鑰 | 必填 |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 服務端點 | 必填 |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | 部署模型名稱 | `gpt-4` |
| `AZURE_OPENAI_API_VERSION` | API 版本 | `2024-02-15-preview` |
| `SOURCE_LANGUAGE` | 來源語言 | `en` |
| `TARGET_LANGUAGE` | 目標語言 | `zh-tw` |
| `MAX_RETRIES` | 最大重試次數 | `3` |
| `QUALITY_THRESHOLD` | 品質門檻分數 (1-10) | `7` |
| `INPUT_PATTERN` | 輸入檔案模式 | `**/*.md` |
| `OUTPUT_SUFFIX` | 輸出檔案後綴 | `_zh-tw` |
| `DICTIONARY_FILE` | 字典檔案路徑 | `translation-dictionary.json` |
| `BACKUP_ORIGINAL` | 是否備份原始檔案 | `true` |
| `LOG_LEVEL` | 日誌等級 | `info` |
| `LOG_FILE` | 日誌檔案路徑 | `translation.log` |

## 翻譯流程

1. **檔案掃描**：自動掃描專案中所有的 `*.md` 檔案
2. **內容分析**：將 Markdown 內容分解為可翻譯的區塊（排除程式碼區塊）
3. **初步翻譯**：使用 Azure OpenAI 進行英文到繁體中文的翻譯
4. **品質分析**：分析翻譯品質並給出評分 (1-10分)
5. **品質改進**：如果品質分數低於門檻值，自動進行改進
6. **字典應用**：應用共用字典確保術語翻譯一致性
7. **檔案輸出**：儲存翻譯結果到新檔案（原檔名加上後綴）

## 專有名詞處理

工具內建了常見的技術術語字典，包括：

- API、SDK、ADK 等技術縮寫
- GitHub、Google Cloud、Vertex AI 等服務名稱
- Python、Java、JavaScript 等程式語言名稱
- 部分術語會提供中英對照，如：`LLM` → `大型語言模型 (LLM)`

## 字典系統

翻譯字典會自動儲存在 `translation-dictionary.json` 檔案中，包含：

- 自動學習的翻譯對應
- 手動定義的專有名詞
- 跨文件共用的一致性翻譯

## 日誌和錯誤處理

- 所有操作都會記錄在日誌檔案中
- 支援彩色控制台輸出
- 自動重試機制處理暫時性錯誤
- 詳細的錯誤訊息和堆疊追蹤

## 輸出結果

- 翻譯後的檔案會儲存為 `原檔名_zh-tw.md`
- 原始檔案會自動備份為 `原檔名.md.backup`
- 翻譯字典會更新到 `translation-dictionary.json`
- 詳細日誌會儲存到 `translation.log`

## 注意事項

1. 確保 Azure OpenAI 服務有足夠的配額
2. 大量檔案翻譯可能需要較長時間
3. 建議先在少量檔案上測試配置
4. 程式碼區塊和連結不會被翻譯
5. Markdown 格式會被保留

## 疑難排解

### 常見錯誤

1. **API 金鑰錯誤**：檢查 `.env` 檔案中的 `AZURE_OPENAI_API_KEY`
2. **端點錯誤**：確認 `AZURE_OPENAI_ENDPOINT` 格式正確
3. **配額不足**：檢查 Azure OpenAI 服務的使用配額
4. **檔案權限**：確保對檔案和目錄有讀寫權限

### 提高翻譯品質

1. 調整 `QUALITY_THRESHOLD` 設定更高的品質要求
2. 更新字典檔案添加專業術語
3. 檢查日誌檔案了解翻譯過程
4. 手動調整有問題的翻譯並更新字典

## 授權

本工具遵循 Apache-2.0 授權條款。