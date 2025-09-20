# Events

事件（Events）是 Agent Development Kit (ADK)（ADK）中資訊流動的基本單位。它們代表了 agent 互動生命週期中每一個重要的發生時刻，從使用者的初始輸入到最終回應，以及中間的所有步驟。理解事件至關重要，因為事件是元件之間溝通、狀態管理與控制流程導向的主要方式。

## 什麼是事件，以及它們為何重要

在 ADK 中，`Event` 是一個不可變的紀錄，用來表示 agent 執行過程中的特定時點。它會捕捉使用者訊息、agent 回覆、工具使用請求（函式呼叫）、工具結果、狀態變更、控制訊號以及錯誤等資訊。

=== "Python"
    技術上來說，它是 `google.adk.events.Event` 類別的實例，該類別在基本的 `LlmResponse` 結構上，加入了 ADK 特有的必要中繼資料以及 `actions` 載荷（payload）。

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
    在 Java 中，這是一個 `com.google.adk.events.Event` 類別的實例。它在基本回應結構的基礎上，加入了重要的 Agent Development Kit (ADK) 專屬中繼資料以及 `actions` 載荷（payload）。

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

1.  **溝通（Communication）：** 事件作為用戶介面、`Runner`、代理（agent）、大型語言模型 (LLM) 以及工具（tools）之間的標準訊息格式。所有資料皆以`Event`的形式流動。

2.  **狀態與產物變更的訊號（Signaling State & Artifact Changes）：** 事件攜帶狀態修改指令並追蹤產物（artifact）更新。`SessionService`會利用這些訊號來確保資料持久化。在 Python 中，變更會透過`event.actions.state_delta`與`event.actions.artifact_delta`來傳遞訊號。

3.  **控制流程（Control Flow）：** 特定欄位如`event.actions.transfer_to_agent`或`event.actions.escalate`可作為框架的控制訊號，用以決定下一個執行的 agent，或判斷是否應該結束迴圈。

4.  **歷史紀錄與可觀察性（History & Observability）：** 在`session.events`中記錄的事件序列，完整且按時間順序保存了互動歷程，對於除錯、稽核以及逐步理解 agent 行為極為寶貴。

總結來說，從用戶發出查詢到 agent 給出最終回應，整個過程都是透過`Event`物件的產生、解讀與處理來協調完成的。


## 理解與使用事件（Understanding and Using Events）

作為開發者，你主要會與`Runner`所產生的事件串流互動。以下說明如何理解並擷取這些事件中的資訊：

!!! Note
    不同 SDK 語言的基礎參數或方法名稱可能略有不同（例如 Python 中為`event.content()`，Java 中為`event.content().get().parts()`）。請參考各語言的 API 參考文件以取得詳細資訊。

### 辨識事件來源與類型（Identifying Event Origin and Type）

你可以透過以下方式快速判斷事件的意義：

*   **誰發送的？（`event.author`）**
    *   `'user'`：表示來自最終用戶的直接輸入。
    *   `'AgentName'`：表示來自特定 agent 的輸出或動作（例如：`'WeatherAgent'`、`'SummarizerAgent'`）。
*   **主要負載內容為何？（`event.content` 與 `event.content.parts`）**
    *   **文字（Text）：** 表示對話訊息。在 Python 中，請檢查`event.content.parts[0].text`是否存在；在 Java 中，請確認`event.content()`存在、其`parts()`不為空，且第一個部分的`text()`存在。
    *   **工具呼叫請求（Tool Call Request）：** 檢查`event.get_function_calls()`。若不為空，代表 LLM 請求執行一個或多個工具。清單中的每個項目都包含`.name`與`.args`。
    *   **工具執行結果（Tool Result）：** 檢查`event.get_function_responses()`。若不為空，表示此事件包含工具執行的結果。每個項目都會有`.name`與`.response`（工具回傳的 dictionary）。*注意：* 為了結構化歷史紀錄，`content`中的`role`通常是`'user'`，但事件的`author`通常是請求工具呼叫的 agent。

*   **是否為串流輸出？（`event.partial`）**
    表示這是否為 LLM 輸出的未完成文字片段。
    *   `True`：後續還會有更多文字。
    *   `False` 或 `None`/`Optional.empty()`：此部分內容已完成（但若`turn_complete`同時為 false，則整個回合尚未結束）。

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
    在存取文字前，請務必先檢查 content 和 parts 是否存在。在 Python 中為 `text = event.content.parts[0].text`。

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
    *   `event.invocation_id`：此事件所屬的整個使用者請求到最終回應流程的 ID。對於日誌記錄與追蹤非常有用。

### 偵測動作與副作用

`event.actions` 物件用於標示已發生或應該發生的變更。在存取 `event.actions` 及其欄位／方法之前，請務必先檢查其是否存在。

*   **狀態變更：** 提供在產生此事件的步驟中，於 session 狀態被修改的鍵值對集合。
    
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

*   **Artifact Saves：** 提供一個集合，指出哪些 artifact 已被儲存，以及它們的新版本號（或相關的 `Part` 資訊）。
    
    === "Python"
        `artifact_changes = event.actions.artifact_delta`（一個 `{filename: version}` 的字典）。
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
        *   `event.actions.transfer_to_agent`（string）：控制流程應該交給指定名稱的 agent。
        *   `event.actions.escalate`（bool）：應該終止迴圈。
        *   `event.actions.skip_summarization`（bool）：工具的結果不應由大型語言模型 (LLM) 進行摘要。
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
        *   `event.actions().skipSummarization()`（回傳 `Optional<Boolean>`）：大型語言模型 (LLM) 不應該摘要工具結果。

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

請使用內建輔助函式 `event.is_final_response()` 來判斷哪些事件適合作為 agent 在單一回合中的完整輸出顯示給使用者。

*   **目的：** 過濾掉中間步驟（例如工具呼叫、部分串流文字、內部狀態更新），僅保留最終要呈現給使用者的訊息。
*   **什麼時候會是 `True`？**
    1.  事件包含工具結果（`function_response`），且 `skip_summarization` 為 `True`。
    2.  事件包含工具呼叫（`function_call`），且該工具被標記為 `is_long_running=True`。在 Java 中，請檢查 `longRunningToolIds` 清單是否為空：
        *   `event.longRunningToolIds().isPresent() && !event.longRunningToolIds().get().isEmpty()` 為 `true`。
    3.  或者，**同時**符合以下所有條件：
        *   沒有 function calls（`get_function_calls()` 為空）。
        *   沒有 function responses（`get_function_responses()` 為空）。
        *   不是部分串流區塊（`partial` 不是 `True`）。
        *   結尾不是需要進一步處理／顯示的程式碼執行結果。
*   **用法：** 請在您的應用程式邏輯中過濾 event stream。

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

透過仔細檢視事件的這些面向，您可以打造出能夠正確回應 Agent Development Kit (ADK) 系統中豐富資訊流的強健應用程式。

## 事件流程：產生與處理

事件會在不同階段被建立，並由框架系統化地處理。理解這個流程有助於釐清動作與歷史紀錄的管理方式。

*   **產生來源：**
    *   **使用者輸入：** `Runner` 通常會將初始使用者訊息或對話中的輸入包裝成帶有 `author='user'` 的 `Event`。
    *   **agent 邏輯：** 代理（`BaseAgent`、`LlmAgent`）會明確建立 `yield Event(...)` 物件（設定 `author=self.name`）以傳達回應或發出動作信號。
    *   **大型語言模型 (LLM) 回應：** ADK 模型整合層會將原始 LLM 輸出（文字、函式呼叫、錯誤）轉換為由呼叫 agent 所建立的 `Event` 物件。
    *   **工具結果：** 工具執行完畢後，框架會產生包含 `function_response` 的 `Event`。`author` 通常是請求該工具的 agent，而 `content` 內的 `role` 則會為 LLM 歷史紀錄設為 `'user'`。

*   **處理流程：**
    1.  **讓渡／回傳：** 事件由來源產生並以 yield（Python）或 return/emit（Java）的方式讓渡或回傳。
    2.  **Runner 接收：** 執行 agent 的主要 `Runner` 會接收到該事件。
    3.  **SessionService 處理：** `Runner` 會將事件傳送至已設定的 `SessionService`。這是關鍵步驟：
        *   **套用狀態差異（delta）：** 該服務會將 `event.actions.state_delta` 合併進 `session.state`，並根據 `event.actions.artifact_delta` 更新內部紀錄。（注意：實際的 artifact *儲存* 通常會在較早呼叫 `context.save_artifact` 時發生）。
        *   **完成中繼資料：** 若尚未存在，則指派唯一的 `event.id`，並可能更新 `event.timestamp`。
        *   **寫入歷史紀錄：** 將處理後的事件附加到 `session.events` 清單中。
    4.  **對外讓渡：** `Runner` 會將處理後的事件以 yield（Python）或 return/emit（Java）的方式對外傳遞給呼叫應用程式（例如呼叫 `runner.run_async` 的程式碼）。

此流程確保每個事件的狀態變更與歷史紀錄，能與其溝通內容一同被一致地記錄下來。

## 常見事件範例（說明性模式）

以下是您在事件串流中可能看到的典型事件簡要範例：

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
*   **工具呼叫請求（由大型語言模型 (LLM) 發出）：** (`is_final_response() == False`)
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
*   **僅狀態／產物（Artifact）更新：**（`is_final_response() == False`）
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
*   **Agent Transfer Signal:**（`is_final_response() == False`）
    ```json
    {
      "author": "OrchestratorAgent",
      "invocation_id": "e-789...",
      "content": {"parts": [{"function_call": {"name": "transfer_to_agent", "args": {"agent_name": "BillingAgent"}}}]},
      "actions": {"transfer_to_agent": "BillingAgent"} // Added by framework
    }
    ```
*   **Loop Escalation Signal：**（`is_final_response() == False`）
    ```json
    {
      "author": "CheckerAgent",
      "invocation_id": "e-loop...",
      "content": {"parts": [{"text": "Maximum retries reached."}]}, // Optional content
      "actions": {"escalate": true}
    }
    ```

## 額外的上下文與事件細節

除了核心概念外，以下是針對特定使用情境時，關於上下文與事件的一些重要細節說明：

1.  **`ToolContext.function_call_id`（工具動作連結）：**
    *   當大型語言模型 (LLM) 請求一個工具（FunctionCall）時，該請求會有一個 ID。提供給你的工具函式的 `ToolContext` 會包含這個 `function_call_id`。
    *   **重要性：** 這個 ID 對於將像是驗證等動作，回溯連結到發起該動作的特定工具請求非常關鍵，特別是在同一回合呼叫多個工具時。框架會在內部使用這個 ID。

2.  **狀態／產物變更的記錄方式：**
    *   當你透過 `CallbackContext` 或 `ToolContext` 修改狀態或儲存產物時，這些變更不會立即寫入永久儲存。
    *   相反地，這些變更會填入 `state_delta` 與 `artifact_delta` 欄位，並存放於 `EventActions` 物件中。
    *   這個 `EventActions` 物件會附加在變更後產生的*下一個事件*上（例如 agent 的回應或工具結果事件）。
    *   `SessionService.append_event` 方法會從收到的事件中讀取這些差異（delta），並套用到 session 的永久狀態與產物記錄中。這確保所有變更都會依事件流程的時間順序綁定。

3.  **狀態作用域前綴（`app:`、`user:`、`temp:`）：**
    *   當你透過 `context.state` 管理狀態時，可以選擇性地使用前綴：
        *   `app:my_setting`：表示與整個應用程式相關的狀態（需有永久性的 `SessionService`）。
        *   `user:user_preference`：表示特定使用者跨 session 相關的狀態（需有永久性的 `SessionService`）。
        *   `temp:intermediate_result` 或無前綴：通常為目前呼叫的 session 專屬或暫時性狀態。
    *   底層的 `SessionService` 會決定這些前綴在持久化時的處理方式。

4.  **錯誤事件：**
    *   `Event` 可以代表一個錯誤。請檢查 `event.error_code` 與 `event.error_message` 欄位（繼承自 `LlmResponse`）。
    *   錯誤可能來自大型語言模型 (LLM)（例如安全過濾、資源限制），也可能是框架在工具嚴重失敗時包裝產生。對於常見的工具專屬錯誤，請檢查工具的 `FunctionResponse` 內容。
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

這些細節為進階使用情境（如工具驗證、狀態持久化範圍，以及事件串流中的錯誤處理）提供了更完整的說明。

## 使用事件的最佳實踐

要在您的 Agent Development Kit (ADK) 應用程式中有效地使用事件，請遵循以下建議：

*   **明確標註作者（Authorship）：** 當您建立自訂 agent 時，請確保 agent 行為在 session 歷史紀錄中有正確的作者歸屬。框架通常會正確處理大型語言模型 (LLM)/工具事件的作者標註。
    
    === "Python"
        在 `BaseAgent` 的子類別中使用 `yield Event(author=self.name, ...)`。
    === "Java"
        在自訂 agent 邏輯中建立 `Event` 時，請設定作者，例如：`Event.builder().author(this.getAgentName()) // ... .build();`

*   **語意內容與動作分離：** 使用 `event.content` 來承載核心訊息/資料（文字、函式呼叫/回應）。使用 `event.actions` 專門用於標示副作用（狀態/產物變更）或控制流程（`transfer`、`escalate`、`skip_summarization`）。
*   **注意冪等性（Idempotency）：** 請理解 `SessionService` 負責套用 `event.actions` 中標示的狀態/產物變更。雖然 ADK 服務致力於確保一致性，但若您的應用程式邏輯重複處理事件，請考慮可能的下游影響。
*   **善用 `is_final_response()`：** 在您的應用程式/UI 層依賴這個輔助方法來判斷完整、面向使用者的文字回應。請避免手動複製其邏輯。
*   **活用歷史紀錄：** session 的事件清單是您主要的除錯工具。檢查作者、內容與動作的順序，以追蹤執行流程並診斷問題。
*   **利用中繼資料（Metadata）：** 使用 `invocation_id` 來關聯單一使用者互動中的所有事件。使用 `event.id` 來參照特定且唯一的事件發生。

將事件視為具有明確內容與動作目的的結構化訊息，是在 ADK 中建構、除錯與管理複雜 agent 行為的關鍵。