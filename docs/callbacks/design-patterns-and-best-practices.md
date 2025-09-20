# Callbacks 的設計模式與最佳實踐

Callbacks 提供了強大的鉤子（hook），可介入 agent 的生命週期。以下介紹在 Agent Development Kit (ADK) 中有效運用 Callbacks 的常見設計模式，並附上實作最佳實踐建議。

## 設計模式

這些模式展示了如何透過 Callbacks 增強或控制 agent 行為的典型方式：

### 1. 防護欄與政策強制執行 { #guardrails-policy-enforcement }

**模式概述：**  
在請求到達大型語言模型 (LLM) 或工具前進行攔截，以強制執行規則。

**實作方式：**
- 使用 `before_model_callback` 檢查 `LlmRequest` prompt
- 使用 `before_tool_callback` 檢查工具參數
- 若偵測到政策違規（如：禁用主題、髒話）：
  - 回傳預先定義的回應（`LlmResponse` 或 `dict`/`Map`），以阻擋該操作
  - 可選擇性地更新 `context.state` 以記錄違規事件

**範例應用情境：**  
`before_model_callback` 會檢查 `llm_request.contents` 是否包含敏感關鍵字，若發現則回傳標準的「無法處理此請求」`LlmResponse`，從而阻止 LLM 呼叫。

### 2. 動態狀態管理 { #dynamic-state-management }

**模式概述：**  
在 Callbacks 中讀取與寫入 session state，讓 agent 行為具備情境感知能力，並可在步驟間傳遞資料。

**實作方式：**
- 存取 `callback_context.state` 或 `tool_context.state`
- 變更（`state['key'] = value`）會自動被追蹤於後續的 `Event.actions.state_delta`
- 變更內容會由 `SessionService` 負責持久化

**範例應用情境：**  
`after_tool_callback` 會將工具結果中的 `transaction_id` 儲存至 `tool_context.state['last_transaction_id']`，之後的 `before_agent_callback` 可讀取 `state['user_tier']` 來客製化 agent 的問候語。

### 3. 日誌記錄與監控 { #logging-and-monitoring }

**模式概述：**  
在特定生命週期階段加入詳細日誌，提升可觀察性與除錯能力。

**實作方式：**
- 實作 Callbacks（如 `before_agent_callback`、`after_tool_callback`、`after_model_callback`）
- 輸出或傳送結構化日誌，內容包含：
  - agent 名稱
  - 工具名稱
  - 呼叫 ID
  - 來自 context 或參數的相關資料

**範例應用情境：**  
記錄如 `INFO: [Invocation: e-123] Before Tool: search_api - Args: {'query': 'ADK'}` 的日誌訊息。

### 4. 快取 { #caching }

**模式概述：**  
透過快取結果，避免重複進行 LLM 呼叫或工具執行。

**實作步驟：**
1. **操作前：** 在 `before_model_callback` 或 `before_tool_callback` 中：
   - 根據請求/參數產生快取鍵
   - 檢查 `context.state`（或外部快取）是否已有此鍵
   - 若有，直接回傳快取的 `LlmResponse` 或結果

2. **操作後：** 若為快取未命中：
   - 使用對應的 `after_` callback，將新結果以該鍵存入快取

**範例應用情境：**  
`before_tool_callback` 針對 `get_stock_price(symbol)` 會檢查 `state[f"cache:stock:{symbol}"]`，若有則回傳快取的股價，否則允許 API 呼叫並由 `after_tool_callback` 將結果儲存至 state key。

### 5. 請求／回應修改 { #request-response-modification }

**模式概述：**  
在資料送往 LLM/工具前，或接收後即時進行修改。

**實作選項：**
- **`before_model_callback`：** 修改 `llm_request`（例如根據 `state` 加入系統指令）
- **`after_model_callback`：** 修改回傳的 `LlmResponse`（例如格式化文字、過濾內容）
- **`before_tool_callback`：** 修改工具的 `args` 字典（或 Java 中的 Map）
- **`after_tool_callback`：** 修改 `tool_response` 字典（或 Java 中的 Map）

**範例應用情境：**  
`before_model_callback` 若偵測到 `context.state['lang'] == 'es'`，則會在 `llm_request.config.system_instruction` 後方加上「User language preference: Spanish」。

### 6. 條件式跳過步驟 { #conditional-skipping-of-steps }

**模式概述：**  
根據特定條件，防止標準操作（agent 執行、LLM 呼叫、工具執行）發生。

**實作方式：**
- 從 `before_` callback 回傳一個值，即可跳過正常執行流程：
  - `Content` 來自 `before_agent_callback`
  - `LlmResponse` 來自 `before_model_callback`
  - `dict` 來自 `before_tool_callback`
- 框架會將該回傳值視為該步驟的執行結果

**範例應用情境：**  
`before_tool_callback` 會檢查 `tool_context.state['api_quota_exceeded']`，若 `True`，則直接回傳 `{'error': 'API quota exceeded'}`，從而阻止實際的工具函式執行。

### 7. 工具專屬行為（認證與摘要控制） { #tool-specific-actions-authentication-summarization-control }

**模式概述：**  
處理工具生命週期中專屬行為，主要為認證（Authentication）與控制 LLM 對工具結果的摘要。

**實作方式：**  
在工具 callbacks（`before_tool_callback`、`after_tool_callback`）中使用 `ToolContext`：

- **認證：** 若需要認證但未找到憑證（如透過 `tool_context.get_auth_response` 或 state 檢查），則於 `before_tool_callback` 中呼叫 `tool_context.request_credential(auth_config)`，啟動認證流程。
- **摘要控制：** 若希望將工具的原始字典輸出直接傳回 LLM 或直接顯示（跳過預設的 LLM 摘要步驟），則設定 `tool_context.actions.skip_summarization = True`。

**範例應用情境：**  
針對安全 API 的 `before_tool_callback` 會檢查 state 是否有 auth token，若缺少則呼叫 `request_credential`。而針對回傳結構化 JSON 的工具，`after_tool_callback` 可能會設定 `skip_summarization = True`。

### 8. 檔案處理（Artifact Handling） { #artifact-handling }

**模式概述：**  
在 agent 生命週期中儲存或載入與 session 相關的檔案或大型資料 blob。

**實作方式：**
- **儲存：** 使用 `callback_context.save_artifact` / `await tool_context.save_artifact` 儲存資料：
  - 產生的報告
  - 日誌
  - 中間資料
- **載入：** 使用 `load_artifact` 取回先前儲存的 artifact
- **追蹤：** 變更會透過 `Event.actions.artifact_delta` 追蹤

**範例應用情境：**  
「generate_report」工具的 `after_tool_callback` 會用 `await tool_context.save_artifact("report.pdf", report_part)` 儲存輸出檔案；`before_agent_callback` 則可能用 `callback_context.load_artifact("agent_config.json")` 載入設定檔 artifact。

## Callbacks 的最佳實踐

### 設計原則

**聚焦單一職責：**  
設計每個 callback 時，請聚焦於單一明確的目的（如僅做日誌、僅做驗證），避免 callback 過於龐大。

**注意效能：**  
Callbacks 會在 agent 處理迴圈中同步執行。避免執行長時間或阻塞的操作（如網路呼叫、重度運算）。如需離線處理，請注意這會增加複雜度。

### 錯誤處理

**優雅處理錯誤：**
- 在 callback 函式內使用 `try...except/catch` 區塊
- 適當記錄錯誤
- 決定 agent 呼叫是否應中止或嘗試復原
- 請勿讓 callback 錯誤導致整個流程崩潰

### 狀態管理

**謹慎管理狀態：**
- 有意識地讀寫 `context.state`
- 變更會於_本次_呼叫內立即可見，並於事件處理結束時持久化
- 儘量使用明確的 state key，避免修改整體結構，以防產生非預期副作用
- 建議使用 state 前綴（`State.APP_PREFIX`、`State.USER_PREFIX`、`State.TEMP_PREFIX`）以提升可讀性，特別是在持久化 `SessionService` 實作時

### 可靠性

**考慮冪等性（Idempotency）：**  
若 callback 會對外部產生副作用（如遞增外部計數器），請盡量設計為冪等（同一輸入多次執行也安全），以因應框架或應用層可能的重試行為。

### 測試與文件

**徹底測試：**
- 使用 mock context 物件進行單元測試
- 進行整合測試，確保 callback 在完整 agent 流程中正常運作

**確保易讀性：**
- 為 callback 函式使用具描述性的名稱
- 加上清楚的 docstring，說明用途、觸發時機及副作用（尤其是狀態變更）

**使用正確的 Context 型別：**  
務必使用提供的專屬 context 型別（agent/model 請用 `CallbackContext`，工具請用 `ToolContext`），以確保能存取正確的方法與屬性。

運用這些設計模式與最佳實踐，您將能有效利用 Callbacks，打造更健壯、可觀察、且高度自訂化的 agent 行為於 Agent Development Kit (ADK) 中。