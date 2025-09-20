!!! warning "Advanced Concept"

    直接實作 `_run_async_impl`（或其他語言中的對應類別）來建立自訂 agent，雖然能提供強大的控制能力，但相較於使用預先定義的 `LlmAgent` 或標準的 `WorkflowAgent` 類型來說，實作上會更為複雜。我們建議在挑戰自訂協作邏輯之前，先充分理解這些基礎的 agent 類型。

# 自訂 agent

自訂 agent 提供了 Agent Development Kit (ADK) 中最高的彈性，讓你可以直接繼承自 `BaseAgent`，並實作自己的控制流程，從而定義**任意的協作邏輯**。這種方式超越了 `SequentialAgent`、`LoopAgent` 和 `ParallelAgent` 等預先定義的模式，使你能夠建立高度特定且複雜的 agent 工作流程。

## 介紹：超越預設工作流程

### 什麼是自訂 Agent？

自訂 Agent 基本上是你所建立、繼承自 `google.adk.agents.BaseAgent` 的任何類別，並在 `_run_async_impl` 非同步方法中實作其核心執行邏輯。你可以完全掌控這個方法如何呼叫其他 agent（子 agent）、管理狀態，以及處理事件。 

!!! Note
    實作 agent 核心非同步邏輯的方法名稱，會依不同 SDK 語言略有差異（例如：Java 中為 `runAsyncImpl`，Python 中為 `_run_async_impl`）。詳細資訊請參閱各語言的 API 文件說明。

### 為什麼要使用自訂 agent？

雖然標準的 [Workflow Agents](workflow-agents/index.md)（`SequentialAgent`、`LoopAgent`、`ParallelAgent`）已涵蓋常見的協作流程模式，但當你的需求包含以下情境時，就需要使用自訂 agent：

* **條件邏輯（Conditional Logic）：** 根據執行時條件或前一步驟的結果，執行不同的子 agent 或採取不同的流程分支。
* **複雜狀態管理（Complex State Management）：** 在工作流程中，實作超越單純順序傳遞的複雜狀態維護與更新邏輯。
* **外部整合（External Integrations）：** 在協作流程控制中，直接整合對外部 API、資料庫或自訂函式庫的呼叫。
* **動態 agent 選擇（Dynamic Agent Selection）：** 根據情境或輸入的動態評估，決定接下來要執行哪個子 agent（或多個）。
* **獨特的工作流程模式（Unique Workflow Patterns）：** 實作不屬於標準順序、平行或迴圈結構的協作邏輯。

![intro_components.png](../assets/custom-agent-flow.png)

## 實作自訂邏輯：

任何自訂 agent 的核心，就是你定義其獨特非同步行為的方法。這個方法讓你能協調子 agent，並管理執行流程。

=== "Python"

      The heart of any custom agent is the `_run_async_impl` method. This is where you define its unique behavior.
      
      * **Signature:** `async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:`
      * **Asynchronous Generator:** It must be an `async def` function and return an `AsyncGenerator`. This allows it to `yield` events produced by sub-agents or its own logic back to the runner.
      * **`ctx` (InvocationContext):** Provides access to crucial runtime information, most importantly `ctx.session.state`, which is the primary way to share data between steps orchestrated by your custom agent.

=== "Java"

    The heart of any custom agent is the `runAsyncImpl` method, which you override from `BaseAgent`.

    *   **Signature:** `protected Flowable<Event> runAsyncImpl(InvocationContext ctx)`
    *   **Reactive Stream (`Flowable`):** It must return an `io.reactivex.rxjava3.core.Flowable<Event>`. This `Flowable` represents a stream of events that will be produced by the custom agent's logic, often by combining or transforming multiple `Flowable` from sub-agents.
    *   **`ctx` (InvocationContext):** Provides access to crucial runtime information, most importantly `ctx.session().state()`, which is a `java.util.concurrent.ConcurrentMap<String, Object>`. This is the primary way to share data between steps orchestrated by your custom agent.

**核心非同步方法中的主要功能：**

=== "Python"

    1. **呼叫子 agent：** 你可以透過呼叫子 agent（通常會以實例屬性如 `self.my_llm_agent` 儲存），使用它們的 `run_async` 方法並讓渡（yield）它們的事件：

          ```python
          async for event in self.some_sub_agent.run_async(ctx):
              # Optionally inspect or log the event
              yield event # Pass the event up
          ```

    2. **管理狀態：** 透過讀取與寫入 session state 字典（`ctx.session.state`），可在子 agent 呼叫之間傳遞資料或進行決策：
          ```python
          # Read data set by a previous agent
          previous_result = ctx.session.state.get("some_key")
      
          # Make a decision based on state
          if previous_result == "some_value":
              # ... call a specific sub-agent ...
          else:
              # ... call another sub-agent ...
      
          # Store a result for a later step (often done via a sub-agent's output_key)
          # ctx.session.state["my_custom_result"] = "calculated_value"
          ```

    3. **實作控制流程：** 使用標準的 Python 結構（`if`/`elif`/`else`、`for`/`while` 迴圈、`try`/`except`）來建立複雜、有條件或具迭代性的工作流程，並整合你的子 agent。

=== "Java"

    1. **呼叫子 agent：** 你可以透過呼叫子 agent（通常以實例屬性或物件形式儲存）的非同步 run 方法，並回傳它們的事件串流：

           通常你會使用 RxJava 的運算子（如 `concatWith`、`flatMapPublisher` 或 `concatArray`）來串接來自子 agent 的 `Flowable`。

           ```java
           // Example: Running one sub-agent
           // return someSubAgent.runAsync(ctx);
      
           // Example: Running sub-agents sequentially
           Flowable<Event> firstAgentEvents = someSubAgent1.runAsync(ctx)
               .doOnNext(event -> System.out.println("Event from agent 1: " + event.id()));
      
           Flowable<Event> secondAgentEvents = Flowable.defer(() ->
               someSubAgent2.runAsync(ctx)
                   .doOnNext(event -> System.out.println("Event from agent 2: " + event.id()))
           );
      
           return firstAgentEvents.concatWith(secondAgentEvents);
           ```
           `Flowable.defer()` 通常用於後續階段，如果這些階段的執行依賴於前一階段的完成或狀態時。

    2. **管理狀態：** 透過讀取和寫入 session state，在子 agent 呼叫之間傳遞資料或進行決策。session state 是透過 `ctx.session().state()` 取得的 `java.util.concurrent.ConcurrentMap<String, Object>`。
        
        ```java
        // Read data set by a previous agent
        Object previousResult = ctx.session().state().get("some_key");

        // Make a decision based on state
        if ("some_value".equals(previousResult)) {
            // ... logic to include a specific sub-agent's Flowable ...
        } else {
            // ... logic to include another sub-agent's Flowable ...
        }

        // Store a result for a later step (often done via a sub-agent's output_key)
        // ctx.session().state().put("my_custom_result", "calculated_value");
        ```

    3. **實作控制流程：** 使用標準語言結構（`if`/`else`、迴圈、`try`/`catch`）結合 reactive operators（如 RxJava），可以建立複雜的工作流程。

          *   **條件判斷：** 使用 `Flowable.defer()` 來根據條件選擇要訂閱哪個 `Flowable`，或在串流中過濾事件時使用 `filter()`。
          *   **迭代處理：** 可以使用像是 `repeat()`、`retry()` 的運算子，或透過設計 `Flowable` 鏈，在條件下遞迴呼叫自身的部分（通常會用 `flatMapPublisher` 或 `concatMap` 來管理）。

## 管理子 agent 與狀態

通常，自訂 agent 會協調其他 agent（如 `LlmAgent`、`LoopAgent` 等）。

* **初始化：** 通常會將這些子 agent 的實例傳入自訂 agent 的建構子，並將其儲存為實例欄位/屬性（例如：`this.story_generator = story_generator_instance` 或 `self.story_generator = story_generator_instance`）。這樣可以在自訂 agent 的核心非同步執行邏輯中（如：`_run_async_impl` 方法）存取這些子 agent。
* **子 agent 清單：** 初始化 `BaseAgent` 時，使用其 `super()` 建構子，應傳入 `sub agents` 清單。這個清單會告訴 Agent Development Kit (ADK) 框架，哪些 agent 屬於這個自訂 agent 的直接階層。這對於框架的生命週期管理、內省（introspection），以及未來可能的路由功能都很重要，即使你的核心執行邏輯（`_run_async_impl`）是直接透過 `self.xxx_agent` 呼叫這些 agent。請將自訂邏輯中會在頂層直接呼叫的 agent 都包含進來。
* **狀態：** 如前所述，`ctx.session.state` 是子 agent（特別是使用 `output key` 的 `LlmAgent`）將結果回傳給協調者，以及協調者將必要輸入下傳的標準方式。

## 設計模式範例：`StoryFlowAgent`

以下用一個設計模式範例來說明自訂 agent 的強大功能：一個具備條件邏輯的多階段內容生成工作流程。

**目標：** 建立一個系統，能夠產生故事，並透過批評與修訂反覆優化，進行最終檢查，且最關鍵的是，*如果最終語氣檢查未通過，則重新生成故事*。

**為什麼要自訂？** 這裡需要自訂 agent 的核心原因是**根據語氣檢查結果進行條件式的重新生成**。標準工作流程 agent 並未內建根據子 agent 任務結果進行條件分支的能力。我們需要在協調者中加入自訂邏輯（`if tone == "negative": ...`）。

---

### 第一部分：簡化版自訂 agent 初始化 { #part-1-simplified-custom-agent-initialization }

=== "Python"

    We define the `StoryFlowAgent` inheriting from `BaseAgent`. In `__init__`, we store the necessary sub-agents (passed in) as instance attributes and tell the `BaseAgent` framework about the top-level agents this custom agent will directly orchestrate.
    
    ```python
    --8<-- "examples/python/snippets/agents/custom-agent/storyflow_agent.py:init"
    ```

=== "Java"

    We define the `StoryFlowAgentExample` by extending `BaseAgent`. In its **constructor**, we store the necessary sub-agent instances (passed as parameters) as instance fields. These top-level sub-agents, which this custom agent will directly orchestrate, are also passed to the `super` constructor of `BaseAgent` as a list.

    ```java
    --8<-- "examples/java/snippets/src/main/java/agents/StoryFlowAgentExample.java:init"
    ```
---

### 第 2 部分：定義自訂執行邏輯 { #part-2-defining-the-custom-execution-logic }

=== "Python"

    This method orchestrates the sub-agents using standard Python async/await and control flow.
    
    ```python
    --8<-- "examples/python/snippets/agents/custom-agent/storyflow_agent.py:executionlogic"
    ```
    **Explanation of Logic:**

    1. The initial `story_generator` runs. Its output is expected to be in `ctx.session.state["current_story"]`.
    2. The `loop_agent` runs, which internally calls the `critic` and `reviser` sequentially for `max_iterations` times. They read/write `current_story` and `criticism` from/to the state.
    3. The `sequential_agent` runs, calling `grammar_check` then `tone_check`, reading `current_story` and writing `grammar_suggestions` and `tone_check_result` to the state.
    4. **Custom Part:** The `if` statement checks the `tone_check_result` from the state. If it's "negative", the `story_generator` is called *again*, overwriting the `current_story` in the state. Otherwise, the flow ends.


=== "Java"
    
    The `runAsyncImpl` method orchestrates the sub-agents using RxJava's Flowable streams and operators for asynchronous control flow.

    ```java
    --8<-- "examples/java/snippets/src/main/java/agents/StoryFlowAgentExample.java:executionlogic"
    ```
    **Explanation of Logic:**

    1. The initial `storyGenerator.runAsync(invocationContext)` Flowable is executed. Its output is expected to be in `invocationContext.session().state().get("current_story")`.
    2. The `loopAgent's` Flowable runs next (due to `Flowable.concatArray` and `Flowable.defer`). The LoopAgent internally calls the `critic` and `reviser` sub-agents sequentially for up to `maxIterations`. They read/write `current_story` and `criticism` from/to the state.
    3. Then, the `sequentialAgent's` Flowable executes. It calls the `grammar_check` then `tone_check`, reading `current_story` and writing `grammar_suggestions` and `tone_check_result` to the state.
    4. **Custom Part:** After the sequentialAgent completes, logic within a `Flowable.defer` checks the "tone_check_result" from `invocationContext.session().state()`. If it's "negative", the `storyGenerator` Flowable is *conditionally concatenated* and executed again, overwriting "current_story". Otherwise, an empty Flowable is used, and the overall workflow proceeds to completion.

---

### 第 3 部分：定義大型語言模型 (LLM) 子代理 { #part-3-defining-the-llm-sub-agents }

這些是標準的 `LlmAgent` 定義，負責特定任務。它們的 `output key` 參數對於將結果放入 `session.state` 中至關重要，其他 agent 或自訂協調器可以存取這些結果。

!!! tip "Direct State Injection in Instructions"
    請注意 `story_generator` 的指令。`{var}` 語法是一個占位符。在指令傳送給大型語言模型 (LLM) 之前，Agent Development Kit (ADK) 框架會自動將 (例如：`{topic}`) 替換為 `session.state['topic']` 的值。這是建議為 agent 提供情境資訊的方式，也就是在指令中使用樣板（templating）。如需更多細節，請參閱 [State documentation](../sessions/state.md#accessing-session-state-in-agent-instructions)。

=== "Python"

    ```python
    GEMINI_2_FLASH = "gemini-2.0-flash" # Define model constant
    --8<-- "examples/python/snippets/agents/custom-agent/storyflow_agent.py:llmagents"
    ```
=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/agents/StoryFlowAgentExample.java:llmagents"
    ```

---

### 第 4 部分：實例化並執行自訂 agent { #part-4-instantiating-and-running-the-custom-agent }

最後，您可以實例化您的 `StoryFlowAgent`，並像平常一樣使用 `Runner`。

=== "Python"

    ```python
    --8<-- "examples/python/snippets/agents/custom-agent/storyflow_agent.py:story_flow_agent"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/agents/StoryFlowAgentExample.java:story_flow_agent"
    ```

*(注意：完整可執行程式碼（包含 import 與執行邏輯）請參見下方連結。)*

---

## 完整程式碼範例

???+ "Storyflow Agent"

    === "Python"
    
        ```python
        # Full runnable code for the StoryFlowAgent example
        --8<-- "examples/python/snippets/agents/custom-agent/storyflow_agent.py"
        ```
    
    === "Java"
    
        ```java
        # Full runnable code for the StoryFlowAgent example
        --8<-- "examples/java/snippets/src/main/java/agents/StoryFlowAgentExample.java:full_code"
        ```
