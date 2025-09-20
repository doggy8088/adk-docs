# 回呼函式的設計模式與最佳實踐

回呼函式（Callback）為代理（agent）生命週期提供了強大的擴充點。以下介紹在 Agent Development Kit (ADK)（ADK）中有效運用回呼函式的常見設計模式，並說明實作時的最佳實踐。

## 設計模式

這些模式展示了如何透過回呼函式強化或控制代理（agent）行為的典型做法：

### 1. 防護欄與政策強制執行 { #guardrails-policy-enforcement }

**模式概述：**  
在請求到達大型語言模型 (LLM) 或工具前，攔截請求以強制執行規則。

**實作方式：**
- 使用 `before_model_callback` 檢查 `LlmRequest` 提示詞（prompt）
- 使用 `before_tool_callback` 檢查工具參數
- 若偵測到政策違規（如：禁止主題、髒話）：
  - 回傳預設回應（`LlmResponse` 或 `dict`/`Map`）以阻擋操作
  - 可選擇性地更新 `context.state` 以記錄違規行為

**範例應用情境：**  
`before_model_callback` 會檢查 `llm_request.contents` 是否包含敏感關鍵字，若有則回傳標準的「無法處理此請求」`LlmResponse`，阻止 LLM 呼叫。

### 2. 動態狀態管理 { #dynamic-state-management }

**模式概述：**  
在回呼函式中讀取與寫入 session 狀態，讓代理（agent）行為具備情境感知，並可於步驟間傳遞資料。

**實作方式：**
- 存取 `callback_context.state` 或 `tool_context.state`
- 修改（`state['key'] = value`）會自動被追蹤於後續的 `Event.actions.state_delta`
- 變更內容會由 `SessionService` 持久化

**範例應用情境：**  
`after_tool_callback` 將工具結果中的 `transaction_id` 儲存到 `tool_context.state['last_transaction_id']`。稍後的 `before_agent_callback` 可讀取 `state['user_tier']`，用以客製化代理的問候語。

### 3. 日誌紀錄與監控 { #logging-and-monitoring }

**模式概述：**  
於特定生命週期階段新增詳細日誌，提升可觀察性與除錯能力。

**實作方式：**
- 實作回呼函式（如 `before_agent_callback`、`after_tool_callback`、`after_model_callback`）
- 輸出或傳送結構化日誌，內容包含：
  - 代理（agent）名稱
  - 工具名稱
  - 執行 ID
  - 來自 context 或參數的相關資料

**範例應用情境：**  
記錄如 `INFO: [Invocation: e-123] Before Tool: search_api - Args: {'query': 'ADK'}` 的日誌訊息。

### 4. 快取機制 { #caching }

**模式概述：**  
藉由快取結果，避免重複的大型語言模型 (LLM) 呼叫或工具執行。

**實作步驟：**
1. **操作前：** 在 `before_model_callback` 或 `before_tool_callback` 中：
   - 根據請求/參數產生快取鍵
   - 檢查 `context.state`（或外部快取）是否已有此鍵
   - 若有，直接回傳快取的 `LlmResponse` 或結果

2. **操作後：** 若為快取未命中：
   - 使用對應的 `after_` 回呼函式，將新結果以該鍵存入快取

**範例應用情境：**  
`before_tool_callback` 針對 `get_stock_price(symbol)` 檢查 `state[f"cache:stock:{symbol}"]`，若有則回傳快取價格，否則允許 API 呼叫，並由 `after_tool_callback` 將結果儲存至狀態鍵。

### 5. 請求/回應修改 { #request-response-modification }

**模式概述：**  
在資料送出至 LLM/工具前或接收後進行調整。

**實作選項：**
- **`before_model_callback`：** 修改 `llm_request`（例如根據 `state` 增加系統指令）
- **`after_model_callback`：** 修改回傳的 `LlmResponse`（如格式化文字、過濾內容）
- **`before_tool_callback`：** 修改工具 `args` 字典（或 Java 中的 Map）
- **`after_tool_callback`：** 修改 `tool_response` 字典（或 Java 中的 Map）

**範例應用情境：**  
`before_model_callback` 若偵測到 `context.state['lang'] == 'es'`，則在 `llm_request.config.system_instruction` 後方加上「User language preference: Spanish」。

### 6. 條件式跳過步驟 { #conditional-skipping-of-steps }

**模式概述：**  
根據特定條件，阻止標準操作（代理運行、LLM 呼叫、工具執行）。

**實作方式：**
- 於 `before_` 回呼函式中回傳值以跳過正常執行：
  - `Content` 來自 `before_agent_callback`
  - `LlmResponse` 來自 `before_model_callback`
  - `dict` 來自 `before_tool_callback`
- 框架會將此回傳值視為該步驟的結果

**範例應用情境：**  
`before_tool_callback` 檢查 `tool_context.state['api_quota_exceeded']`。若 `True`，則回傳 `{'error': 'API quota exceeded'}`，阻止實際工具函式執行。

### 7. 工具專屬行為（認證與摘要控制） { #tool-specific-actions-authentication-summarization-control }

**模式概述：**  
處理工具生命週期專屬行為，主要為認證（Authentication）與控制 LLM 對工具結果的摘要。

**實作方式：**  
在工具回呼函式（`before_tool_callback`、`after_tool_callback`）中使用 `ToolContext`：

- **認證：** 若需要憑證但未找到（例如透過 `tool_context.get_auth_response` 或狀態檢查），則於 `before_tool_callback` 中呼叫 `tool_context.request_credential(auth_config)`，啟動認證流程。
- **摘要控制：** 若希望將工具的原始字典輸出直接傳回 LLM 或直接顯示，跳過預設的 LLM 摘要步驟，則設定 `tool_context.actions.skip_summarization = True`。

**範例應用情境：**  
針對安全 API 的 `before_tool_callback` 會檢查狀態中是否有認證權杖；若無則呼叫 `request_credential`。針對回傳結構化 JSON 的工具，`after_tool_callback` 可能會設定 `skip_summarization = True`。

### 8. 檔案與大型資料處理 { #artifact-handling }

**模式概述：**  
於代理（agent）生命週期中儲存或載入與 session 相關的檔案或大型資料。

**實作方式：**
- **儲存：** 使用 `callback_context.save_artifact` / `await tool_context.save_artifact` 儲存資料：
  - 產生的報告
  - 日誌
  - 中間資料
- **載入：** 使用 `load_artifact` 讀取先前儲存的 artifact
- **追蹤：** 變更會透過 `Event.actions.artifact_delta` 追蹤

**範例應用情境：**  
「generate_report」工具的 `after_tool_callback` 會用 `await tool_context.save_artifact("report.pdf", report_part)` 儲存輸出檔案。`before_agent_callback` 可能會用 `callback_context.load_artifact("agent_config.json")` 載入設定檔 artifact。

## 回呼函式的最佳實踐

### 設計原則

**保持專注：**  
每個回呼函式應只針對單一、明確的目的設計（例如僅做日誌、僅做驗證），避免設計成龐大的多功能回呼函式。

**注意效能：**  
回呼函式會在代理（agent）處理流程中同步執行。避免執行長時間或阻塞性操作（如網路呼叫、重度運算）。如有必要請另行分流，但需注意這會增加複雜度。

### 錯誤處理

**優雅處理錯誤：**
- 在回呼函式中使用 `try...except/catch` 區塊
- 適當記錄錯誤
- 決定代理（agent）呼叫是否應中止或嘗試復原
- 不要讓回呼函式錯誤導致整個流程崩潰

### 狀態管理

**謹慎管理狀態：**
- 有意識地讀寫 `context.state`
- 變更會立即於「當前」呼叫中可見，並於事件處理結束時持久化
- 儘量使用明確的狀態鍵，避免修改過於廣泛的結構，以免產生非預期副作用
- 建議使用狀態前綴（`State.APP_PREFIX`、`State.USER_PREFIX`、`State.TEMP_PREFIX`）以提升可讀性，特別是在持久化 `SessionService` 實作時

### 可靠性

**考慮冪等性（Idempotency）：**  
若回呼函式會對外部產生副作用（如遞增外部計數器），請盡量設計為冪等（相同輸入多次執行結果一致），以因應框架或應用程式可能的重試情境。

### 測試與文件

**充分測試：**
- 使用模擬 context 物件對回呼函式進行單元測試
- 進行整合測試，確保回呼函式在完整代理流程中運作正常

**確保清晰：**
- 為回呼函式命名具描述性
- 加上清楚的註解，說明用途、觸發時機及副作用（特別是狀態變更）

**使用正確的 context 類型：**  
務必使用提供的專屬 context 類型（代理/模型用 `CallbackContext`，工具用 `ToolContext`），以確保能存取正確的方法與屬性。

善用這些設計模式與最佳實踐，能讓你在 Agent Development Kit (ADK)（ADK）中有效運用回呼函式，打造更強健、可觀察且可自訂的代理（agent）行為。