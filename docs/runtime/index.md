# 執行階段（Runtime）

## 什麼是執行階段？

Agent Development Kit (ADK) 執行階段（Runtime）是支援您的 agent 應用程式在使用者互動期間運作的底層引擎。它負責將您定義的 agent、tools（工具）和 callbacks（回呼）協調執行，以回應使用者輸入，並管理資訊流、狀態變更，以及與外部服務（如大型語言模型 (LLM) 或儲存空間）的互動。

您可以將執行階段（Runtime）想像成您的 agent 應用程式的**「引擎」**。您負責定義零件（agent、tools），而 Runtime 則負責將它們串連並協同運作，以滿足使用者的需求。

## 核心概念：事件迴圈（Event Loop）

ADK 執行階段的核心運作基礎是**事件迴圈（Event Loop）**。這個迴圈促進了 `Runner` 元件與您所定義的「執行邏輯」（包含您的 Agents、它們所發起的 LLM 呼叫、Callbacks、Tools）之間的來回溝通。

![intro_components.png](../assets/event-loop.png)

簡單來說：

1. `Runner` 接收到使用者查詢後，會請求主要的 `Agent` 開始處理。
2. `Agent`（及其相關邏輯）執行，直到有結果需要回報（例如回應、請求使用工具或狀態變更）時，會**讓渡（yield）**或**發出（emit）**一個 `Event`。
3. `Runner` 收到這個 `Event` 後，會處理相關動作（例如透過 `Services` 儲存狀態變更），並將事件往下傳遞（例如傳送到使用者介面）。
4. 只有在 `Runner` 處理完該事件後，`Agent` 的邏輯才會**從暫停處繼續執行**，此時可能已經看到 Runner 所提交的變更結果。
5. 這個循環會重複進行，直到 agent 對目前的使用者查詢沒有更多事件可讓渡。

這種事件驅動的迴圈模式，是 ADK 執行您的 agent 程式碼的基本運作方式。

## 核心脈動：事件迴圈的內部運作

事件迴圈是定義 `Runner` 與您的自訂程式碼（Agents、Tools、Callbacks，設計文件中統稱為「執行邏輯」或「邏輯元件」）互動的核心運作模式。它建立了明確的職責分工：

!!! Note
    具體的方法名稱與參數名稱可能會依不同 SDK 語言（例如 Java 的 `agent_to_run.runAsync(...)`，Python 的 `agent_to_run.run_async(...)`）略有不同。請參考各語言的 API 文件以取得詳細資訊。

### Runner 的角色（協調者）

`Runner` 是單次使用者呼叫的中央協調者。它在事件迴圈中的職責包括：

1. **啟動：** 接收終端使用者的查詢（`new_message`），並通常會透過 `SessionService` 將其加入 session 歷史紀錄。
2. **啟動事件產生：** 呼叫主要 agent 的執行方法（例如 `agent_to_run.run_async(...)`），開始事件產生流程。
3. **接收與處理：** 等待 agent 邏輯**讓渡（yield）**或**發出（emit）**一個 `Event`。收到事件後，Runner 會**立即處理**該事件。這通常包括：
      * 使用已設定的 `Services`（`SessionService`、`ArtifactService`、`MemoryService`）來提交 `event.actions` 中指示的變更（如 `state_delta`、`artifact_delta`）。
      * 執行其他內部記錄管理。
4. **向上讓渡：** 將處理過的事件往上傳遞（例如傳送給呼叫的應用程式或 UI 進行顯示）。
5. **重複迴圈：** 通知 agent 邏輯該事件已處理完成，使其可以繼續執行並產生*下一個*事件。

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

1. **執行（Execute）：** 根據當前的 `InvocationContext` 執行其邏輯，這其中包含「*恢復執行時* 的 session 狀態」。
2. **讓渡（Yield）：** 當邏輯需要進行溝通（傳送訊息、呼叫工具、回報狀態變更）時，會構建一個包含相關內容與動作的 `Event`，然後將此事件 `yield` 回 `Runner`。
3. **暫停（Pause）：** 關鍵在於，agent 邏輯的執行會在 `yield` 陳述式（或 RxJava 中的 `return`）之後**立即暫停**。它會等待 `Runner` 完成步驟 3（處理與提交）。
4. **繼續（Resume）：** *僅在* `Runner` 處理完讓渡的事件後，agent 邏輯才會從緊接著 `yield` 之後的陳述式繼續執行。
5. **取得更新後的狀態（See Updated State）：** 在繼續執行時，agent 邏輯現在可以可靠地存取 session 狀態（`ctx.session.state`），此狀態反映了由 `Runner` 針對*先前讓渡*事件所提交的變更。

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

這種在 `Runner` 與你的執行邏輯（Execution Logic）之間，透過 `Event` 物件協調的讓渡（yield）／暫停（pause）／恢復（resume）循環，構成了 Agent Development Kit (ADK) 執行階段（Runtime）的核心。

## 執行階段的主要組件

在 Agent Development Kit (ADK) 執行階段內，有多個組件協同運作以執行一次 agent 呼叫。了解它們的角色有助於釐清事件迴圈（Event Loop）如何運作：

1. ### `Runner`

      * **角色：** 針對單一使用者查詢（`run_async`）的主要進入點與協調者。
      * **功能：** 管理整體事件迴圈，接收由執行邏輯讓渡的事件，協調服務（Services）處理並提交事件動作（狀態／產物變更），並將處理後的事件往上游傳遞（例如傳送至 UI）。基本上，它根據讓渡的事件逐步推動對話進行。（定義於 `google.adk.runners.runner`）

2. ### 執行邏輯組件（Execution Logic Components）

      * **角色：** 包含你的自訂程式碼與 agent 核心能力的部分。
      * **組件：**
      * `Agent`（`BaseAgent`、`LlmAgent` 等）：你的主要邏輯單元，用於處理資訊並決定動作。它們實作 `_run_async_impl` 方法，該方法會讓渡事件。
      * `Tools`（`BaseTool`、`FunctionTool`、`AgentTool` 等）：agent 用來與外部互動或執行特定任務的外部函式或能力（通常為 `LlmAgent`）。它們執行後回傳結果，並包裝成事件。
      * `Callbacks`（Functions）：附加在 agent 上的使用者自訂函式（例如 `before_agent_callback`、`after_model_callback`），可在執行流程中的特定點掛鉤，可能修改行為或狀態，其影響會被事件捕捉。
      * **功能：** 負責實際的思考、計算或外部互動。它們透過**讓渡 `Event` 物件**並暫停，直到 Runner 處理完畢後再繼續。

3. ### `Event`

      * **角色：** 在 `Runner` 與執行邏輯之間來回傳遞的訊息。
      * **功能：** 代表一個原子的發生（如使用者輸入、agent 文字、工具呼叫／結果、狀態變更請求、控制訊號）。它同時攜帶發生內容與預期的副作用（`actions`，如 `state_delta`）。

4. ### `Services`

      * **角色：** 負責管理持久性或共享資源的後端元件。主要由 `Runner` 在事件處理期間使用。
      * **組件：**
      * `SessionService`（`BaseSessionService`、`InMemorySessionService` 等）：管理 `Session` 物件，包括儲存／載入、將 `state_delta` 套用至工作階段狀態，以及將事件附加至 `event history`。
      * `ArtifactService`（`BaseArtifactService`、`InMemoryArtifactService`、`GcsArtifactService` 等）：管理二進位產物資料的儲存與讀取。雖然 `save_artifact` 會在執行邏輯期間透過 context 呼叫，但事件中的 `artifact_delta` 會確認該動作給 Runner／SessionService。
      * `MemoryService`（`BaseMemoryService` 等）：（可選）管理使用者跨工作階段的長期語意記憶。
      * **功能：** 提供持久化層。`Runner` 會與這些元件互動，確保由 `event.actions` 所觸發的變更在執行邏輯恢復前已可靠儲存。

5. ### `Session`

      * **角色：** 用來儲存*單一對話*（使用者與應用程式間）狀態與歷史紀錄的資料容器。
      * **功能：** 儲存目前的 `state` 字典、所有過去 `events`（`event history`）清單，以及相關產物的參考。它是互動的主要紀錄，由 `SessionService` 管理。

6. ### `Invocation`

      * **角色：** 一個概念性術語，代表針對*單一*使用者查詢，從 `Runner` 接收到查詢開始，到 agent 邏輯完成該查詢所有事件讓渡為止的整個過程。
      * **功能：** 一次呼叫可能包含多次 agent 執行（若有 agent 轉移或 `AgentTool`）、多次大型語言模型 (LLM) 呼叫、工具執行與回呼執行，這些都由 `invocation_id` 在 `InvocationContext` 內串聯。以 `temp:` 為前綴的狀態變數僅限於單次呼叫範圍，之後即會丟棄。

這些角色會持續透過事件迴圈（Event Loop）互動，以處理使用者的請求。

## 運作方式：簡化的呼叫流程

讓我們追蹤一個典型使用者查詢的簡化流程，這個查詢會讓大型語言模型 (LLM) agent 呼叫一個工具：

![intro_components.png](../assets/invocation-flow.png)

### 步驟分解

1. **使用者輸入：** 使用者發送查詢（例如：「法國的首都是哪裡？」）。
2. **Runner 啟動：** `Runner.run_async` 開始運作。它與 `SessionService` 互動以載入相關 `Session`，並將使用者查詢作為第一個 `Event` 加入工作階段歷史。準備一個 `InvocationContext`（`ctx`）。
3. **Agent 執行：** `Runner` 在指定的根 agent（例如 `LlmAgent`）上呼叫 `agent.run_async(ctx)`。
4. **LLM 呼叫（範例）：** `Agent_Llm` 判斷需要資訊，可能會呼叫工具。它會為 `LLM` 準備請求。假設 LLM 決定呼叫 `MyTool`。
5. **讓渡 FunctionCall 事件：** `Agent_Llm` 收到來自 LLM 的 `FunctionCall` 回應，將其包裝成 `Event(author='Agent_Llm', content=Content(parts=[Part(function_call=...)]))`，並 `yields` 或 `emits` 此事件。
6. **Agent 暫停：** `Agent_Llm` 的執行在 `yield` 之後立即暫停。
7. **Runner 處理：** `Runner` 收到 FunctionCall 事件。它將事件傳給 `SessionService` 以記錄到歷史。`Runner` 再將事件讓渡到上游（`User` 或應用程式）。
8. **Agent 恢復：** `Runner` 發出事件已處理的訊號，`Agent_Llm` 恢復執行。
9. **工具執行：** `Agent_Llm` 的內部流程現在會執行所請求的 `MyTool`，並呼叫 `tool.run_async(...)`。
10. **工具回傳結果：** `MyTool` 執行並回傳其結果（例如 `{'result': 'Paris'}`）。
11. **讓渡 FunctionResponse 事件：** agent（`Agent_Llm`）將工具結果包裝成含有 `FunctionResponse` 部分（如 `Event(author='Agent_Llm', content=Content(role='user', parts=[Part(function_response=...)]))`）的 `Event`。如果工具有修改狀態（`state_delta`）或儲存產物（`artifact_delta`），此事件也可能包含 `actions`。agent 會 `yield` 此事件。
12. **Agent 暫停：** `Agent_Llm` 再次暫停。
13. **Runner 處理：** `Runner` 收到 FunctionResponse 事件，傳給 `SessionService` 以套用任何 `state_delta`／`artifact_delta` 並將事件加入歷史。`Runner` 將事件讓渡到上游。
14. **Agent 恢復：** `Agent_Llm` 恢復，此時已知工具結果與所有狀態變更都已提交。
15. **最終 LLM 呼叫（範例）：** `Agent_Llm` 將工具結果回傳給 `LLM` 以產生自然語言回應。
16. **讓渡最終文字事件：** `Agent_Llm` 收到來自 `LLM` 的最終文字，將其包裝成 `Event(author='Agent_Llm', content=Content(parts=[Part(text=...)]))`，並 `yield`。
17. **Agent 暫停：** `Agent_Llm` 暫停。
18. **Runner 處理：** `Runner` 收到最終文字事件，傳給 `SessionService` 以記錄到歷史，並將其讓渡到上游（`User`）。這通常會被標記為 `is_final_response()`。
19. **Agent 恢復並結束：** `Agent_Llm` 恢復。完成此次呼叫的任務後，其 `run_async` 產生器結束。
20. **Runner 完成：** `Runner` 發現 agent 的產生器已耗盡，結束此次呼叫的事件迴圈。

這個讓渡／暫停／處理／恢復的循環，確保狀態變更能一致地套用，並且執行邏輯在讓渡事件後，總是運作於最新已提交的狀態上。

## 重要的執行階段行為

理解 Agent Development Kit (ADK) 執行階段如何處理狀態、串流與非同步操作的幾個關鍵面向，對於打造可預期且高效的 agent 十分重要。

### 狀態更新與提交時機

* **規則：** 當你的程式碼（在 agent、工具或回呼中）修改工作階段狀態（例如 `context.state['my_key'] = 'new_value'`）時，這個變更最初只會在目前的 `InvocationContext` 內部被本地記錄。只有在**對應的變更事件**（由 `SessionService` 儲存）所攜帶的 `Event` 被你的程式碼在其 `actions` 內**讓渡**（`yield`）並隨後被 `Runner` 處理後，這個變更才**保證被持久化**。

* **意涵：** 在從 `yield` 恢復之後執行的程式碼，可以可靠地假設*讓渡事件*中所標示的狀態變更已經被提交。

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

### 工作階段狀態的「髒讀」(Dirty Reads)

* **定義：** 由於提交發生在 *讓渡（yield）之後*，在 *同一次呼叫中稍後執行*、但 *實際讓渡並處理狀態變更事件之前* 的程式碼，**通常可以看到本地尚未提交的變更**。這種情況有時稱為「髒讀」（dirty read）。
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
  * **優點：** 允許在單一複雜步驟中的不同邏輯部分（例如，在下一次大型語言模型 (LLM) 輪次前的多個回呼或工具呼叫）能夠透過狀態協調，而無需等待完整的讓渡（yield）/提交（commit）週期。
  * **注意事項：** 若在關鍵邏輯上過度依賴 dirty read 可能有風險。如果在攜帶 `state_delta` 的事件被讓渡並由 `Runner` 處理之前，該次呼叫失敗，則未提交的狀態變更將會遺失。對於關鍵的狀態轉換，請確保它們與能成功處理的事件相關聯。

### 串流與非串流輸出（`partial=True`）

這主要關係到如何處理來自大型語言模型 (LLM) 的回應，特別是在使用串流生成 API 時。

* **串流（Streaming）：** 大型語言模型 (LLM) 會逐字元（token）或以小區塊方式產生回應。
  * 框架（通常在 `BaseLlmFlow` 內）會針對單一概念性回應讓渡多個 `Event` 物件。這些事件大多會帶有 `partial=True`。
  * `Runner` 在收到帶有 `partial=True` 的事件時，通常會**立即將其轉發**到上游（供 UI 顯示），但**會略過處理其 `actions`**（如 `state_delta`）。
  * 最終，框架會針對該回應讓渡一個標記為非 partial（`partial=False` 或透過 `turn_complete=True` 隱含）的最終事件。
  * `Runner` **僅會完整處理這個最終事件**，並提交所有相關的 `state_delta` 或 `artifact_delta`。
* **非串流（Non-Streaming）：** 大型語言模型 (LLM) 一次性產生完整回應。框架會讓渡一個標記為非 partial 的單一事件，由 `Runner` 完整處理。
* **重要性：** 這確保了狀態變更是以原子性且僅一次的方式，根據大型語言模型 (LLM) 的*完整*回應來套用，同時仍能讓 UI 隨著文字產生即時顯示。

## 非同步為主（`run_async`）

* **核心設計：** Agent Development Kit (ADK) 執行階段（Runtime）是以非同步函式庫（如 Python 的 `asyncio` 與 Java 的 `RxJava`）為基礎設計，可高效處理並發操作（如等待大型語言模型 (LLM) 回應或工具執行），而不會阻塞。
* **主要進入點：** `Runner.run_async` 是執行 agent 呼叫的主要方法。所有核心可執行元件（Agents、特定流程）內部皆使用 `asynchronous` 方法。
* **同步便利性（`run`）：** 同步的 `Runner.run` 方法主要為了方便（例如用於簡單腳本或測試環境）。但在內部，`Runner.run` 通常只是呼叫 `Runner.run_async`，並為你管理非同步事件迴圈的執行。
* **開發者體驗：** 我們建議你設計的應用程式（例如使用 ADK 的網頁伺服器）應以非同步為主，以獲得最佳效能。在 Python 中，這表示使用 `asyncio`；在 Java 中，則應善用 `RxJava` 的 reactive programming（反應式程式設計）模型。
* **同步回呼/工具：** Agent Development Kit (ADK) 框架同時支援工具與回呼的非同步與同步函式。
    * **阻塞式 I/O：** 對於長時間執行的同步 I/O 操作，框架會嘗試避免阻塞。Python ADK 可能會使用 asyncio.to_thread，而 Java ADK 則常依賴適當的 RxJava scheduler 或包裝器來處理阻塞呼叫。
    * **CPU 密集型工作：** 純粹的 CPU 密集型同步任務，在兩種環境下仍會阻塞其執行緒。

理解這些行為有助於你撰寫更健壯的 Agent Development Kit (ADK) 應用程式，並協助除錯與狀態一致性、串流更新及非同步執行相關的問題。
