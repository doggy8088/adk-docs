# 回呼函式（Callbacks）：觀察、自訂與控制 agent 行為

## 簡介：什麼是回呼函式（Callbacks）？為什麼要使用？

回呼函式（Callbacks）是 Agent Development Kit (ADK) 的核心功能之一，提供了一種強大的機制，讓你能在 agent 執行過程中的特定、預先定義的階段進行攔截。透過這些回呼函式，你可以觀察、自訂，甚至控制 agent 的行為，而無需修改 ADK 框架的核心程式碼。

**什麼是回呼函式？** 本質上，回呼函式就是你自行定義的標準函式。你可以在建立 agent 時，將這些函式與 agent 綁定。ADK 框架會在關鍵階段自動呼叫你的函式，讓你能觀察或介入 agent 的運作。你可以把它想像成 agent 執行過程中的檢查點：

* **在 agent 開始處理請求的主要工作前，以及完成後：** 當你要求 agent 執行某項任務（例如：回答問題）時，agent 會運行其內部邏輯來產生回應。
  * `Before Agent` 回呼函式會在該請求的主要工作*開始之前*執行。
  * `After Agent` 回呼函式會在 agent 完成該請求所有步驟並準備好最終結果後、但在結果回傳*之前*執行。
  * 這裡所指的「主要工作」涵蓋 agent 處理單一請求的*整個*流程。這可能包括決定是否呼叫大型語言模型 (LLM)、實際呼叫 LLM、決定是否使用工具、執行工具、處理工具結果，最後組合出答案。這些回呼函式本質上包裹了從接收輸入到產生最終輸出的完整互動流程。
* **在向大型語言模型 (Large Language Model, LLM) 發送請求前，或接收回應後：** 這些回呼函式（`Before Model`、`After Model`）讓你能針對與 LLM 互動的資料進行檢查或修改。
* **在執行工具（如 Python 函式或其他 agent）前，或執行完畢後：** 同樣地，`Before Tool` 和 `After Tool` 回呼函式讓你能在 agent 呼叫工具的過程中，於執行前後進行控制。

![intro_components.png](../assets/callback_flow.png)

**為什麼要使用回呼函式？** 回呼函式帶來高度彈性，並能實現進階的 agent 能力：

* **觀察與除錯：** 在關鍵步驟記錄詳細資訊，便於監控與問題排查。  
* **自訂與控制：** 修改 agent 流經的資料（如 LLM 請求或工具結果），甚至可依據你的邏輯完全略過某些步驟。  
* **實作安全防護：** 強制執行安全規則、驗證輸入/輸出，或防止不允許的操作。  
* **狀態管理：** 在執行過程中讀取或動態更新 agent 的 session 狀態。  
* **整合與擴充：** 觸發外部動作（API 呼叫、通知），或新增快取等功能。

!!! tip
    當你要實作安全防護與政策時，建議優先使用 ADK Plugin，這比起單純使用回呼函式更具模組化與彈性。詳情請參見
    [Callbacks and Plugins for Security Guardrails](/adk-docs/safety/#callbacks-and-plugins-for-security-guardrails)。

**如何加入回呼函式：**

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/callback_basic.py:callback_basic"
        ```
    
請提供原文、初始譯文、品質分析與改進建議，我才能根據您的要求進行改進並提供改進後的翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AgentWithBeforeModelCallback.java:init"
        ```

## 回呼機制：攔截與控制

當 Agent Development Kit (ADK) 框架執行到可以觸發回呼（callback）的時機點（例如：即將呼叫大型語言模型（LLM）之前），會檢查你是否為該 agent 提供了對應的回呼函式。如果有，框架就會執行你的函式。

**情境很重要：** 你的回呼函式並非在孤立狀態下被呼叫。框架會將特殊的**情境物件**（`CallbackContext` 或 `ToolContext`）作為參數傳入。這些物件包含 agent 執行當下的重要資訊，包括呼叫細節、session 狀態，以及可能的服務參考（如 artifacts 或記憶體）。你可以利用這些情境物件來理解目前狀況，並與框架互動。（完整細節請參閱專門的「情境物件」章節。）

**控制流程（核心機制）：** 回呼最強大的地方在於其**回傳值**會影響 agent 接下來的行為。這就是你如何攔截並控制執行流程的方式：

1. **`return None`（允許預設行為）：**  

    * 具體的回傳型別會依程式語言而異。在 Java 中，對應的回傳型別為 `Optional.empty()`。請參考 API 文件以取得各語言的詳細指引。
    * 這是標準做法，用來表示你的回呼已完成工作（例如：紀錄、檢查，或對*可變*輸入參數如 `llm_request` 做些微修改），並指示 ADK agent **繼續正常執行**。  
    * 對於 `before_*` 回呼（`before_agent`、`before_model`、`before_tool`），回傳 `None` 代表流程會進入下一步（執行 agent 邏輯、呼叫 LLM、執行工具）。  
    * 對於 `after_*` 回呼（`after_agent`、`after_model`、`after_tool`），回傳 `None` 則代表剛產生的結果（agent 輸出、LLM 回應、工具結果）會被直接採用。

2. **`return <Specific Object>`（覆寫預設行為）：**  

    * 回傳*特定型別的物件*（而非 `None`），就是**覆寫** ADK agent 預設行為的方法。框架會採用你回傳的物件，並*跳過*原本預期的步驟，或*取代*剛產生的結果。  
    * **`before_agent_callback` → `types.Content`**：跳過 agent 的主要執行邏輯（`_run_async_impl` / `_run_live_impl`）。回傳的 `Content` 物件會立即被視為本回合 agent 的最終輸出。適合直接處理簡單請求或強制存取控制。  
    * **`before_model_callback` → `LlmResponse`**：跳過對外部大型語言模型（Large Language Model）的呼叫。回傳的 `LlmResponse` 物件會被當作 LLM 實際回應來處理。非常適合實作輸入防護、提示驗證或回傳快取結果。  
    * **`before_tool_callback` → `dict` 或 `Map`**：跳過實際工具函式（或子 agent）的執行。回傳的 `dict` 會作為工具呼叫的結果，通常會再傳回給 LLM。非常適合驗證工具參數、套用政策限制，或回傳模擬／快取的工具結果。  
    * **`after_agent_callback` → `types.Content`**：*取代* agent 執行邏輯剛產生的 `Content`。  
    * **`after_model_callback` → `LlmResponse`**：*取代* 從 LLM 收到的 `LlmResponse`。適合用於輸出淨化、加上標準免責聲明，或修改 LLM 回應結構。  
    * **`after_tool_callback` → `dict` 或 `Map`**：*取代* 工具回傳的 `dict` 結果。可用於工具輸出後處理或標準化，讓結果在回傳 LLM 前先做調整。

**概念性程式碼範例（Guardrail）：**

以下範例展示了如何使用 `before_model_callback` 實作常見的 guardrail 模式。

<!-- ```py
--8<-- "examples/python/snippets/callbacks/before_model_callback.py"
``` -->
??? "Code"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_model_callback.py"
        ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeModelGuardrailExample.java:init"
        ```

透過理解回傳 `None` 與回傳特定物件這種機制，您可以精確控制 agent 的執行路徑，使 callbacks 成為使用 Agent Development Kit (ADK)（ADK）打造進階且可靠 agent 的重要工具。
