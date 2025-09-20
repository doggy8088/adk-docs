# 執行階段（Runtime）

## 什麼是執行階段（Runtime）？

Agent Development Kit (ADK) 執行階段（Runtime）是支援您的 agent 應用程式在使用者互動過程中運作的底層引擎。它負責將您所定義的 agent、tools 以及 Callbacks 組織起來，並在回應使用者輸入時協調它們的執行，管理資訊流、狀態變更，以及與外部服務（如大型語言模型 (LLM) 或儲存空間）的互動。

您可以將 Runtime 想像成 agent 應用程式的**「引擎」**。您負責定義各個零件（agent、tools），而 Runtime 則負責將這些零件串接並協同運作，以滿足使用者的需求。

## 核心概念：事件迴圈（Event Loop）

在核心設計上，Agent Development Kit (ADK) 執行階段（Runtime）運作於**事件迴圈（Event Loop）**之上。這個迴圈促成了 `Runner` 元件與您所定義的「執行邏輯」（包含您的 Agents、它們所發起的大型語言模型 (LLM) 呼叫、Callbacks 及 Tools）之間的雙向溝通。

![intro_components.png](../assets/event-loop.png)

簡單來說：

1. `Runner` 接收到使用者查詢後，會請求主要的 `Agent` 開始處理。
2. `Agent`（以及其相關邏輯）會持續執行，直到有資訊需要回報（例如回應、請求使用工具、或狀態變更）——這時它會**讓渡（yield）**或**發出（emit）**一個 `Event`。
3. `Runner` 會接收到這個 `Event`，處理任何相關動作（例如透過 `Services` 儲存狀態變更），並將事件轉發出去（例如傳送到使用者介面）。
4. 只有在 `Runner` 處理完該事件之後，`Agent` 的邏輯才會**從暫停處繼續執行**，此時它可能已經看到 Runner 所提交的變更結果。
5. 這個循環會重複進行，直到 agent 對於目前的使用者查詢沒有更多事件需要讓渡。

這種事件驅動的迴圈，是 ADK 執行您的 agent 程式碼時的基本運作模式。

## 核心脈動：事件迴圈（Event Loop）— 內部運作

事件迴圈（Event Loop）是定義 `Runner` 與您的自訂程式碼（Agents、Tools、Callbacks，設計文件中統稱為「執行邏輯」或「邏輯元件」）之間互動的核心運作模式。它建立了明確的責任分工：

!!! Note
    具體的方法名稱與參數名稱可能會依不同 SDK 語言略有差異（例如：Java 中的 `agent_to_run.runAsync(...)`，Python 中的 `agent_to_run.run_async(...)`）。詳細資訊請參閱各語言的 API 文件說明。

### Runner 的角色（協調者）

`Runner` 作為單一使用者呼叫的中央協調者。其在迴圈中的職責包括：

1. **啟動：**接收終端使用者的查詢（`new_message`），並通常透過 `SessionService` 將其附加到 session history。
2. **啟動流程：**呼叫主要 agent 的執行方法（例如 `agent_to_run.run_async(...)`）以啟動事件產生流程。
3. **接收與處理：**等待 agent 邏輯`yield` 或 `emit` 一個 `Event`。收到事件後，Runner 會**立即處理**該事件。這包含：
      * 使用已設定的 `Services`（`SessionService`、`ArtifactService`、`MemoryService`）來提交 `event.actions` 中所指示的變更（如 `state_delta`、`artifact_delta`）。
      * 執行其他內部記錄作業。
4. **向上游讓渡：**將已處理的事件轉發（例如給呼叫應用程式或 UI 進行渲染）。
5. **迭代：**通知 agent 邏輯該讓渡事件的處理已完成，使其能繼續並產生*下一個*事件。

*概念性 Runner 迴圈：*

=== "Python"

    ```py
    # Simplified view of Runner's main loop logic
    def run(new_query, ...) -> Generator[Event]:
        # 1. Append new_query to session event history (via SessionService)
        session_service.append_event(session, Event(author='user', content=new_query))
    
        # 2. Kick off event loop by calling the agent
        agent_event_generator = agent_to_run.run_async(context)
    
        async for event in agent_event_generator:
            # 3. Process the generated event and commit changes
            session_service.append_event(session, event) # Commits state/artifact deltas etc.
            # memory_service.update_memory(...) # If applicable
            # artifact_service might have already been called via context during agent run
    
            # 4. Yield event for upstream processing (e.g., UI rendering)
            yield event
            # Runner implicitly signals agent generator can continue after yielding
    ```

=== "Java"

    ```java
    // Simplified conceptual view of the Runner's main loop logic in Java.
    public Flowable<Event> runConceptual(
        Session session,                  
        InvocationContext invocationContext, 
        Content newQuery                
        ) {
    
        // 1. Append new_query to session event history (via SessionService)
        // ...
        sessionService.appendEvent(session, userEvent).blockingGet();
    
        // 2. Kick off event stream by calling the agent
        Flowable<Event> agentEventStream = agentToRun.runAsync(invocationContext);
    
        // 3. Process each generated event, commit changes, and "yield" or "emit"
        return agentEventStream.map(event -> {
            // This mutates the session object (adds event, applies stateDelta).
            // The return value of appendEvent (a Single<Event>) is conceptually
            // just the event itself after processing.
            sessionService.appendEvent(session, event).blockingGet(); // Simplified blocking call
    
            // memory_service.update_memory(...) // If applicable - conceptual
            // artifact_service might have already been called via context during agent run
    
            // 4. "Yield" event for upstream processing
            //    In RxJava, returning the event in map effectively yields it to the next operator or subscriber.
            return event;
        });
    }
    ```

### 執行邏輯的角色（Agent、Tool、Callback）

你在 agent、tools 和 callbacks 中撰寫的程式碼，負責實際的運算與決策。它與循環（loop）的互動包含：

1. **執行（Execute）：** 根據當前的 `InvocationContext` 執行其邏輯，包括「執行恢復時」的 session state。
2. **讓渡（Yield）：** 當邏輯需要進行溝通（例如傳送訊息、呼叫工具、回報狀態變更）時，會建構一個包含相關內容與動作的 `Event`，然後將此事件 `yield` 回 `Runner`。
3. **暫停（Pause）：** 重要的是，agent 邏輯的執行會在 `yield` 陳述式（或 RxJava 中的 `return`）之後**立即暫停**。此時會等待 `Runner` 完成步驟 3（處理與提交）。
4. **恢復（Resume）：** *僅在* `Runner` 處理完讓渡的事件後，agent 邏輯才會從緊接在 `yield` 之後的陳述式繼續執行。
5. **取得更新後的狀態（See Updated State）：** 恢復執行時，agent 邏輯現在可以可靠地存取 session state（`ctx.session.state`），此狀態反映了由 `Runner` 針對*先前讓渡*事件所提交的變更。

*概念性執行邏輯：*

=== "Python"

    ```py
    # Simplified view of logic inside Agent.run_async, callbacks, or tools
    
    # ... previous code runs based on current state ...
    
    # 1. Determine a change or output is needed, construct the event
    # Example: Updating state
    update_data = {'field_1': 'value_2'}
    event_with_state_change = Event(
        author=self.name,
        actions=EventActions(state_delta=update_data),
        content=types.Content(parts=[types.Part(text="State updated.")])
        # ... other event fields ...
    )
    
    # 2. Yield the event to the Runner for processing & commit
    yield event_with_state_change
    # <<<<<<<<<<<< EXECUTION PAUSES HERE >>>>>>>>>>>>
    
    # <<<<<<<<<<<< RUNNER PROCESSES & COMMITS THE EVENT >>>>>>>>>>>>
    
    # 3. Resume execution ONLY after Runner is done processing the above event.
    # Now, the state committed by the Runner is reliably reflected.
    # Subsequent code can safely assume the change from the yielded event happened.
    val = ctx.session.state['field_1']
    # here `val` is guaranteed to be "value_2" (assuming Runner committed successfully)
    print(f"Resumed execution. Value of field_1 is now: {val}")
    
    # ... subsequent code continues ...
    # Maybe yield another event later...
    ```

=== "Java"

    ```java
    // Simplified view of logic inside Agent.runAsync, callbacks, or tools
    // ... previous code runs based on current state ...
    
    // 1. Determine a change or output is needed, construct the event
    // Example: Updating state
    ConcurrentMap<String, Object> updateData = new ConcurrentHashMap<>();
    updateData.put("field_1", "value_2");
    
    EventActions actions = EventActions.builder().stateDelta(updateData).build();
    Content eventContent = Content.builder().parts(Part.fromText("State updated.")).build();
    
    Event eventWithStateChange = Event.builder()
        .author(self.name())
        .actions(actions)
        .content(Optional.of(eventContent))
        // ... other event fields ...
        .build();
    
    // 2. "Yield" the event. In RxJava, this means emitting it into the stream.
    //    The Runner (or upstream consumer) will subscribe to this Flowable.
    //    When the Runner receives this event, it will process it (e.g., call sessionService.appendEvent).
    //    The 'appendEvent' in Java ADK mutates the 'Session' object held within 'ctx' (InvocationContext).
    
    // <<<<<<<<<<<< CONCEPTUAL PAUSE POINT >>>>>>>>>>>>
    // In RxJava, the emission of 'eventWithStateChange' happens, and then the stream
    // might continue with a 'flatMap' or 'concatMap' operator that represents
    // the logic *after* the Runner has processed this event.
    
    // To model the "resume execution ONLY after Runner is done processing":
    // The Runner's `appendEvent` is usually an async operation itself (returns Single<Event>).
    // The agent's flow needs to be structured such that subsequent logic
    // that depends on the committed state runs *after* that `appendEvent` completes.
    
    // This is how the Runner typically orchestrates it:
    // Runner:
    //   agent.runAsync(ctx)
    //     .concatMapEager(eventFromAgent ->
    //         sessionService.appendEvent(ctx.session(), eventFromAgent) // This updates ctx.session().state()
    //             .toFlowable() // Emits the event after it's processed
    //     )
    //     .subscribe(processedEvent -> { /* UI renders processedEvent */ });
    
    // So, within the agent's own logic, if it needs to do something *after* an event it yielded
    // has been processed and its state changes are reflected in ctx.session().state(),
    // that subsequent logic would typically be in another step of its reactive chain.
    
    // For this conceptual example, we'll emit the event, and then simulate the "resume"
    // as a subsequent operation in the Flowable chain.
    
    return Flowable.just(eventWithStateChange) // Step 2: Yield the event
        .concatMap(yieldedEvent -> {
            // <<<<<<<<<<<< RUNNER CONCEPTUALLY PROCESSES & COMMITS THE EVENT >>>>>>>>>>>>
            // At this point, in a real runner, ctx.session().appendEvent(yieldedEvent) would have been called
            // by the Runner, and ctx.session().state() would be updated.
            // Since we are *inside* the agent's conceptual logic trying to model this,
            // we assume the Runner's action has implicitly updated our 'ctx.session()'.
    
            // 3. Resume execution.
            // Now, the state committed by the Runner (via sessionService.appendEvent)
            // is reliably reflected in ctx.session().state().
            Object val = ctx.session().state().get("field_1");
            // here `val` is guaranteed to be "value_2" because the `sessionService.appendEvent`
            // called by the Runner would have updated the session state within the `ctx` object.
    
            System.out.println("Resumed execution. Value of field_1 is now: " + val);
    
            // ... subsequent code continues ...
            // If this subsequent code needs to yield another event, it would do so here.
    ```

這種由 `Runner` 與你的執行邏輯（Execution Logic）之間協作的讓渡（yield）／暫停（pause）／恢復（resume）循環，並透過 `Event` 物件進行調節，構成了 Agent Development Kit (ADK) Runtime 的核心。

## Runtime 的主要組件

在 Agent Development Kit (ADK) Runtime 中，有多個組件協同運作以執行 agent 的呼叫（invocation）。了解它們的角色有助於釐清事件迴圈（event loop）如何運作：

1. ### `Runner`

      * **角色：** 單一使用者查詢（`run_async`）的主要進入點與協調者。
      * **功能：** 負責整體事件迴圈的管理，接收執行邏輯讓渡的事件，協調各服務（Services）處理並提交事件動作（狀態／artifact 變更），並將處理後的事件向上游傳遞（例如傳給 UI）。它基本上根據讓渡的事件逐步推進對話回合（conversation turn）。（定義於 `google.adk.runners.runner`）

2. ### 執行邏輯組件（Execution Logic Components）

      * **角色：** 包含你自訂程式碼與 agent 核心能力的部分。
      * **組件：**
      * `Agent`（`BaseAgent`、`LlmAgent` 等）：你的主要邏輯單元，負責處理資訊並決定要採取的行動。它們實作 `_run_async_impl` 方法，並讓渡事件。
      * `Tools`（`BaseTool`、`FunctionTool`、`AgentTool` 等）：agent 用來與外部世界互動或執行特定任務的外部函式或能力（通常為 `LlmAgent`）。它們執行後回傳結果，結果會被包裝成事件。
      * `Callbacks`（Functions）：附加於 agent 的使用者自訂函式（如 `before_agent_callback`、`after_model_callback`），可掛載於執行流程的特定點，可能會修改行為或狀態，其影響會被事件所捕捉。
      * **功能：** 執行實際的推理、計算或外部互動。它們透過**讓渡 `Event` 物件**來傳遞結果或需求，並在 Runner 處理完畢前暫停。

3. ### `Event`

      * **角色：** 在 `Runner` 與執行邏輯之間來回傳遞的訊息。
      * **功能：** 代表一個原子的事件（如使用者輸入、agent 輸出文字、工具呼叫／結果、狀態變更請求、控制訊號）。它同時攜帶事件內容與預期的副作用（`actions`，如 `state_delta`）。

4. ### `Services`

      * **角色：** 負責管理持久性或共享資源的後端組件。主要由 `Runner` 在事件處理過程中使用。
      * **組件：**
      * `SessionService`（`BaseSessionService`、`InMemorySessionService` 等）：管理 `Session` 物件，包括儲存／載入、將 `state_delta` 應用至 session state，以及將事件附加到 `event history`。
      * `ArtifactService`（`BaseArtifactService`、`InMemoryArtifactService`、`GcsArtifactService` 等）：負責二進位 artifact 資料的儲存與讀取。雖然 `save_artifact` 會在執行邏輯中透過 context 呼叫，但事件中的 `artifact_delta` 會確認該動作已交由 Runner／SessionService 處理。
      * `MemoryService`（`BaseMemoryService` 等）：（可選）管理使用者跨 session 的長期語意記憶。
      * **功能：** 提供持久化層。`Runner` 會與這些組件互動，確保由 `event.actions` 所觸發的變更在執行邏輯恢復前已被可靠地儲存。

5. ### `Session`

      * **角色：** 用來儲存*單一特定對話*之狀態與歷史紀錄的資料容器。
      * **功能：** 保存目前的 `state` 字典、所有過去的 `events`（`event history`）清單，以及相關 artifact 的參考。它是互動過程的主要紀錄，由 `SessionService` 所管理。

6. ### `Invocation`

      * **角色：** 概念上代表針對*單一*使用者查詢，從 `Runner` 收到查詢到 agent 邏輯完成該查詢所有事件讓渡的整個過程。
      * **功能：** 一次 invocation 可能包含多次 agent 執行（例如使用 agent 轉移或 `AgentTool`）、多次大型語言模型 (LLM) 呼叫、工具執行與 callback 執行，這些都會由單一 `invocation_id` 在 `InvocationContext` 內串聯。以 `temp:` 為前綴的狀態變數僅限於單一 invocation 範圍，結束後即丟棄。

這些角色會透過事件迴圈持續互動，以處理使用者的請求。

## 運作流程：簡化的 Invocation 範例

以下追蹤一個典型使用者查詢的簡化流程，該查詢涉及大型語言模型 (LLM) agent 呼叫工具：

![intro_components.png](../assets/invocation-flow.png)

### 步驟分解

1. **使用者輸入：** 使用者發送查詢（例如：「法國的首都是哪裡？」）。
2. **Runner 啟動：** `Runner.run_async` 開始運作。它與 `SessionService` 互動以載入相關 `Session`，並將使用者查詢作為第一個 `Event` 加入 session 歷史。準備好 `InvocationContext`（`ctx`）。
3. **Agent 執行：** `Runner` 在指定的 root agent（例如 `LlmAgent`）上呼叫 `agent.run_async(ctx)`。
4. **LLM 呼叫（範例）：** `Agent_Llm` 判斷需要資訊，可能會呼叫工具。它準備一個給 `LLM` 的請求。假設 LLM 決定呼叫 `MyTool`。
5. **讓渡 FunctionCall 事件：** `Agent_Llm` 接收到 LLM 的 `FunctionCall` 回應，將其包裝成 `Event(author='Agent_Llm', content=Content(parts=[Part(function_call=...)]))`，並 `yields` 或 `emits` 此事件。
6. **Agent 暫停：** `Agent_Llm` 的執行在 `yield` 之後立即暫停。
7. **Runner 處理：** `Runner` 收到 FunctionCall 事件，傳遞給 `SessionService` 以記錄到歷史。`Runner` 隨後將事件向上游傳遞給 `User`（或應用程式）。
8. **Agent 恢復：** `Runner` 發出事件已處理的訊號，`Agent_Llm` 恢復執行。
9. **工具執行：** `Agent_Llm` 的內部流程接著執行所請求的 `MyTool`，呼叫 `tool.run_async(...)`。
10. **工具回傳結果：** `MyTool` 執行並回傳結果（例如 `{'result': 'Paris'}`）。
11. **讓渡 FunctionResponse 事件：** agent（`Agent_Llm`）將工具結果包裝成含有 `FunctionResponse` 部分（如 `Event(author='Agent_Llm', content=Content(role='user', parts=[Part(function_response=...)]))`）的 `Event`。若工具有修改狀態（`state_delta`）或儲存 artifact（`artifact_delta`），此事件也會包含 `actions`。agent 會 `yield` 此事件。
12. **Agent 暫停：** `Agent_Llm` 再次暫停。
13. **Runner 處理：** `Runner` 收到 FunctionResponse 事件，傳遞給 `SessionService`，應用所有 `state_delta`／`artifact_delta` 並將事件加入歷史。`Runner` 向上游讓渡事件。
14. **Agent 恢復：** `Agent_Llm` 恢復，此時已知工具結果與任何狀態變更都已提交。
15. **最終 LLM 呼叫（範例）：** `Agent_Llm` 將工具結果傳回 `LLM`，以產生自然語言回應。
16. **讓渡最終文字事件：** `Agent_Llm` 從 `LLM` 收到最終文字，包裝成 `Event(author='Agent_Llm', content=Content(parts=[Part(text=...)]))`，並 `yield`。
17. **Agent 暫停：** `Agent_Llm` 暫停。
18. **Runner 處理：** `Runner` 收到最終文字事件，傳給 `SessionService` 以記錄歷史，並將其向上游讓渡給 `User`。這通常會標記為 `is_final_response()`。
19. **Agent 恢復並結束：** `Agent_Llm` 恢復。完成本次 invocation 的任務後，其 `run_async` 產生器結束。
20. **Runner 完成：** `Runner` 發現 agent 的產生器已耗盡，結束本次 invocation 的事件迴圈。

這個讓渡／暫停／處理／恢復的循環，確保狀態變更能一致地被應用，並讓執行邏輯在每次讓渡事件後都能以最新已提交的狀態繼續運作。

## 重要的 Runtime 行為

理解 Agent Development Kit (ADK) Runtime 如何處理狀態、串流與非同步操作的幾個關鍵面向，對於打造可預期且高效的 agent 至關重要。

### 狀態更新與提交時機

* **規則：** 當你的程式碼（在 agent、工具或 callback 中）修改 session state（例如 `context.state['my_key'] = 'new_value'`）時，此變更最初只會在當前 `InvocationContext` 內部被本地記錄。只有在**對應的 `Event`（其 `actions` 包含該 `state_delta`）被你的程式碼 `yield` 讓渡，並隨後由 `Runner` 處理後，該變更才**保證會被持久化**（由 `SessionService` 儲存）。

* **意涵：** 在從 `yield` 恢復之後執行的程式碼，可以可靠地假設 *yielded event* 中所標記的狀態變更已經被提交。

=== "Python"

    ```py
    # Inside agent logic (conceptual)
    
    # 1. Modify state
    ctx.session.state['status'] = 'processing'
    event1 = Event(..., actions=EventActions(state_delta={'status': 'processing'}))
    
    # 2. Yield event with the delta
    yield event1
    # --- PAUSE --- Runner processes event1, SessionService commits 'status' = 'processing' ---
    
    # 3. Resume execution
    # Now it's safe to rely on the committed state
    current_status = ctx.session.state['status'] # Guaranteed to be 'processing'
    print(f"Status after resuming: {current_status}")
    ```

=== "Java"

    ```java
    // Inside agent logic (conceptual)
    // ... previous code runs based on current state ...
    
    // 1. Prepare state modification and construct the event
    ConcurrentHashMap<String, Object> stateChanges = new ConcurrentHashMap<>();
    stateChanges.put("status", "processing");
    
    EventActions actions = EventActions.builder().stateDelta(stateChanges).build();
    Content content = Content.builder().parts(Part.fromText("Status update: processing")).build();
    
    Event event1 = Event.builder()
        .actions(actions)
        // ...
        .build();
    
    // 2. Yield event with the delta
    return Flowable.just(event1)
        .map(
            emittedEvent -> {
                // --- CONCEPTUAL PAUSE & RUNNER PROCESSING ---
                // 3. Resume execution (conceptually)
                // Now it's safe to rely on the committed state.
                String currentStatus = (String) ctx.session().state().get("status");
                System.out.println("Status after resuming (inside agent logic): " + currentStatus); // Guaranteed to be 'processing'
    
                // The event itself (event1) is passed on.
                // If subsequent logic within this agent step produced *another* event,
                // you'd use concatMap to emit that new event.
                return emittedEvent;
            });
    
    // ... subsequent agent logic might involve further reactive operators
    // or emitting more events based on the now-updated `ctx.session().state()`.
    ```

### session state 的「髒讀 (Dirty Reads)」

* **定義：** 由於提交發生在 *讓渡（yield）之後*，在*同一次呼叫中稍後執行*但*實際讓渡並處理狀態變更事件之前*的程式碼，**通常可以看到本地尚未提交的變更**。這種情況有時稱為「髒讀 (Dirty Read)」。
* **範例：**

=== "Python"

    ```py
    # Code in before_agent_callback
    callback_context.state['field_1'] = 'value_1'
    # State is locally set to 'value_1', but not yet committed by Runner
    
    # ... agent runs ...
    
    # Code in a tool called later *within the same invocation*
    # Readable (dirty read), but 'value_1' isn't guaranteed persistent yet.
    val = tool_context.state['field_1'] # 'val' will likely be 'value_1' here
    print(f"Dirty read value in tool: {val}")
    
    # Assume the event carrying the state_delta={'field_1': 'value_1'}
    # is yielded *after* this tool runs and is processed by the Runner.
    ```

=== "Java"

    ```java
    // Modify state - Code in BeforeAgentCallback
    // AND stages this change in callbackContext.eventActions().stateDelta().
    callbackContext.state().put("field_1", "value_1");

    // --- agent runs ... ---

    // --- Code in a tool called later *within the same invocation* ---
    // Readable (dirty read), but 'value_1' isn't guaranteed persistent yet.
    Object val = toolContext.state().get("field_1"); // 'val' will likely be 'value_1' here
    System.out.println("Dirty read value in tool: " + val);
    // Assume the event carrying the state_delta={'field_1': 'value_1'}
    // is yielded *after* this tool runs and is processed by the Runner.
    ```

* **影響說明：**
  * **優點：** 允許在單一複雜步驟中的不同邏輯部分（例如在下一次大型語言模型 (LLM) 回合前進行多次回呼（callback）或工具呼叫 (tool calls)）能夠利用 state 進行協調，而無需等待完整的讓渡（yield）/提交（commit）循環。
  * **注意事項：** 若在關鍵邏輯上過度依賴髒讀 (Dirty Reads) 可能存在風險。如果在攜帶 `state_delta` 的事件被讓渡並由 `Runner` 處理*之前*，此次呼叫失敗，則未提交的 state 變更將會遺失。對於關鍵的 state 轉換，請確保這些變更與能夠成功處理的事件綁定。

### 串流與非串流輸出（`partial=True`）

這主要關聯於如何處理來自大型語言模型 (LLM) 的回應，特別是在使用串流生成 API 時。

* **串流 (Streaming)：** LLM 會逐字元（token-by-token）或以小區塊方式產生回應。
  * 框架（通常在 `BaseLlmFlow` 內）會針對單一概念回應讓渡多個 `Event` 物件。這些事件大多會帶有 `partial=True`。
  * `Runner` 在收到帶有 `partial=True` 的事件時，通常會**立即將其轉發**至上游（例如 UI 顯示），但**會略過處理其 `actions`**（如 `state_delta`）。
  * 最終，框架會針對該回應讓渡一個標記為非 partial（`partial=False` 或透過 `turn_complete=True` 隱含）的最終事件。
  * `Runner` **僅會完整處理這個最終事件**，並提交所有相關的 `state_delta` 或 `artifact_delta`。
* **非串流 (Non-Streaming)：** LLM 會一次產生完整回應。框架會讓渡一個標記為非 partial 的單一事件，`Runner` 會完整處理該事件。
* **重要性：** 這確保了 state 變更是以原子性且僅一次的方式，根據 LLM 的*完整*回應來套用，同時仍允許 UI 隨生成進度逐步顯示文字。

## 非同步為核心（`run_async`）

* **核心設計：** Agent Development Kit (ADK) Runtime 基本上是建立在非同步函式庫（如 Python 的 `asyncio` 與 Java 的 `RxJava`）之上，能有效處理並行操作（如等待 LLM 回應或工具執行），且不會阻塞。
* **主要進入點：** `Runner.run_async` 是執行 agent 呼叫的主要方法。所有核心可執行元件（Agents、特定流程）內部皆使用 `asynchronous` 方法。
* **同步便利性（`run`）：** 同步的 `Runner.run` 方法主要是為了便利（例如在簡單腳本或測試環境中）。但在內部，`Runner.run` 通常僅呼叫 `Runner.run_async`，並為你管理非同步事件迴圈的執行。
* **開發者體驗：** 我們建議你設計的應用程式（例如使用 ADK 的網頁伺服器）應以非同步為主，以獲得最佳效能。在 Python 中，這表示要使用 `asyncio`；在 Java 中，則建議利用 `RxJava` 的 reactive programming 模型。
* **同步回呼/工具：** Agent Development Kit (ADK) 框架同時支援工具與回呼的非同步與同步函式。
    * **阻塞式 I/O：** 對於長時間執行的同步 I/O 操作，框架會嘗試避免阻塞。Python ADK 可能會使用 asyncio.to_thread，而 Java ADK 則常依賴適當的 RxJava scheduler 或包裝器來處理阻塞呼叫。
    * **CPU 密集型工作：** 純粹 CPU 密集的同步任務，在兩種環境下都會阻塞其執行緒。

理解這些行為有助於你撰寫更健壯的 ADK 應用程式，並協助除錯與 state 一致性、串流更新、非同步執行相關的問題。
