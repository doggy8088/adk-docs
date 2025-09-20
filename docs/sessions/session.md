# Session：追蹤個別對話

在閱讀完前言後，讓我們深入了解`Session`。回想一下「對話串」這個概念。就像你不會每次傳送簡訊都從頭開始，agent 也需要了解持續互動的上下文。**`Session`** 是專為追蹤與管理這些個別對話串而設計的 Agent Development Kit (ADK) 物件。

## `Session` 物件

當使用者開始與你的 agent 互動時，`SessionService` 會建立一個 `Session` 物件（`google.adk.sessions.Session`）。這個物件就像是一個容器，專門儲存與*該特定對話串*相關的所有資訊。以下是它的主要屬性：

*   **識別資訊（`id`、`appName`、`userId`）：** 對話的唯一標籤。
    * `id`：此*特定*對話串的唯一識別碼，對於後續擷取非常重要。一個 SessionService 物件可以管理多個 `Session`。此欄位用來標示我們指的是哪一個 session 物件。例如："test_id_modification"。
    * `app_name`：標示此對話屬於哪個 agent 應用程式。例如："id_modifier_workflow"。
    * `userId`：將對話串連結到特定使用者。
*   **歷史紀錄（`events`）：** 依時間排序的所有互動紀錄（`Event` 物件——包含使用者訊息、agent 回應、工具動作），都發生在這個特定對話串中。
*   **session state（`state`）：** 用來暫存*僅與這個特定進行中對話*相關的臨時資料。這就像是 agent 在互動過程中的備忘錄。我們會在下一節詳細介紹如何使用與管理 `state`。
*   **活動追蹤（`lastUpdateTime`）：** 記錄此對話串最後一次事件發生時間的時間戳記。

### 範例：檢視 Session 屬性

=== "Python"

       ```py
        from google.adk.sessions import InMemorySessionService, Session
    
        # Create a simple session to examine its properties
        temp_service = InMemorySessionService()
        example_session = await temp_service.create_session(
            app_name="my_app",
            user_id="example_user",
            state={"initial_key": "initial_value"} # State can be initialized
        )

        print(f"--- Examining Session Properties ---")
        print(f"ID (`id`):                {example_session.id}")
        print(f"Application Name (`app_name`): {example_session.app_name}")
        print(f"User ID (`user_id`):         {example_session.user_id}")
        print(f"State (`state`):           {example_session.state}") # Note: Only shows initial state here
        print(f"Events (`events`):         {example_session.events}") # Initially empty
        print(f"Last Update (`last_update_time`): {example_session.last_update_time:.2f}")
        print(f"---------------------------------")

        # Clean up (optional for this example)
        temp_service = await temp_service.delete_session(app_name=example_session.app_name,
                                    user_id=example_session.user_id, session_id=example_session.id)
        print("The final status of temp_service - ", temp_service)
       ```

=== "Java"

       ```java
        import com.google.adk.sessions.InMemorySessionService;
        import com.google.adk.sessions.Session;
        import java.util.concurrent.ConcurrentMap;
        import java.util.concurrent.ConcurrentHashMap;
    
        String sessionId = "123";
        String appName = "example-app"; // Example app name
        String userId = "example-user"; // Example user id
        ConcurrentMap<String, Object> initialState = new ConcurrentHashMap<>(Map.of("newKey", "newValue"));
        InMemorySessionService exampleSessionService = new InMemorySessionService();
    
        // Create Session
        Session exampleSession = exampleSessionService.createSession(
            appName, userId, initialState, Optional.of(sessionId)).blockingGet();
        System.out.println("Session created successfully.");
    
        System.out.println("--- Examining Session Properties ---");
        System.out.printf("ID (`id`): %s%n", exampleSession.id());
        System.out.printf("Application Name (`appName`): %s%n", exampleSession.appName());
        System.out.printf("User ID (`userId`): %s%n", exampleSession.userId());
        System.out.printf("State (`state`): %s%n", exampleSession.state());
        System.out.println("------------------------------------");
    
    
        // Clean up (optional for this example)
        var unused = exampleSessionService.deleteSession(appName, userId, sessionId);
       ```

*(**注意：** 上述所顯示的 state 僅為初始狀態。狀態的更新會透過事件（Event）發生，詳見 State 章節說明。)*

## 使用 `SessionService` 管理 Session

如上所示，你通常不會直接建立或管理 `Session` 物件。相反地，你會使用 **`SessionService`**。這個服務會作為集中管理者，負責整個對話 session 的生命週期。

其核心職責包括：

*   **啟動新對話：** 當使用者開始互動時，建立新的 `Session` 物件。
*   **繼續現有對話：** 根據 ID 取得特定的 `Session`，讓 agent 能從中斷處繼續對話。
*   **儲存進度：** 將新的互動（`Event` 物件）加入 session 歷史紀錄。這也是 session `state` 更新的機制（詳見 `State` 章節）。
*   **列出對話：** 找出特定使用者與應用程式的所有活躍 session 執行緒。
*   **清理：** 當對話結束或不再需要時，刪除 `Session` 物件及其相關資料。

## `SessionService` 的實作

Agent Development Kit (ADK) 提供多種 `SessionService` 實作，讓你可以根據需求選擇最合適的儲存後端：

1.  **`InMemorySessionService`**

    *   **運作方式：** 將所有 session 資料直接儲存在應用程式記憶體中。
    *   **持久性：** 無。**如果應用程式重新啟動，所有對話資料都會遺失。**
    *   **額外需求：** 無需額外安裝。
    *   **適用於：** 快速開發、本機測試、範例，以及不需要長期保存資料的情境。

    === "Python"
    
           ```py
            from google.adk.sessions import InMemorySessionService
            session_service = InMemorySessionService()
           ```
    === "Java"
    
           ```java
            import com.google.adk.sessions.InMemorySessionService;
            InMemorySessionService exampleSessionService = new InMemorySessionService();
           ```

2.  **`VertexAiSessionService`**

    *   **運作方式：** 透過 API 呼叫，使用 Google Cloud Vertex AI 基礎設施進行 session 管理。
    *   **持久性：** 有。資料會透過 [Vertex AI Agent Engine](https://doggy8088.github.io/adk-docs/deploy/agent-engine/) 以可靠且可擴展的方式進行管理。
    *   **需求：**
        *   一個 Google Cloud 專案（`pip install vertexai`）
        *   一個 Google Cloud 儲存 bucket，可依照此 [步驟](https://cloud.google.com/vertex-ai/docs/pipelines/configure-project#storage) 進行設定。
        *   一個 Reasoning Engine 資源名稱/ID，可依照此 [教學](https://doggy8088.github.io/adk-docs/deploy/agent-engine/) 進行設定。
        *   如果你尚未擁有 Google Cloud 專案，且想要免費試用 VertexAiSessionService，請參考如何 [免費試用 Session 和 Memory。](express-mode.md)
    *   **最適用於：** 部署於 Google Cloud 上、需要高擴展性的正式環境應用，特別是需要整合其他 Vertex AI 功能時。

    === "Python"
    
           ```py
           # Requires: pip install google-adk[vertexai]
           # Plus GCP setup and authentication
           from google.adk.sessions import VertexAiSessionService

           PROJECT_ID = "your-gcp-project-id"
           LOCATION = "us-central1"
           # The app_name used with this service should be the Reasoning Engine ID or name
           REASONING_ENGINE_APP_NAME = "projects/your-gcp-project-id/locations/us-central1/reasoningEngines/your-engine-id"

           session_service = VertexAiSessionService(project=PROJECT_ID, location=LOCATION)
           # Use REASONING_ENGINE_APP_NAME when calling service methods, e.g.:
           # session_service = await session_service.create_session(app_name=REASONING_ENGINE_APP_NAME, ...)
           ```
       
    === "Java"
    
           ```java
           // Please look at the set of requirements above, consequently export the following in your bashrc file:
           // export GOOGLE_CLOUD_PROJECT=my_gcp_project
           // export GOOGLE_CLOUD_LOCATION=us-central1
           // export GOOGLE_API_KEY=my_api_key

           import com.google.adk.sessions.VertexAiSessionService;
           import java.util.UUID;

           String sessionId = UUID.randomUUID().toString();
           String reasoningEngineAppName = "123456789";
           String userId = "u_123"; // Example user id
           ConcurrentMap<String, Object> initialState = new
               ConcurrentHashMap<>(); // No initial state needed for this example

           VertexAiSessionService sessionService = new VertexAiSessionService();
           Session mySession =
               sessionService
                   .createSession(reasoningEngineAppName, userId, initialState, Optional.of(sessionId))
                   .blockingGet();
           ```

3.  **`DatabaseSessionService`**

    ![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出/即將推出。"}

    *   **運作方式：** 連接到關聯式資料庫（例如：PostgreSQL、MySQL、SQLite），將 session data 持久性地儲存在資料表中。
    *   **持久性：** 有。資料在應用程式重啟後仍會保留。
    *   **需求：** 需設定好的資料庫。
    *   **適用情境：** 適合需要自行管理、可靠且持久性儲存的應用程式。

    ```py
    from google.adk.sessions import DatabaseSessionService
    # Example using a local SQLite file:
    db_url = "sqlite:///./my_agent_data.db"
    session_service = DatabaseSessionService(db_url=db_url)
    ```

選擇正確的 `SessionService` 是決定 agent 對話歷史與暫存資料如何儲存與持續存在的關鍵。

## Session 生命週期

<img src="../../assets/session_lifecycle.png" alt="Session lifecycle">

以下是 `Session` 與 `SessionService` 在一次對話回合中如何協作的簡化流程：

1.  **開始或繼續：** 你的應用程式需要使用 `SessionService` 來`create_session`（針對新聊天）或使用現有的 session id。
2.  **提供 Context：** `Runner` 會從適當的服務方法取得對應的 `Session` 物件，讓 agent 能夠存取該 Session 的 `state` 與 `events`。
3.  **agent 處理：** 使用者向 agent 發出查詢。agent 會分析查詢內容，並可能參考 session `state` 及 `events` 歷史來決定回應。
4.  **回應與狀態更新：** agent 產生回應（並可能標記需要在 `state` 中更新的資料）。`Runner` 會將這些包裝成 `Event`。
5.  **儲存互動紀錄：** `Runner` 會呼叫 `sessionService.append_event(session, event)`，並以 `session` 及新的 `event` 作為參數。該服務會將 `Event` 加入歷史紀錄，並根據 event 內的資訊，更新儲存中的 session `state`。session 的 `last_update_time` 也會被更新。
6.  **準備下一步：** agent 的回應會傳送給使用者。更新後的 `Session` 現已由 `SessionService` 儲存，準備進入下一回合（通常會在目前 session 中繼續對話，重新開始第 1 步）。
7.  **結束對話：** 當對話結束時，若不再需要，應用程式會呼叫 `sessionService.delete_session(...)` 來清除已儲存的 session 資料。

這個流程說明了 `SessionService` 如何透過管理每個 `Session` 物件相關的歷史與狀態，確保對話的連貫性。
