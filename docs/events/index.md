# Events

Events 是 Agent Development Kit (ADK) 中資訊流動的基本單位。它們代表了 agent 互動生命週期中每一個重要事件，從使用者最初的輸入，到最終回應，以及中間的所有步驟。理解 Events 十分重要，因為它們是元件之間溝通、狀態管理與控制流程導向的主要方式。

## Events 是什麼，以及為什麼重要

在 ADK 中，`Event` 是一個不可變的紀錄，用來表示 agent 執行過程中的特定時刻。它會記錄使用者訊息、agent 回覆、工具呼叫（function calls）、工具結果、狀態變更、控制訊號，以及錯誤等資訊。

=== "Python"
    技術上來說，它是 `google.adk.events.Event` 類別的實例，該類別在基礎的 `LlmResponse` 結構上，加入了 ADK 專屬的重要中繼資料與 `actions` 負載（payload）。

    ```python
    # Conceptual Structure of an Event (Python)
    # from google.adk.events import Event, EventActions
    # from google.genai import types

    # class Event(LlmResponse): # Simplified view
    #     # --- LlmResponse fields ---
    #     content: Optional[types.Content]
    #     partial: Optional[bool]
    #     # ... other response fields ...

    #     # --- ADK specific additions ---
    #     author: str          # 'user' or agent name
    #     invocation_id: str   # ID for the whole interaction run
    #     id: str              # Unique ID for this specific event
    #     timestamp: float     # Creation time
    #     actions: EventActions # Important for side-effects & control
    #     branch: Optional[str] # Hierarchy path
    #     # ...
    ```

=== "Java"
    在 Java 中，這是一個 `com.google.adk.events.Event` 類別的實例。它在基本回應結構的基礎上，加入了必要的 Agent Development Kit (ADK) 專屬中繼資料以及 `actions` 載荷（payload）。

    ```java
    // Conceptual Structure of an Event (Java - See com.google.adk.events.Event.java)
    // Simplified view based on the provided com.google.adk.events.Event.java
    // public class Event extends JsonBaseModel {
    //     // --- Fields analogous to LlmResponse ---
    //     private Optional<Content> content;
    //     private Optional<Boolean> partial;
    //     // ... other response fields like errorCode, errorMessage ...

    //     // --- ADK specific additions ---
    //     private String author;         // 'user' or agent name
    //     private String invocationId;   // ID for the whole interaction run
    //     private String id;             // Unique ID for this specific event
    //     private long timestamp;        // Creation time (epoch milliseconds)
    //     private EventActions actions;  // Important for side-effects & control
    //     private Optional<String> branch; // Hierarchy path
    //     // ... other fields like turnComplete, longRunningToolIds etc.
    // }
    ```

事件（Events）在 Agent Development Kit (ADK) 的運作中扮演核心角色，主要原因如下：

1.  **通訊（Communication）：** 事件作為使用者介面、`Runner`、agent、大型語言模型 (LLM) 以及 tools 之間的標準訊息格式。所有資料皆以 `Event` 的形式流動。

2.  **狀態與產物變更訊號（Signaling State & Artifact Changes）：** 事件承載狀態修改的指令，並追蹤產物（artifact）的更新。`SessionService` 會利用這些訊號來確保資料持久化。在 Python 中，變更會透過 `event.actions.state_delta` 和 `event.actions.artifact_delta` 來傳遞訊號。

3.  **控制流程（Control Flow）：** 特定欄位如 `event.actions.transfer_to_agent` 或 `event.actions.escalate` 可作為訊號，指引框架決定下一個執行的 agent，或判斷是否終止迴圈。

4.  **歷史紀錄與可觀察性（History & Observability）：** 在 `session.events` 中所記錄的事件序列，提供完整且具時間順序的互動歷程，對於除錯、稽核以及逐步理解 agent 行為極為寶貴。

總結來說，從使用者提問到 agent 給出最終回應，整個過程都是透過`Event` 物件的產生、解讀與處理來協同運作的。


## 理解與使用事件（Understanding and Using Events）

作為開發人員，你主要會與 `Runner` 所產生的事件串流互動。以下說明如何理解並從中擷取資訊：

!!! Note
    各 SDK 語言的基礎操作（primitive）的具體參數或方法名稱可能略有不同（例如，Python 中的 `event.content()`，Java 中的 `event.content().get().parts()`）。詳細資訊請參考各語言的 API 文件說明。

### 辨識事件來源與類型

您可以透過以下方式快速判斷事件的意義：

*   **誰發送了這個事件？（`event.author`）**
    *   `'user'`：表示來自最終使用者的直接輸入。
    *   `'AgentName'`：表示來自特定 agent 的輸出或動作（例如，`'WeatherAgent'`、`'SummarizerAgent'`）。
*   **主要的 payload 是什麼？（`event.content` 與 `event.content.parts`）**
    *   **文字（Text）：** 表示一則對話訊息。對於 Python，請檢查是否存在 `event.content.parts[0].text`。對於 Java，請確認是否有 `event.content()`，其 `parts()` 存在且不為空，且第一個部分的 `text()` 存在。
    *   **工具呼叫請求（Tool Call Request）：** 檢查 `event.get_function_calls()`。如果不為空，代表大型語言模型 (LLM) 要求執行一個或多個工具。列表中的每個項目都包含 `.name` 與 `.args`。
    *   **工具執行結果（Tool Result）：** 檢查 `event.get_function_responses()`。如果不為空，這個事件攜帶工具執行的結果。每個項目都包含 `.name` 與 `.response`（由工具回傳的 dictionary）。*注意：* 在歷史結構化時，`content` 內的 `role` 通常是 `'user'`，但事件的 `author` 通常是發起工具呼叫請求的 agent。

*   **這是串流輸出嗎？（`event.partial`）**
    表示這是否為大型語言模型 (LLM) 輸出的尚未完成的文字片段。
    *   `True`：之後還會有更多文字。
    *   `False` 或 `None`/`Optional.empty()`：這部分內容已完成（但如果 `turn_complete` 也為 false，則整個回合可能尚未結束）。

=== "Python"
    ```python
    # Pseudocode: Basic event identification (Python)
    # async for event in runner.run_async(...):
    #     print(f"Event from: {event.author}")
    #
    #     if event.content and event.content.parts:
    #         if event.get_function_calls():
    #             print("  Type: Tool Call Request")
    #         elif event.get_function_responses():
    #             print("  Type: Tool Result")
    #         elif event.content.parts[0].text:
    #             if event.partial:
    #                 print("  Type: Streaming Text Chunk")
    #             else:
    #                 print("  Type: Complete Text Message")
    #         else:
    #             print("  Type: Other Content (e.g., code result)")
    #     elif event.actions and (event.actions.state_delta or event.actions.artifact_delta):
    #         print("  Type: State/Artifact Update")
    #     else:
    #         print("  Type: Control Signal or Other")
    ```

=== "Java"
    ```java
    // Pseudocode: Basic event identification (Java)
    // import com.google.genai.types.Content;
    // import com.google.adk.events.Event;
    // import com.google.adk.events.EventActions;

    // runner.runAsync(...).forEach(event -> { // Assuming a synchronous stream or reactive stream
    //     System.out.println("Event from: " + event.author());
    //
    //     if (event.content().isPresent()) {
    //         Content content = event.content().get();
    //         if (!event.functionCalls().isEmpty()) {
    //             System.out.println("  Type: Tool Call Request");
    //         } else if (!event.functionResponses().isEmpty()) {
    //             System.out.println("  Type: Tool Result");
    //         } else if (content.parts().isPresent() && !content.parts().get().isEmpty() &&
    //                    content.parts().get().get(0).text().isPresent()) {
    //             if (event.partial().orElse(false)) {
    //                 System.out.println("  Type: Streaming Text Chunk");
    //             } else {
    //                 System.out.println("  Type: Complete Text Message");
    //             }
    //         } else {
    //             System.out.println("  Type: Other Content (e.g., code result)");
    //         }
    //     } else if (event.actions() != null &&
    //                ((event.actions().stateDelta() != null && !event.actions().stateDelta().isEmpty()) ||
    //                 (event.actions().artifactDelta() != null && !event.actions().artifactDelta().isEmpty()))) {
    //         System.out.println("  Type: State/Artifact Update");
    //     } else {
    //         System.out.println("  Type: Control Signal or Other");
    //     }
    // });
    ```

### 擷取關鍵資訊

當你知道事件類型後，可以存取相關資料：

*   **文字內容：**  
    在存取文字前，請務必先檢查 content 與 parts 是否存在。在 Python 中為 `text = event.content.parts[0].text`。

*   **函式呼叫細節：**
    
    === "Python"
        ```python
        calls = event.get_function_calls()
        if calls:
            for call in calls:
                tool_name = call.name
                arguments = call.args # This is usually a dictionary
                print(f"  Tool: {tool_name}, Args: {arguments}")
                # Application might dispatch execution based on this
        ```
    === "Java"

        ```java
        import com.google.genai.types.FunctionCall;
        import com.google.common.collect.ImmutableList;
        import java.util.Map;
    
        ImmutableList<FunctionCall> calls = event.functionCalls(); // from Event.java
        if (!calls.isEmpty()) {
          for (FunctionCall call : calls) {
            String toolName = call.name().get();
            // args is Optional<Map<String, Object>>
            Map<String, Object> arguments = call.args().get();
                   System.out.println("  Tool: " + toolName + ", Args: " + arguments);
            // Application might dispatch execution based on this
          }
        }
        ```

*   **函式回應細節：**
    
    === "Python"
        ```python
        responses = event.get_function_responses()
        if responses:
            for response in responses:
                tool_name = response.name
                result_dict = response.response # The dictionary returned by the tool
                print(f"  Tool Result: {tool_name} -> {result_dict}")
        ```
    === "Java"

        ```java
        import com.google.genai.types.FunctionResponse;
        import com.google.common.collect.ImmutableList;
        import java.util.Map; 

        ImmutableList<FunctionResponse> responses = event.functionResponses(); // from Event.java
        if (!responses.isEmpty()) {
            for (FunctionResponse response : responses) {
                String toolName = response.name().get();
                Map<String, String> result= response.response().get(); // Check before getting the response
                System.out.println("  Tool Result: " + toolName + " -> " + result);
            }
        }
        ```

*   **識別碼：**
    *   `event.id`：此特定事件實例的唯一 ID。
    *   `event.invocation_id`：此事件所屬的整個使用者請求到最終回應週期的 ID。對於日誌記錄和追蹤非常有用。

### 偵測動作與副作用

`event.actions` 物件用於標示已發生或應該發生的變更。在存取 `event.actions` 及其欄位／方法前，請務必先確認其是否存在。

*   **狀態變更（State Changes）：** 提供在產生此事件的步驟中，session state 被修改的鍵值對集合。
    
    === "Python"
        `delta = event.actions.state_delta`（`{key: value}` 鍵值對的字典）。
        ```python
        if event.actions and event.actions.state_delta:
            print(f"  State changes: {event.actions.state_delta}")
            # Update local UI or application state if necessary
        ```
    === "Java"
        `ConcurrentMap<String, Object> delta = event.actions().stateDelta();`

        ```java
        import java.util.concurrent.ConcurrentMap;
        import com.google.adk.events.EventActions;

        EventActions actions = event.actions(); // Assuming event.actions() is not null
        if (actions != null && actions.stateDelta() != null && !actions.stateDelta().isEmpty()) {
            ConcurrentMap<String, Object> stateChanges = actions.stateDelta();
            System.out.println("  State changes: " + stateChanges);
            // Update local UI or application state if necessary
        }
        ```

*   **Artifact Saves：** 提供一個集合，指示哪些 artifact 已被儲存，以及它們的新版本號（或相關的 `Part` 資訊）。
    
    === "Python"
        `artifact_changes = event.actions.artifact_delta`（`{filename: version}` 的字典）。
        ```python
        if event.actions and event.actions.artifact_delta:
            print(f"  Artifacts saved: {event.actions.artifact_delta}")
            # UI might refresh an artifact list
        ```
    === "Java"
        `ConcurrentMap<String, Part> artifactChanges = event.actions().artifactDelta();`
        
        ```java
        import java.util.concurrent.ConcurrentMap;
        import com.google.genai.types.Part;
        import com.google.adk.events.EventActions;

        EventActions actions = event.actions(); // Assuming event.actions() is not null
        if (actions != null && actions.artifactDelta() != null && !actions.artifactDelta().isEmpty()) {
            ConcurrentMap<String, Part> artifactChanges = actions.artifactDelta();
            System.out.println("  Artifacts saved: " + artifactChanges);
            // UI might refresh an artifact list
            // Iterate through artifactChanges.entrySet() to get filename and Part details
        }
        ```

*   **控制流程訊號（Control Flow Signals）：** 檢查布林旗標或字串值：

    === "Python"
        *   `event.actions.transfer_to_agent`（string）：控制流程應該交由指定名稱的 agent 處理。
        *   `event.actions.escalate`（bool）：應該終止迴圈。
        *   `event.actions.skip_summarization`（bool）：工具結果不應由大型語言模型 (LLM) 進行摘要。
        ```python
        if event.actions:
            if event.actions.transfer_to_agent:
                print(f"  Signal: Transfer to {event.actions.transfer_to_agent}")
            if event.actions.escalate:
                print("  Signal: Escalate (terminate loop)")
            if event.actions.skip_summarization:
                print("  Signal: Skip summarization for tool result")
        ```
    === "Java"
        *   `event.actions().transferToAgent()`（回傳 `Optional<String>`）：控制權應該交給指定的 agent。
        *   `event.actions().escalate()`（回傳 `Optional<Boolean>`）：應該終止迴圈。
        *   `event.actions().skipSummarization()`（回傳 `Optional<Boolean>`）：工具結果不應由大型語言模型 (LLM) 進行摘要。

        ```java
        import com.google.adk.events.EventActions;
        import java.util.Optional;

        EventActions actions = event.actions(); // Assuming event.actions() is not null
        if (actions != null) {
            Optional<String> transferAgent = actions.transferToAgent();
            if (transferAgent.isPresent()) {
                System.out.println("  Signal: Transfer to " + transferAgent.get());
            }

            Optional<Boolean> escalate = actions.escalate();
            if (escalate.orElse(false)) { // or escalate.isPresent() && escalate.get()
                System.out.println("  Signal: Escalate (terminate loop)");
            }

            Optional<Boolean> skipSummarization = actions.skipSummarization();
            if (skipSummarization.orElse(false)) { // or skipSummarization.isPresent() && skipSummarization.get()
                System.out.println("  Signal: Skip summarization for tool result");
            }
        }
        ```

### 判斷事件是否為「最終」回應

使用內建的輔助函式 `event.is_final_response()` 來判斷哪些事件適合作為 agent 回合的完整輸出顯示給使用者。

*   **目的：** 過濾掉中間步驟（例如工具呼叫 (tool calls)、部分串流文字、內部狀態更新），僅保留最終要呈現給使用者的訊息。
*   **什麼時候會是 `True`？**
    1.  事件包含工具結果（`function_response`），且 `skip_summarization` 為 `True`。
    2.  事件包含針對被標記為 `is_long_running=True` 的工具所進行的工具呼叫 (`function_call`)。在 Java 中，請檢查 `longRunningToolIds` 清單是否為空：
        *   `event.longRunningToolIds().isPresent() && !event.longRunningToolIds().get().isEmpty()` 為 `true`。
    3.  或者，**同時**符合以下所有條件：
        *   沒有 function calls（`get_function_calls()` 為空）。
        *   沒有 function responses（`get_function_responses()` 為空）。
        *   不是部分串流片段（`partial` 不是 `True`）。
        *   結尾不是可能還需要進一步處理／顯示的程式碼執行結果。
*   **用法：** 在您的應用程式邏輯中，對事件串流進行過濾。

    === "Python"
        ```python
        # Pseudocode: Handling final responses in application (Python)
        # full_response_text = ""
        # async for event in runner.run_async(...):
        #     # Accumulate streaming text if needed...
        #     if event.partial and event.content and event.content.parts and event.content.parts[0].text:
        #         full_response_text += event.content.parts[0].text
        #
        #     # Check if it's a final, displayable event
        #     if event.is_final_response():
        #         print("\n--- Final Output Detected ---")
        #         if event.content and event.content.parts and event.content.parts[0].text:
        #              # If it's the final part of a stream, use accumulated text
        #              final_text = full_response_text + (event.content.parts[0].text if not event.partial else "")
        #              print(f"Display to user: {final_text.strip()}")
        #              full_response_text = "" # Reset accumulator
        #         elif event.actions and event.actions.skip_summarization and event.get_function_responses():
        #              # Handle displaying the raw tool result if needed
        #              response_data = event.get_function_responses()[0].response
        #              print(f"Display raw tool result: {response_data}")
        #         elif hasattr(event, 'long_running_tool_ids') and event.long_running_tool_ids:
        #              print("Display message: Tool is running in background...")
        #         else:
        #              # Handle other types of final responses if applicable
        #              print("Display: Final non-textual response or signal.")
        ```
    === "Java"
        ```java
        // Pseudocode: Handling final responses in application (Java)
        import com.google.adk.events.Event;
        import com.google.genai.types.Content;
        import com.google.genai.types.FunctionResponse;
        import java.util.Map;

        StringBuilder fullResponseText = new StringBuilder();
        runner.run(...).forEach(event -> { // Assuming a stream of events
             // Accumulate streaming text if needed...
             if (event.partial().orElse(false) && event.content().isPresent()) {
                 event.content().flatMap(Content::parts).ifPresent(parts -> {
                     if (!parts.isEmpty() && parts.get(0).text().isPresent()) {
                         fullResponseText.append(parts.get(0).text().get());
                    }
                 });
             }
        
             // Check if it's a final, displayable event
             if (event.finalResponse()) { // Using the method from Event.java
                 System.out.println("\n--- Final Output Detected ---");
                 if (event.content().isPresent() &&
                     event.content().flatMap(Content::parts).map(parts -> !parts.isEmpty() && parts.get(0).text().isPresent()).orElse(false)) {
                     // If it's the final part of a stream, use accumulated text
                     String eventText = event.content().get().parts().get().get(0).text().get();
                     String finalText = fullResponseText.toString() + (event.partial().orElse(false) ? "" : eventText);
                     System.out.println("Display to user: " + finalText.trim());
                     fullResponseText.setLength(0); // Reset accumulator
                 } else if (event.actions() != null && event.actions().skipSummarization().orElse(false)
                            && !event.functionResponses().isEmpty()) {
                     // Handle displaying the raw tool result if needed,
                     // especially if finalResponse() was true due to other conditions
                     // or if you want to display skipped summarization results regardless of finalResponse()
                     Map<String, Object> responseData = event.functionResponses().get(0).response().get();
                     System.out.println("Display raw tool result: " + responseData);
                 } else if (event.longRunningToolIds().isPresent() && !event.longRunningToolIds().get().isEmpty()) {
                     // This case is covered by event.finalResponse()
                     System.out.println("Display message: Tool is running in background...");
                 } else {
                     // Handle other types of final responses if applicable
                     System.out.println("Display: Final non-textual response or signal.");
                 }
             }
         });
        ```

透過仔細檢視事件的這些面向，你可以打造出能夠正確回應 Agent Development Kit (ADK) 系統中豐富資訊流的強健應用程式。

## 事件流程：產生與處理

事件會在不同階段被建立，並由框架系統性地處理。理解這個流程有助於釐清動作與歷史紀錄的管理方式。

*   **產生來源：**
    *   **使用者輸入：** `Runner` 通常會將初始的使用者訊息或對話中的輸入包裝成帶有 `author='user'` 的 `Event`。
    *   **agent 邏輯：** agent（`BaseAgent`、`LlmAgent`）會明確地建立 `yield Event(...)` 物件（設定 `author=self.name`），以傳遞回應或發出動作訊號。
    *   **大型語言模型 (LLM) 回應：** ADK 模型整合層會將原始 LLM 輸出（文字、函式呼叫、錯誤）轉換為由呼叫 agent 所產生的 `Event` 物件。
    *   **工具結果：** 工具執行後，框架會產生包含 `function_response` 的 `Event`。`author` 通常是請求該工具的 agent，而 `content` 內的 `role` 會為 LLM 歷史紀錄設為 `'user'`。

*   **處理流程：**
    1.  **讓渡／回傳：** 事件由來源產生並以 yield（Python）或 return/emit（Java）方式傳出。
    2.  **Runner 接收：** 執行 agent 的主要 `Runner` 會接收到該事件。
    3.  **SessionService 處理：** `Runner` 會將事件傳送至已設定的 `SessionService`。這是關鍵步驟：
        *   **套用差異（delta）：** 該服務會將 `event.actions.state_delta` 合併進 `session.state`，並根據 `event.actions.artifact_delta` 更新內部紀錄。（注意：實際的 artifact *儲存* 通常在先前呼叫 `context.save_artifact` 時已經完成）
        *   **最終化中繼資料：** 若尚未存在，會指派唯一的 `event.id`，並可能更新 `event.timestamp`。
        *   **寫入歷史紀錄：** 將處理後的事件附加到 `session.events` 清單中。
    4.  **對外讓渡：** `Runner` 會將處理後的事件以 yield（Python）或 return/emit（Java）方式傳遞給呼叫應用程式（例如，呼叫 `runner.run_async` 的程式碼）。

此流程可確保每個事件的狀態變更與歷史紀錄，會與其溝通內容一併一致地被記錄下來。

## 常見事件範例（說明性模式）

以下是你在事件串流中可能會看到的典型事件簡要範例：

*   **使用者輸入：**
    ```json
    {
      "author": "user",
      "invocation_id": "e-xyz...",
      "content": {"parts": [{"text": "Book a flight to London for next Tuesday"}]}
      // actions usually empty
    }
    ```
*   **Agent 最終文字回應：** (`is_final_response() == True`)
    ```json
    {
      "author": "TravelAgent",
      "invocation_id": "e-xyz...",
      "content": {"parts": [{"text": "Okay, I can help with that. Could you confirm the departure city?"}]},
      "partial": false,
      "turn_complete": true
      // actions might have state delta, etc.
    }
    ```
*   **Agent 串流文字回應：** (`is_final_response() == False`)
    ```json
    {
      "author": "SummaryAgent",
      "invocation_id": "e-abc...",
      "content": {"parts": [{"text": "The document discusses three main points:"}]},
      "partial": true,
      "turn_complete": false
    }
    // ... more partial=True events follow ...
    ```
*   **工具呼叫請求（由大型語言模型 (LLM) 發起）：** (`is_final_response() == False`)
    ```json
    {
      "author": "TravelAgent",
      "invocation_id": "e-xyz...",
      "content": {"parts": [{"function_call": {"name": "find_airports", "args": {"city": "London"}}}]}
      // actions usually empty
    }
    ```
*   **工具結果已提供（給大型語言模型 (LLM)）：**（`is_final_response()` 依賴於 `skip_summarization`）
    ```json
    {
      "author": "TravelAgent", // Author is agent that requested the call
      "invocation_id": "e-xyz...",
      "content": {
        "role": "user", // Role for LLM history
        "parts": [{"function_response": {"name": "find_airports", "response": {"result": ["LHR", "LGW", "STN"]}}}]
      }
      // actions might have skip_summarization=True
    }
    ```
*   **僅限 State/Artifact 更新：**（`is_final_response() == False`）
    ```json
    {
      "author": "InternalUpdater",
      "invocation_id": "e-def...",
      "content": null,
      "actions": {
        "state_delta": {"user_status": "verified"},
        "artifact_delta": {"verification_doc.pdf": 2}
      }
    }
    ```
*   **Agent 轉移訊號：** (`is_final_response() == False`)
    ```json
    {
      "author": "OrchestratorAgent",
      "invocation_id": "e-789...",
      "content": {"parts": [{"function_call": {"name": "transfer_to_agent", "args": {"agent_name": "BillingAgent"}}}]},
      "actions": {"transfer_to_agent": "BillingAgent"} // Added by framework
    }
    ```
*   **迴圈升級訊號：** (`is_final_response() == False`)
    ```json
    {
      "author": "CheckerAgent",
      "invocation_id": "e-loop...",
      "content": {"parts": [{"text": "Maximum retries reached."}]}, // Optional content
      "actions": {"escalate": true}
    }
    ```

## 其他上下文與事件細節

除了核心概念外，以下是關於上下文與事件的一些特定細節，對某些使用情境來說非常重要：

1.  **`ToolContext.function_call_id`（工具動作連結）：**
    *   當大型語言模型 (LLM) 請求一個工具（FunctionCall）時，該請求會有一個 ID。傳遞給你的工具函式的 `ToolContext` 會包含這個 `function_call_id`。
    *   **重要性：** 這個 ID 對於將像是驗證等動作回溯到發起它們的特定工具請求非常關鍵，特別是在單一回合中呼叫多個工具時。框架會在內部使用這個 ID。

2.  **狀態／產物變更的記錄方式：**
    *   當你使用 `CallbackContext` 或 `ToolContext` 修改 state 或儲存 artifact 時，這些變更不會立即寫入永久性儲存。
    *   相反地，這些變更會填入 `EventActions` 物件中的 `state_delta` 與 `artifact_delta` 欄位。
    *   這個 `EventActions` 物件會附加在變更發生後產生的「下一個事件」上（例如 agent 的回應或工具結果事件）。
    *   `SessionService.append_event` 方法會從收到的事件中讀取這些 delta，並將它們套用到 session 的永久狀態與 artifact 記錄。這可確保變更依時間順序與事件流綁定。

3.  **State 範圍前綴（`app:`、`user:`、`temp:`）：**
    *   當你透過 `context.state` 管理 state 時，可以選擇性地使用前綴：
        *   `app:my_setting`：表示與整個應用程式相關的 state（需要持久化的 `SessionService`）。
        *   `user:user_preference`：表示與特定使用者跨 session 相關的 state（需要持久化的 `SessionService`）。
        *   `temp:intermediate_result` 或無前綴：通常為本次呼叫的 session 特定或暫時性 state。
    *   底層的 `SessionService` 會決定這些前綴在持久化時的處理方式。

4.  **錯誤事件：**
    *   `Event` 可以代表一個錯誤。請檢查 `event.error_code` 與 `event.error_message` 欄位（繼承自 `LlmResponse`）。
    *   錯誤可能來自大型語言模型 (LLM)（例如安全過濾、資源限制），也可能是框架在工具嚴重失敗時包裝的。請檢查工具 `FunctionResponse` 內容以獲得常見的工具專屬錯誤。
    ```json
    // Example Error Event (conceptual)
    {
      "author": "LLMAgent",
      "invocation_id": "e-err...",
      "content": null,
      "error_code": "SAFETY_FILTER_TRIGGERED",
      "error_message": "Response blocked due to safety settings.",
      "actions": {}
    }
    ```

這些細節為進階應用場景（如工具驗證、狀態持久化範圍，以及事件流中的錯誤處理）提供了更完整的說明。

## 使用事件的最佳實踐

要在你的 Agent Development Kit (ADK) 應用程式中有效運用事件，請遵循以下建議：

*   **明確標註作者（Clear Authorship）：** 當你建立自訂 agent 時，請確保 agent 行為在歷史紀錄中正確歸屬。框架通常會正確處理大型語言模型 (LLM)/工具事件的作者資訊。
    
    === "Python"
        在`BaseAgent`的子類別中使用`yield Event(author=self.name, ...)`。
    === "Java"
        在自訂 agent 邏輯中建立`Event`時，請設定作者，例如：`Event.builder().author(this.getAgentName()) // ... .build();`

*   **語意內容與動作（Semantic Content & Actions）：** 請使用`event.content`來承載核心訊息/資料（文字、函式呼叫/回應）。針對副作用（狀態/產物變更）或控制流程（`transfer`、`escalate`、`skip_summarization`），請專門使用`event.actions`來標示。
*   **冪等性意識（Idempotency Awareness）：** 請理解`SessionService`負責套用`event.actions`中標示的狀態/產物變更。雖然 ADK 服務致力於保持一致性，但若你的應用邏輯重複處理事件，請考慮可能的下游影響。
*   **善用`is_final_response()`：** 在你的應用/UI 層中，請依賴這個輔助方法來判斷完整、面向使用者的文字回應。避免手動重現其邏輯。
*   **善用歷史紀錄（Leverage History）：** session 的事件列表是你主要的除錯工具。檢查作者、內容與動作的順序，以追蹤執行流程並診斷問題。
*   **使用中繼資料（Use Metadata）：** 請利用`invocation_id`來關聯單一使用者互動中的所有事件。使用`event.id`來參照特定且唯一的事件發生。

將事件視為具備明確內容與動作結構的訊息，是在 ADK 中建構、除錯與管理複雜 agent 行為的關鍵。