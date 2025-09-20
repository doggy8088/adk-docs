# Callbacks 的類型

此框架提供多種不同類型的 Callbacks，會在 agent 執行過程中的各個階段被觸發。了解每種 Callback 觸發的時機以及它所接收的 context，對於有效運用它們至關重要。

## Agent 生命週期 Callbacks

這些 Callbacks 可用於任何繼承自 `BaseAgent` 的 agent（包括 `LlmAgent`、`SequentialAgent`、`ParallelAgent`、`LoopAgent` 等）。

!!! Note
    具體的方法名稱或回傳型別可能會依不同 SDK 語言略有差異（例如：在 Python 中回傳 `None`，在 Java 中回傳 `Optional.empty()` 或 `Maybe.empty()`）。詳細資訊請參閱各語言的 API 文件說明。

### Before Agent Callback

**時機：** 在 agent 的 `_run_async_impl`（或 `_run_live_impl`）方法執行*之前立即*呼叫。此 Callback 會在 agent 的 `InvocationContext` 建立之後、但在其核心邏輯開始*之前*執行。

**用途：** 適合用於設定僅此特定 agent 執行時所需的資源或狀態，在執行開始前對 session state（callback\_context.state）進行驗證檢查、記錄 agent 活動的進入點，或在核心邏輯使用前，對呼叫上下文進行必要的修改。

??? "Code"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_agent_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeAgentCallbackExample.java:init"
        ```


**關於 `before_agent_callback` 範例的說明：**

* **展示內容：** 此範例展示了`before_agent_callback`。這個 Callback 會在 agent 的主要處理邏輯開始執行前（針對每個請求）*立即*被呼叫。
* **運作方式：** Callback 函式（`check_if_agent_should_run`）會檢查 session state 中的一個旗標（`skip_llm_agent`）。
    * 若該旗標為 `True`，則 Callback 會回傳一個 `types.Content` 物件。這會告訴 Agent Development Kit (ADK) 框架**完全略過** agent 的主要執行，並將 Callback 回傳的內容作為最終回應。
    * 若該旗標為 `False`（或未設定），則 Callback 會回傳 `None` 或空物件。這會告訴 Agent Development Kit (ADK) 框架**繼續**執行 agent 的正常流程（在此案例中即呼叫大型語言模型 (LLM)）。
* **預期結果：** 你會看到兩種情境：
    1. 在 *有* `skip_llm_agent: True` state 的 session 中，agent 的大型語言模型 (LLM) 呼叫會被略過，輸出會直接來自 Callback（例如 "Agent... skipped..."）。
    2. 在 *沒有* 該 state 旗標的 session 中，Callback 允許 agent 執行，你會看到來自大型語言模型 (LLM) 的實際回應（例如 "Hello!"）。
* **理解 Callbacks：** 這凸顯了`before_` Callback 作為**守門員**的角色，讓你能在主要步驟*之前*攔截執行流程，並根據檢查結果（如 state、輸入驗證、權限等）決定是否阻止後續執行。

### After Agent Callback

**時機：** 當 agent 的 `_run_async_impl`（或 `_run_live_impl`）方法成功完成後*立即*被呼叫。如果因為 `before_agent_callback` 回傳內容而略過 agent，或在 agent 執行期間設置了 `end_invocation`，則不會執行此 Callback。

**用途：** 適合用於清理工作、執行後驗證、記錄 agent 活動完成、修改最終 state，或增強／取代 agent 的最終輸出。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_agent_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterAgentCallbackExample.java:init"
        ```


**`after_agent_callback` 範例說明：**

* **展示內容：** 此範例展示了`after_agent_callback`。這個 callback 會在 agent 主要處理邏輯完成並產生結果之後、但在結果最終定稿與回傳之前執行。
* **運作方式：** callback 函式（`modify_output_after_agent`）會檢查 session state 中的一個旗標（`add_concluding_note`）。
    * 如果該旗標為 `True`，callback 會回傳一個*新的*`types.Content` 物件。這會告訴 Agent Development Kit (ADK) 框架**取代** agent 原本的輸出，改用 callback 回傳的內容。
    * 如果該旗標為 `False`（或未設定），callback 則回傳 `None` 或空物件。這會告訴 Agent Development Kit (ADK) 框架**沿用** agent 原本產生的輸出。
*   **預期結果：** 你會看到兩種情境：
    1. 在*沒有*`add_concluding_note: True` state 的 session 中，callback 允許 agent 原本的輸出（"Processing complete!"）被使用。
    2. 在有該 state 旗標的 session 中，callback 會攔截 agent 原本的輸出，並以自己的訊息（"Concluding note added..."）取而代之。
* **理解 Callbacks：** 這強調了`after_` callback 如何實現**後處理**或**修改**。你可以檢查某個步驟（agent 執行）的結果，並根據你的邏輯決定要讓它通過、修改它，或完全取代它。

## LLM 互動 Callback

這些 callback 專為`LlmAgent`設計，提供與大型語言模型 (Large Language Model, LLM) 互動時的掛鉤點。

### Before Model Callback

**時機：** 在 `generate_content_async`（或同等功能）請求於`LlmAgent`流程中送往 LLM 之前呼叫。

**目的：** 允許檢查並修改即將送往 LLM 的請求。常見用途包括：動態新增指令、根據 state 注入 few-shot 範例、修改模型設定、實作防護措施（如髒話過濾）、或實作請求層級的快取。

**回傳值效果：**  
如果 callback 回傳 `None`（或在 Java 中為 `Maybe.empty()` 物件），LLM 會照常執行流程。如果 callback 回傳 `LlmResponse` 物件，則會**跳過**對 LLM 的呼叫。此時回傳的 `LlmResponse` 會被直接當作來自模型的結果使用。這對於實作防護措施或快取特別有用。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_model_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeModelCallbackExample.java:init"
        ```

### After Model Callback

**時機：** 當從大型語言模型 (LLM) 收到回應（`LlmResponse`）後，且在被呼叫的 agent 進一步處理之前執行。

**目的：** 允許檢查或修改原始 LLM 回應。常見用途包括：

* 記錄模型輸出，
* 重新格式化回應內容，
* 過濾或遮蔽模型產生的敏感資訊，
* 從 LLM 回應中解析結構化資料並儲存到 `callback_context.state`，
* 或處理特定錯誤碼。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_model_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterModelCallbackExample.java:init"
        ```

## 工具執行回呼（Tool Execution Callbacks）

這些回呼同樣是針對 `LlmAgent` 而設計，並會在大型語言模型 (LLM) 可能請求執行的工具（包含 `FunctionTool`、`AgentTool` 等）執行前後觸發。

### 工具執行前回呼（Before Tool Callback）

**時機：** 當大型語言模型 (LLM) 已為特定工具產生函式呼叫，且即將呼叫該工具的 `run_async` 方法前觸發。

**用途：** 可用於檢查與修改工具參數、在執行前進行授權檢查、記錄工具使用嘗試，或實作工具層級的快取。

**回傳值效果：**

1. 如果回呼回傳 `None`（或在 Java 中為 `Maybe.empty()` 物件），則工具的 `run_async` 方法會以（可能已被修改的）`args` 執行。  
2. 如果回傳的是字典（或在 Java 中為 `Map`），則工具的 `run_async` 方法會**被略過**。回傳的字典會直接作為該工具呼叫的結果。這對於快取或覆寫工具行為非常有用。  


??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_tool_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeToolCallbackExample.java:init"
        ```



### After Tool Callback

**時機：** 在工具的 `run_async` 方法成功完成後立即呼叫。

**目的：** 允許在結果回傳給大型語言模型 (LLM)（可能經過摘要處理）之前，檢查與修改工具的結果。這對於記錄工具結果、後處理或格式化結果，或將結果的特定部分儲存到 session state 都很有用。

**回傳值影響：**

1. 如果 callback 回傳 `None`（或在 Java 中為 `Maybe.empty()` 物件），則會使用原本的 `tool_response`。  
2. 如果回傳新的 dictionary，則會**取代**原本的 `tool_response`。這可用於修改或過濾 LLM 所看到的結果。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_tool_callback.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterToolCallbackExample.java:init"
        ```
