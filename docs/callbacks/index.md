# Callbacks：觀察、自訂與控制 agent 行為

## 介紹：什麼是 Callbacks？為什麼要使用它們？

Callbacks 是 Agent Development Kit (ADK) 的核心功能之一，提供了一種強大的機制，讓你能夠在 agent 執行過程中的特定、預先定義好的時機點進行攔截。透過 Callbacks，你可以觀察、自訂，甚至控制 agent 的行為，而無需修改 ADK 框架的核心程式碼。

**什麼是 Callbacks？** 本質上，Callbacks 就是你自行定義的標準函式。你可以在建立 agent 時，將這些函式與 agent 關聯。Agent Development Kit (ADK) 框架會在關鍵階段自動呼叫你的函式，讓你能夠觀察或介入 agent 的執行流程。你可以把它想像成 agent 處理流程中的檢查點：

* **在 agent 開始處理請求的主要工作之前，以及完成之後：** 當你要求 agent 執行某件事（例如：回答一個問題），它會運行內部邏輯來產生回應。
  * `Before Agent` callback 會在該請求的主要工作*開始之前*執行。
  * `After Agent` callback 會在 agent 完成該請求的所有步驟並準備好最終結果後、但在結果回傳*之前*執行。
  * 這裡所說的「主要工作」涵蓋了 agent 處理單一請求的*完整*流程。這可能包括決定是否呼叫大型語言模型 (LLM)、實際呼叫 LLM、決定是否使用工具、執行工具、處理結果，最後組合出答案。這些 Callbacks 基本上包裹了從接收輸入到產生最終輸出的整個互動過程。
* **在發送請求給大型語言模型 (Large Language Model, LLM) 前後：** 這類 Callbacks（`Before Model`、`After Model`）讓你能夠檢查或修改即將送往或剛從 LLM 回來的資料。
* **在執行工具（如 Python 函式或其他 agent）之前或之後：** 同樣地，`Before Tool` 和 `After Tool` Callbacks 提供你對 agent 所呼叫工具執行前後的控制點。

![intro_components.png](../assets/callback_flow.png)

**為什麼要使用 Callbacks？** Callbacks 能解鎖高度彈性，並賦予 agent 進階能力：

* **觀察與除錯：** 在關鍵步驟記錄詳細資訊，方便監控與問題排查。  
* **自訂與控制：** 根據你的邏輯，修改 agent 處理過程中的資料（如 LLM 請求或工具結果），甚至完全略過某些步驟。  
* **實作防護機制：** 強制執行安全規則、驗證輸入/輸出，或阻止不允許的操作。  
* **管理狀態：** 在執行期間讀取或動態更新 agent 的 session state。  
* **整合與擴充：** 觸發外部行動（API 呼叫、通知），或加入快取等功能。

!!! tip
    在實作安全防護措施與政策時，建議使用 ADK 插件（ADK Plugins），其模組化與彈性優於 Callbacks。詳情請參閱 [Callbacks and Plugins for Security Guardrails](/adk-docs/safety/#callbacks-and-plugins-for-security-guardrails)。

**如何新增：**

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/callback_basic.py:callback_basic"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AgentWithBeforeModelCallback.java:init"
        ```

## 回呼機制：攔截與控制

當 Agent Development Kit (ADK) 框架在執行過程中遇到可以執行回呼（callback）的時機點（例如：呼叫大型語言模型 (LLM) 之前），會檢查你是否為該 agent 提供了對應的回呼函式。如果有，框架就會執行你的函式。

**情境很重要：** 你的回呼函式並不是在真空中被呼叫。框架會將特殊的**情境物件**（`CallbackContext` 或 `ToolContext`）作為參數傳入。這些物件包含了 agent 執行當下的重要資訊，包括呼叫細節、session state，以及可能的服務參考（如 artifacts 或 memory）。你可以利用這些情境物件來理解目前的狀況，並與框架互動。（完整細節請參見專門的「情境物件」章節。）

**控制流程（核心機制）：** 回呼最強大的地方，在於它的**回傳值**會影響 agent 接下來的行為。這就是你攔截與控制執行流程的方式：

1. **`return None`（允許預設行為）：**  

    * 具體的回傳型別會依語言而異。在 Java 中，對應的回傳型別是 `Optional.empty()`。請參考 API 文件以取得各語言的指引。
    * 這是標準的方式，用來表示你的回呼已經完成（例如：日誌記錄、檢查、對*可變*輸入參數如 `llm_request` 進行小幅修改），並讓 ADK agent **繼續執行其正常流程**。
    * 對於 `before_*` 回呼（`before_agent`、`before_model`、`before_tool`），回傳 `None` 代表流程會進入下一步（執行 agent 邏輯、呼叫 LLM、執行工具）。
    * 對於 `after_*` 回呼（`after_agent`、`after_model`、`after_tool`），回傳 `None` 代表剛產生的結果（agent 輸出、LLM 回應、工具結果）會原封不動地被採用。

2. **`return <Specific Object>`（覆寫預設行為）：**  

    * 回傳*特定型別的物件*（而非 `None`），即可**覆寫** ADK agent 的預設行為。框架會直接採用你回傳的物件，並*跳過*原本預期的步驟，或*取代*剛產生的結果。
    * **`before_agent_callback` → `types.Content`**：跳過 agent 的主要執行邏輯（`_run_async_impl` / `_run_live_impl`）。回傳的 `Content` 物件會立即作為本回合 agent 的最終輸出。適合直接處理簡單請求或強制存取控制。
    * **`before_model_callback` → `LlmResponse`**：跳過對外部大型語言模型 (Large Language Model) 的呼叫。回傳的 `LlmResponse` 物件會被視為 LLM 的實際回應。非常適合實作輸入防護、提示驗證或回傳快取結果。
    * **`before_tool_callback` → `dict` 或 `Map`**：跳過實際工具函式（或子 agent）的執行。回傳的 `dict` 會作為工具呼叫的結果，通常接著會傳回給 LLM。適合驗證工具參數、套用政策限制，或回傳模擬／快取的工具結果。
    * **`after_agent_callback` → `types.Content`**：*取代* agent 執行邏輯剛產生的 `Content`。
    * **`after_model_callback` → `LlmResponse`**：*取代* 從 LLM 收到的 `LlmResponse`。適合用於輸出淨化、加上標準免責聲明，或修改 LLM 回應結構。
    * **`after_tool_callback` → `dict` 或 `Map`**：*取代* 工具回傳的 `dict` 結果。可用於對工具輸出進行後處理或標準化，然後再傳回給 LLM。

**概念性程式碼範例（Guardrail）：**

以下範例展示了使用 `before_model_callback` 來實作 guardrail 的常見模式。

<!-- ```py
--8<-- "examples/python/snippets/callbacks/before_model_callback.py"
``` -->
??? "Code"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_model_callback.py"
        ```
    
    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeModelGuardrailExample.java:init"
        ```

透過理解回傳 `None` 與回傳特定物件這種機制，您可以精確地控制 agent 的執行路徑，使 Callbacks 成為使用 Agent Development Kit (ADK) 建構高階且可靠 agent 的重要工具。
