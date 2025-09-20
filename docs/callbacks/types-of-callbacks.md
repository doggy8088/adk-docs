# 回呼（Callback）的類型

本框架提供多種回呼（callback）類型，可在 agent 執行過程中的不同階段觸發。了解每種回呼觸發的時機以及其所接收的上下文（context），是有效運用這些回呼的關鍵。

## Agent 生命週期回呼（Agent Lifecycle Callbacks）

這些回呼可用於任何繼承自 `BaseAgent` 的 agent（包含 `LlmAgent`、`SequentialAgent`、`ParallelAgent`、`LoopAgent` 等）。

!!! Note
    具體的方法名稱或回傳型別可能會因 SDK 語言而略有不同（例如，在 Python 中回傳 `None`，在 Java 中則回傳 `Optional.empty()` 或 `Maybe.empty()`）。詳細資訊請參閱各語言的 API 文件。

### Before Agent Callback

**觸發時機：** 在 agent 的 `_run_async_impl`（或 `_run_live_impl`）方法執行*之前*立即呼叫。此時已建立 agent 的 `InvocationContext`，但其核心邏輯尚未開始執行。

**用途：** 非常適合用於設定僅本次 agent 執行所需的資源或狀態、在執行開始前對 session 狀態（`callback_context.state`）進行驗證檢查、記錄 agent 活動的進入點，或在核心邏輯使用前，對呼叫上下文進行調整。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_agent_callback.py"
        ```
    
# Types of Callbacks

Callbacks are a powerful mechanism for customizing and extending the behavior of your agents. In the Agent Development Kit (ADK), callbacks allow you to hook into various stages of an agent's lifecycle, enabling you to monitor, modify, or augment the agent's actions and responses.

This document describes the different types of callbacks available in the ADK and how to use them effectively.

## What is a Callback?

A callback is a function or method that is invoked at a specific point during the execution of your agent. Callbacks can be used for logging, monitoring, modifying agent behavior, or integrating with external systems.

For example, you might use a callback to log every tool function call, or to modify the agent's response before it is sent to the user.

## Types of Callbacks

The ADK supports several types of callbacks, each corresponding to a different stage in the agent's lifecycle:

- **Pre-action callbacks**: Invoked before the agent takes an action (e.g., before calling a tool function).
- **Post-action callbacks**: Invoked after the agent takes an action (e.g., after receiving a tool function result).
- **Pre-response callbacks**: Invoked before the agent sends a response to the user.
- **Post-response callbacks**: Invoked after the agent sends a response to the user.
- **Error callbacks**: Invoked when an error occurs during agent execution.

Each callback type receives different arguments, depending on the context in which it is called.

## Registering Callbacks

To use a callback, you must register it with your agent. This is typically done by passing the callback function to the agent's constructor or by using a registration method.

```python
def my_pre_action_callback(context):
    print("About to take an action:", context)

agent = LlmAgent(
    ...,
    pre_action_callbacks=[my_pre_action_callback]
)
```

You can register multiple callbacks for each type. They will be called in the order they were registered.

## Example: Logging Tool Calls

Here's an example of a post-action callback that logs every tool function call:

```python
def log_tool_call(context, result):
    print(f"Tool {context.tool_name} called with args {context.args}, result: {result}")

agent = LlmAgent(
    ...,
    post_action_callbacks=[log_tool_call]
)
```

## Modifying Agent Behavior

Callbacks can also be used to modify the agent's behavior. For example, a pre-response callback could modify the agent's response before it is sent to the user:

```python
def modify_response(context, response):
    response.text = response.text.upper()
    return response

agent = LlmAgent(
    ...,
    pre_response_callbacks=[modify_response]
)
```

## Error Handling with Callbacks

Error callbacks allow you to handle errors gracefully. For example, you could log errors or send notifications:

```python
def handle_error(context, error):
    print(f"Error occurred: {error}")

agent = LlmAgent(
    ...,
    error_callbacks=[handle_error]
)
```

## Summary

Callbacks provide a flexible way to customize agent behavior in the Agent Development Kit (ADK). By hooking into different stages of the agent's lifecycle, you can monitor, modify, or extend your agents to fit your application's needs.



---

# 回呼函式的類型

回呼函式（Callback）是一種強大的機制，可用於自訂與擴充您的代理（agent）行為。在 Agent Development Kit (ADK)（ADK）中，回呼函式讓您能夠在代理生命週期的不同階段插入自訂邏輯，協助您監控、修改或增強代理的行為與回應。

本文件將說明 ADK 支援的各種回呼函式類型，以及如何有效運用這些回呼函式。

## 什麼是回呼函式？

回呼函式是在代理執行過程中的特定時機被呼叫的函式或方法。您可以利用回呼函式進行日誌紀錄、監控、調整代理行為，或與外部系統整合。

舉例來說，您可以使用回呼函式來記錄每一次工具函式（tool function）呼叫，或在代理將回應傳送給使用者前修改該回應內容。

## 回呼函式的類型

ADK 支援多種回呼函式類型，分別對應代理生命週期的不同階段：

- **前置動作回呼（Pre-action callbacks）**：在代理執行某個動作之前（例如呼叫工具函式前）被觸發。
- **後置動作回呼（Post-action callbacks）**：在代理執行某個動作之後（例如取得工具函式結果後）被觸發。
- **前置回應回呼（Pre-response callbacks）**：在代理將回應傳送給使用者之前被觸發。
- **後置回應回呼（Post-response callbacks）**：在代理將回應傳送給使用者之後被觸發。
- **錯誤回呼（Error callbacks）**：當代理執行過程發生錯誤時被觸發。

每種回呼函式類型會根據其呼叫時的情境，接收不同的參數。

## 註冊回呼函式

若要使用回呼函式，您必須將其註冊到您的代理中。通常可在建立代理時，透過建構子傳入回呼函式，或使用註冊方法進行註冊。

```python
def my_pre_action_callback(context):
    print("About to take an action:", context)

agent = LlmAgent(
    ...,
    pre_action_callbacks=[my_pre_action_callback]
)
```

每種回呼函式類型都可以註冊多個回呼函式，並會依註冊順序依序呼叫。

## 範例：記錄工具呼叫

以下是一個後置動作回呼（post-action callback）的範例，用來記錄每一次工具函式的呼叫：

```python
def log_tool_call(context, result):
    print(f"Tool {context.tool_name} called with args {context.args}, result: {result}")

agent = LlmAgent(
    ...,
    post_action_callbacks=[log_tool_call]
)
```

## 修改代理行為

回呼函式也可用於修改代理的行為。例如，您可以透過前置回應回呼（pre-response callback）在回應送出前修改內容：

```python
def modify_response(context, response):
    response.text = response.text.upper()
    return response

agent = LlmAgent(
    ...,
    pre_response_callbacks=[modify_response]
)
```

## 使用回呼函式處理錯誤

錯誤回呼（error callbacks）可協助您優雅地處理錯誤，例如記錄錯誤或發送通知：

```python
def handle_error(context, error):
    print(f"Error occurred: {error}")

agent = LlmAgent(
    ...,
    error_callbacks=[handle_error]
)
```

## 小結

回呼函式為 Agent Development Kit (ADK) 提供靈活的代理自訂能力。透過在代理生命週期的不同階段插入自訂邏輯，您可以根據應用需求，監控、修改或擴充您的代理行為。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeAgentCallbackExample.java:init"
        ```


**關於`before_agent_callback`範例的說明：**

* **展示內容：** 此範例展示了`before_agent_callback`。這個 callback 會在 agent 的主要處理邏輯開始執行之前（針對特定請求）被觸發。
* **運作方式：** callback 函式（`check_if_agent_should_run`）會檢查 session 狀態中的一個旗標（`skip_llm_agent`）。
    * 如果該旗標為`True`，callback 會回傳`types.Content`物件。這會告訴 Agent Development Kit (ADK) 框架**完全略過** agent 的主要執行流程，並將 callback 回傳的內容作為最終回應。
    * 如果該旗標為`False`（或未設定），callback 則回傳`None`或空物件。這會告訴 Agent Development Kit (ADK) 框架**繼續**執行 agent 的正常流程（本例中即呼叫大型語言模型 (LLM)）。
* **預期結果：** 你會看到兩種情境：
    1. 在 session *有*`skip_llm_agent: True`狀態時，agent 的 LLM 呼叫會被略過，輸出直接來自 callback（如 "Agent... skipped..."）。
    2. 在 session *沒有*該狀態旗標時，callback 允許 agent 正常執行，你會看到 LLM 的實際回應（例如 "Hello!"）。
* **理解 callback：** 這凸顯了`before_` callback 如同**守門員**，讓你能在主要步驟執行*前*攔截流程，並可根據檢查結果（如狀態、輸入驗證、權限等）決定是否阻止後續執行。

### After Agent Callback

**觸發時機：** 當 agent 的`_run_async_impl`（或`_run_live_impl`）方法成功完成後*立即*呼叫。若 agent 因`before_agent_callback`回傳內容而被略過，或在 agent 執行期間設置了`end_invocation`，則**不會**執行此 callback。

**用途：** 適合用於清理任務、執行後驗證、記錄 agent 活動完成、修改最終狀態，或增強／取代 agent 的最終輸出。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_agent_callback.py"
        ```
    
請提供原文、初始譯文、品質分析與改進建議，我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterAgentCallbackExample.java:init"
        ```


**`after_agent_callback` 範例說明：**

* **展示內容：** 此範例展示了`after_agent_callback`。這個 callback 會在 agent 的主要處理邏輯完成並產生結果後、但在結果最終定案並返回之前執行。
* **運作方式：** callback 函式（`modify_output_after_agent`）會檢查 session 狀態中的一個旗標（`add_concluding_note`）。
    * 如果該旗標為 `True`，callback 會回傳一個*新的*`types.Content` 物件。這會告訴 Agent Development Kit (ADK) 框架，用 callback 回傳的內容**取代** agent 原本的輸出。
    * 如果該旗標為 `False`（或未設定），callback 會回傳 `None` 或空物件。這會告訴 Agent Development Kit (ADK) 框架**使用** agent 產生的原始輸出。
* **預期結果：** 你會看到兩種情境：
    1. 在*沒有*`add_concluding_note: True` 狀態的 session 中，callback 允許 agent 的原始輸出（"Processing complete!"）被使用。
    2. 在有該狀態旗標的 session 中，callback 會攔截 agent 的原始輸出並以自己的訊息（"Concluding note added..."）取代。
* **理解 Callback：** 這說明了`after_` callback 如何實現**後處理**或**修改**。你可以檢查某個步驟（agent 執行）的結果，並根據你的邏輯決定讓它通過、修改，或完全取代。

## LLM 互動 Callback

這些 callback 專為`LlmAgent`設計，提供與大型語言模型（Large Language Model, LLM）互動時的掛鉤點。

### Before Model Callback

**時機：** 在 `generate_content_async`（或等價操作）請求於`LlmAgent`流程中送往 LLM 前被呼叫。

**用途：** 可檢查並修改即將送往 LLM 的請求。常見應用包含動態新增指令、根據狀態注入 few-shot 範例、調整模型設定、實作防護措施（如髒話過濾）、或實作請求層級快取。

**回傳值效果：**  
如果 callback 回傳 `None`（或在 Java 中為 `Maybe.empty()` 物件），LLM 會照常執行流程。若 callback 回傳 `LlmResponse` 物件，則對 LLM 的呼叫會**被跳過**，直接使用回傳的 `LlmResponse` 作為模型回應。這對於實作防護措施或快取非常有用。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_model_callback.py"
        ```
    
當然可以！請提供原文、初始譯文、品質分析與改進建議，我會根據這些資訊給出改進後的翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeModelCallbackExample.java:init"
        ```

### After Model Callback

**時機：** 當從大型語言模型 (LLM) 收到回應（`LlmResponse`）後，且在被呼叫的 agent 進一步處理之前執行。

**目的：** 允許檢查或修改原始的 LLM 回應。常見用途包括：

* 記錄模型輸出、
* 重新格式化回應、
* 過濾模型產生的敏感資訊、
* 從 LLM 回應中解析結構化資料並儲存到 `callback_context.state`，
* 或處理特定的錯誤碼。

??? "Code"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_model_callback.py"
        ```
    
請提供原文、初始譯文、品質分析與改進建議，我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterModelCallbackExample.java:init"
        ```

## 工具執行回呼（Tool Execution Callbacks）

這些回呼同樣是針對 `LlmAgent` 而設計，並會在執行工具（包括 `FunctionTool`、`AgentTool` 等）時觸發，這些工具可能是大型語言模型 (LLM) 所請求的。

### 工具執行前回呼（Before Tool Callback）

**時機：** 當大型語言模型 (LLM) 已為特定工具產生 function call，且即將呼叫該工具的 `run_async` 方法前觸發。

**用途：** 可用於檢查與修改工具參數、在執行前進行授權檢查、記錄工具使用嘗試，或實作工具層級的快取。

**回傳值影響：**

1. 若回呼回傳 `None`（或在 Java 中回傳 `Maybe.empty()` 物件），則會以（可能已被修改的）`args` 執行工具的 `run_async` 方法。  
2. 若回傳 dictionary（或在 Java 中回傳 `Map`），則會**跳過**工具的 `run_async` 方法。回傳的 dictionary 會直接作為該工具呼叫的結果。這對於快取或覆寫工具行為非常實用。  


??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/before_tool_callback.py"
        ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/BeforeToolCallbackExample.java:init"
        ```



### After Tool Callback

**時機：** 在工具的 `run_async` 方法成功完成後立即呼叫。

**目的：** 允許在結果回傳給大型語言模型 (LLM)（可能經過摘要處理）之前，檢查與修改工具的結果。這對於記錄工具結果、後處理或格式化結果，或將結果中特定部分儲存到 session 狀態特別有用。

**回傳值影響：**

1. 如果 callback 回傳 `None`（或在 Java 中為 `Maybe.empty()` 物件），則會使用原本的 `tool_response`。  
2. 如果回傳新的 dictionary，則會**取代**原本的 `tool_response`。這允許你修改或過濾 LLM 所看到的結果。

??? "程式碼"
    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/callbacks/after_tool_callback.py"
        ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/callbacks/AfterToolCallbackExample.java:init"
        ```
