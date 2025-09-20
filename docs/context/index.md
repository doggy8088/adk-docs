# Context（情境）

## 什麼是 Context（情境）

在 Agent Development Kit (ADK)（ADK）中，「context（情境）」是指在特定操作期間，您的 agent 及其 tools 可取得的重要資訊組合。您可以將其視為 agent 處理當前任務或對話輪次時，所需的背景知識與資源。

agent 通常需要的不僅僅是最新的使用者訊息才能有良好表現。情境資訊至關重要，因為它能夠：

1. **維持狀態（Maintaining State）：** 在多步對話中記住細節（例如：使用者偏好、先前的計算結果、購物車內的商品）。這主要透過 **session state（會話狀態）** 來管理。
2. **資料傳遞（Passing Data）：** 將某一步驟（如大型語言模型 (LLM) 呼叫或工具執行）中發現或產生的資訊，傳遞給後續步驟。這裡 session state 也扮演關鍵角色。
3. **存取服務（Accessing Services）：** 與框架功能互動，例如：
    * **Artifact Storage（成品儲存）：** 儲存或載入與 session 相關的檔案或資料（如 PDF、圖片、設定檔）。
    * **Memory（記憶體）：** 從過去互動紀錄或連結至使用者的外部知識來源中搜尋相關資訊。
    * **Authentication（驗證）：** 請求並取得 tools 存取外部 API 所需的憑證，以確保安全。
4. **身份與追蹤（Identity and Tracking）：** 知道目前執行的是哪個 agent（`agent.name`），並能唯一識別當前的請求-回應循環（`invocation_id`），以便日誌記錄與除錯。
5. **工具專屬操作（Tool-Specific Actions）：** 讓工具內部能執行特殊操作，例如請求驗證或搜尋記憶體，這些都需要取得當前互動的詳細資訊。

將這些資訊在單一、完整的使用者請求到最終回應循環（即一次 **invocation（呼叫）**）中整合在一起的核心物件是 `InvocationContext`。不過，您通常不需要直接建立或管理這個物件。Agent Development Kit (ADK) 框架會在一次 invocation 開始時（例如透過 `runner.run_async`）自動建立它，並將相關的情境資訊隱式傳遞給您的 agent 程式碼、回呼函式與 tools。

=== "Python"

    ```python
    # Conceptual Pseudocode: How the framework provides context (Internal Logic)
    
    # runner = Runner(agent=my_root_agent, session_service=..., artifact_service=...)
    # user_message = types.Content(...)
    # session = session_service.get_session(...) # Or create new
    
    # --- Inside runner.run_async(...) ---
    # 1. Framework creates the main context for this specific run
    # invocation_context = InvocationContext(
    #     invocation_id="unique-id-for-this-run",
    #     session=session,
    #     user_content=user_message,
    #     agent=my_root_agent, # The starting agent
    #     session_service=session_service,
    #     artifact_service=artifact_service,
    #     memory_service=memory_service,
    #     # ... other necessary fields ...
    # )
    #
    # 2. Framework calls the agent's run method, passing the context implicitly
    #    (The agent's method signature will receive it, e.g., runAsyncImpl(InvocationContext invocationContext))
    # await my_root_agent.run_async(invocation_context)
    #   --- End Internal Logic ---
    #
    # As a developer, you work with the context objects provided in method arguments.
    ```

=== "Java"

    ```java
    /* Conceptual Pseudocode: How the framework provides context (Internal Logic) */
    InMemoryRunner runner = new InMemoryRunner(agent);
    Session session = runner
        .sessionService()
        .createSession(runner.appName(), USER_ID, initialState, SESSION_ID )
        .blockingGet();

    try (Scanner scanner = new Scanner(System.in, StandardCharsets.UTF_8)) {
      while (true) {
        System.out.print("\nYou > ");
      }
      String userInput = scanner.nextLine();
      if ("quit".equalsIgnoreCase(userInput)) {
        break;
      }
      Content userMsg = Content.fromParts(Part.fromText(userInput));
      Flowable<Event> events = runner.runAsync(session.userId(), session.id(), userMsg);
      System.out.print("\nAgent > ");
      events.blockingForEach(event -> System.out.print(event.stringifyContent()));
    }
    ```

## 不同類型的 Context

雖然 `InvocationContext` 作為全面的內部容器，Agent Development Kit (ADK) 也提供了針對特定情境設計的專用 context 物件。這確保你在處理各種任務時，能擁有合適的工具與權限，而無需在每個地方都操作完整的內部 context 複雜度。以下是你會遇到的各種「風格」：

1.  **`InvocationContext`**
    *   **使用場景：** 以 `ctx` 參數的形式，直接傳遞給 agent 核心實作方法（`_run_async_impl`、`_run_live_impl`）。
    *   **目的：** 提供對當前呼叫「完整」狀態的存取。這是最全面的 context 物件。
    *   **主要內容：** 可直接存取 `session`（包含 `state` 和 `events`）、當前 `agent` 實例、`invocation_id`、初始 `user_content`、已設定服務的參考（`artifact_service`、`memory_service`、`session_service`），以及與即時/串流模式相關的欄位。
    *   **使用情境：** 主要用於 agent 核心邏輯需要直接存取整體 session 或服務時，雖然大多數狀態與 artifact 的互動會委派給使用自身 context 的 callback 或工具。此外，也可用來控制此次呼叫本身（例如設定 `ctx.end_invocation = True`）。

    === "Python"
    
        ```python
        # Pseudocode: Agent implementation receiving InvocationContext
        from google.adk.agents import BaseAgent
        from google.adk.agents.invocation_context import InvocationContext
        from google.adk.events import Event
        from typing import AsyncGenerator
    
        class MyAgent(BaseAgent):
            async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
                # Direct access example
                agent_name = ctx.agent.name
                session_id = ctx.session.id
                print(f"Agent {agent_name} running in session {session_id} for invocation {ctx.invocation_id}")
                # ... agent logic using ctx ...
                yield # ... event ...
        ```
    
請提供原文、初始譯文、品質分析與改進建議，我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        // Pseudocode: Agent implementation receiving InvocationContext
        import com.google.adk.agents.BaseAgent;
        import com.google.adk.agents.InvocationContext;
        
            LlmAgent root_agent =
                LlmAgent.builder()
                    .model("gemini-***")
                    .name("sample_agent")
                    .description("Answers user questions.")
                    .instruction(
                        """
                        provide instruction for the agent here.
                        """
                    )
                    .tools(sampleTool)
                    .outputKey("YOUR_KEY")
                    .build();
    
            ConcurrentMap<String, Object> initialState = new ConcurrentHashMap<>();
            initialState.put("YOUR_KEY", "");
          
            InMemoryRunner runner = new InMemoryRunner(agent);
            Session session =
                  runner
                      .sessionService()
                      .createSession(runner.appName(), USER_ID, initialState, SESSION_ID )
                      .blockingGet();
    
           try (Scanner scanner = new Scanner(System.in, StandardCharsets.UTF_8)) {
                while (true) {
                  System.out.print("\nYou > ");
                  String userInput = scanner.nextLine();
        
                  if ("quit".equalsIgnoreCase(userInput)) {
                    break;
                  }
                  
                  Content userMsg = Content.fromParts(Part.fromText(userInput));
                  Flowable<Event> events = 
                          runner.runAsync(session.userId(), session.id(), userMsg);
        
                  System.out.print("\nAgent > ");
                  events.blockingForEach(event -> 
                          System.out.print(event.stringifyContent()));
              }
        
            protected Flowable<Event> runAsyncImpl(InvocationContext invocationContext) {
                // Direct access example
                String agentName = invocationContext.agent.name
                String sessionId = invocationContext.session.id
                String invocationId = invocationContext.invocationId
                System.out.println("Agent " + agent_name + " running in session " + session_id + " for invocation " + invocationId)
                // ... agent logic using ctx ...
            }
        ```

2.  **`ReadonlyContext`**
    *   **使用情境：** 適用於僅需讀取基本資訊且不允許變更的情境（例如：`InstructionProvider` 函式）。同時也是其他情境類別的基礎類別。
    *   **目的：** 提供一個安全、唯讀的基本情境細節檢視。
    *   **主要內容：** `invocation_id`、`agent_name`，以及目前 `state` 的唯讀 *view*。

    === "Python"
    
        ```python
        # Pseudocode: Instruction provider receiving ReadonlyContext
        from google.adk.agents.readonly_context import ReadonlyContext
    
        def my_instruction_provider(context: ReadonlyContext) -> str:
            # Read-only access example
            user_tier = context.state().get("user_tier", "standard") # Can read state
            # context.state['new_key'] = 'value' # This would typically cause an error or be ineffective
            return f"Process the request for a {user_tier} user."
        ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        // Pseudocode: Instruction provider receiving ReadonlyContext
        import com.google.adk.agents.ReadonlyContext;
    
        public String myInstructionProvider(ReadonlyContext context){
            // Read-only access example
            String userTier = context.state().get("user_tier", "standard");
            context.state().put('new_key', 'value'); //This would typically cause an error
            return "Process the request for a " + userTier + " user."
        }
        ```
    
3.  **`CallbackContext`**
    *   **使用場景：**作為 `callback_context` 傳遞給 agent 生命週期回呼（`before_agent_callback`、`after_agent_callback`）以及模型互動回呼（`before_model_callback`、`after_model_callback`）。
    *   **目的：**便於在*回呼函式內*檢查與修改狀態、與 artifact 互動，以及存取呼叫細節。
    *   **主要功能（相較於 `ReadonlyContext` 的擴充）：**
        *   **可變動的 `state` 屬性：**允許讀取*與寫入* session 狀態。在此進行的變更（`callback_context.state['key'] = value`）會被追蹤，並在回呼後與由框架產生的事件關聯。
        *   **Artifact 方法：**提供 `load_artifact(filename)` 與 `save_artifact(filename, part)` 方法，以便與已設定的 `artifact_service` 互動。
        *   可直接存取 `user_content`。

    === "Python"
    
        ```python
        # Pseudocode: Callback receiving CallbackContext
        from google.adk.agents.callback_context import CallbackContext
        from google.adk.models import LlmRequest
        from google.genai import types
        from typing import Optional
    
        def my_before_model_cb(callback_context: CallbackContext, request: LlmRequest) -> Optional[types.Content]:
            # Read/Write state example
            call_count = callback_context.state.get("model_calls", 0)
            callback_context.state["model_calls"] = call_count + 1 # Modify state
    
            # Optionally load an artifact
            # config_part = callback_context.load_artifact("model_config.json")
            print(f"Preparing model call #{call_count + 1} for invocation {callback_context.invocation_id}")
            return None # Allow model call to proceed
        ```
    
請提供原文、初始譯文、品質分析和改進建議，我才能協助改進翻譯。    
    === "Java"
    
        ```java
        // Pseudocode: Callback receiving CallbackContext
        import com.google.adk.agents.CallbackContext;
        import com.google.adk.models.LlmRequest;
        import com.google.genai.types.Content;
        import java.util.Optional;
    
        public Maybe<LlmResponse> myBeforeModelCb(CallbackContext callbackContext, LlmRequest request){
            // Read/Write state example
            callCount = callbackContext.state().get("model_calls", 0)
            callbackContext.state().put("model_calls") = callCount + 1 # Modify state
    
            // Optionally load an artifact
            // Maybe<Part> configPart = callbackContext.loadArtifact("model_config.json");
            System.out.println("Preparing model call " + callCount + 1);
            return Maybe.empty(); // Allow model call to proceed
        }
        ```

4.  **`ToolContext`**
    *   **使用場景：**作為 `tool_context` 傳遞給支援 `FunctionTool` 的函式，以及工具執行回呼（`before_tool_callback`、`after_tool_callback`）。
    *   **目的：**提供與 `CallbackContext` 相同的功能，並額外包含工具執行所需的專用方法，例如處理驗證、記憶體搜尋以及清單化 artifacts（成果物）。
    *   **主要能力（相較於 `CallbackContext` 的新增功能）：**
        *   **驗證方法：**`request_credential(auth_config)` 用於觸發驗證流程，以及 `get_auth_response(auth_config)` 用於取得使用者／系統所提供的認證資訊。
        *   **Artifact 清單：**`list_artifacts()` 用於發現目前 session 可用的 artifacts。
        *   **記憶體搜尋：**`search_memory(query)` 用於查詢已設定的 `memory_service`。
        *   **`function_call_id` 屬性：**標識觸發本次工具執行的大型語言模型 (LLM) 的特定 function call，對於正確關聯驗證請求或回應至關重要。
        *   **`actions` 屬性：**可直接存取本步驟的 `EventActions` 物件，使工具能夠發出狀態變更、驗證請求等訊號。

    === "Python"
    
        ```python
        # Pseudocode: Tool function receiving ToolContext
        from google.adk.tools import ToolContext
        from typing import Dict, Any
    
        # Assume this function is wrapped by a FunctionTool
        def search_external_api(query: str, tool_context: ToolContext) -> Dict[str, Any]:
            api_key = tool_context.state.get("api_key")
            if not api_key:
                # Define required auth config
                # auth_config = AuthConfig(...)
                # tool_context.request_credential(auth_config) # Request credentials
                # Use the 'actions' property to signal the auth request has been made
                # tool_context.actions.requested_auth_configs[tool_context.function_call_id] = auth_config
                return {"status": "Auth Required"}
    
            # Use the API key...
            print(f"Tool executing for query '{query}' using API key. Invocation: {tool_context.invocation_id}")
    
            # Optionally search memory or list artifacts
            # relevant_docs = tool_context.search_memory(f"info related to {query}")
            # available_files = tool_context.list_artifacts()
    
            return {"result": f"Data for {query} fetched."}
        ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    === "Java"
    
        ```java
        // Pseudocode: Tool function receiving ToolContext
        import com.google.adk.tools.ToolContext;
        import java.util.HashMap;
        import java.util.Map;
    
        // Assume this function is wrapped by a FunctionTool
        public Map<String, Object> searchExternalApi(String query, ToolContext toolContext){
            String apiKey = toolContext.state.get("api_key");
            if(apiKey.isEmpty()){
                // Define required auth config
                // authConfig = AuthConfig(...);
                // toolContext.requestCredential(authConfig); # Request credentials
                // Use the 'actions' property to signal the auth request has been made
                ...
                return Map.of("status", "Auth Required");
    
            // Use the API key...
            System.out.println("Tool executing for query " + query + " using API key. ");
    
            // Optionally list artifacts
            // Single<List<String>> availableFiles = toolContext.listArtifacts();
    
            return Map.of("result", "Data for " + query + " fetched");
        }
        ```

理解這些不同的 context 物件以及何時使用它們，是有效管理狀態、存取服務，以及控制 Agent Development Kit (ADK) 應用程式流程的關鍵。下一節將詳細說明你可以利用這些 context 執行的常見任務。


## 使用 Context 的常見任務

現在你已經了解不同的 context 物件，接下來我們將聚焦於如何在建立你的代理（agent）與工具（tools）時，運用這些 context 來完成常見任務。

### 存取資訊

你經常需要讀取儲存在 context 內的資訊。

*   **讀取 Session 狀態：** 存取在先前步驟或使用者／應用層級設定中儲存的資料。可透過對 `state` 屬性進行類似字典的存取方式來取得。

    === "Python"
    
        ```python
        # Pseudocode: In a Tool function
        from google.adk.tools import ToolContext
    
        def my_tool(tool_context: ToolContext, **kwargs):
            user_pref = tool_context.state.get("user_display_preference", "default_mode")
            api_endpoint = tool_context.state.get("app:api_endpoint") # Read app-level state
    
            if user_pref == "dark_mode":
                # ... apply dark mode logic ...
                pass
            print(f"Using API endpoint: {api_endpoint}")
            # ... rest of tool logic ...
    
        # Pseudocode: In a Callback function
        from google.adk.agents.callback_context import CallbackContext
    
        def my_callback(callback_context: CallbackContext, **kwargs):
            last_tool_result = callback_context.state.get("temp:last_api_result") # Read temporary state
            if last_tool_result:
                print(f"Found temporary result from last tool: {last_tool_result}")
            # ... callback logic ...
        ```
    
    === "Java"
    
        ```java
        // Pseudocode: In a Tool function
        import com.google.adk.tools.ToolContext;
    
        public void myTool(ToolContext toolContext){
           String userPref = toolContext.state().get("user_display_preference");
           String apiEndpoint = toolContext.state().get("app:api_endpoint"); // Read app-level state
           if(userPref.equals("dark_mode")){
                // ... apply dark mode logic ...
                pass
            }
           System.out.println("Using API endpoint: " + api_endpoint);
           // ... rest of tool logic ...
        }
    
    
        // Pseudocode: In a Callback function
        import com.google.adk.agents.CallbackContext;
    
            public void myCallback(CallbackContext callbackContext){
                String lastToolResult = (String) callbackContext.state().get("temp:last_api_result"); // Read temporary state
            }
            if(!(lastToolResult.isEmpty())){
                System.out.println("Found temporary result from last tool: " + lastToolResult);
            }
            // ... callback logic ...
        ```

*   **取得當前識別碼：** 適用於根據目前操作進行日誌記錄或自訂邏輯。

    === "Python"
    
        ```python
        # Pseudocode: In any context (ToolContext shown)
        from google.adk.tools import ToolContext
    
        def log_tool_usage(tool_context: ToolContext, **kwargs):
            agent_name = tool_context.agent_nameSystem.out.println("Found temporary result from last tool: " + lastToolResult);
            inv_id = tool_context.invocation_id
            func_call_id = getattr(tool_context, 'function_call_id', 'N/A') # Specific to ToolContext
    
            print(f"Log: Invocation={inv_id}, Agent={agent_name}, FunctionCallID={func_call_id} - Tool Executed.")
        ```
    
    === "Java"
    
        ```java
        // Pseudocode: In any context (ToolContext shown)
         import com.google.adk.tools.ToolContext;
    
         public void logToolUsage(ToolContext toolContext){
                    String agentName = toolContext.agentName;
                    String invId = toolContext.invocationId;
                    String functionCallId = toolContext.functionCallId().get(); // Specific to ToolContext
                    System.out.println("Log: Invocation= " + invId &+ " Agent= " + agentName);
                }
        ```

*   **存取初始使用者輸入：** 回溯至啟動本次呼叫的訊息。

    === "Python"
    
        ```python
        # Pseudocode: In a Callback
        from google.adk.agents.callback_context import CallbackContext
    
        def check_initial_intent(callback_context: CallbackContext, **kwargs):
            initial_text = "N/A"
            if callback_context.user_content and callback_context.user_content.parts:
                initial_text = callback_context.user_content.parts[0].text or "Non-text input"
    
            print(f"This invocation started with user input: '{initial_text}'")
    
        # Pseudocode: In an Agent's _run_async_impl
        # async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        #     if ctx.user_content and ctx.user_content.parts:
        #         initial_text = ctx.user_content.parts[0].text
        #         print(f"Agent logic remembering initial query: {initial_text}")
        #     ...
        ```
    
    === "Java"
    
        ```java
        // Pseudocode: In a Callback
        import com.google.adk.agents.CallbackContext;
    
        public void checkInitialIntent(CallbackContext callbackContext){
            String initialText = "N/A";
            if((!(callbackContext.userContent().isEmpty())) && (!(callbackContext.userContent().parts.isEmpty()))){
                initialText = cbx.userContent().get().parts().get().get(0).text().get();
                ...
                System.out.println("This invocation started with user input: " + initialText)
            }
        }
        ```
    
### 狀態管理

狀態對於記憶與資料流動至關重要。當你使用 `CallbackContext` 或 `ToolContext` 修改狀態時，這些變更會自動由框架追蹤並持久化。

*   **運作方式：** 將資料寫入 `callback_context.state['my_key'] = my_value` 或 `tool_context.state['my_key'] = my_value` 時，會將這個變更加入與當前步驟事件關聯的 `EventActions.state_delta`。`SessionService` 在持久化事件時，會套用這些差異（delta）。

*  **在工具間傳遞資料**

    === "Python"

        ```python
        # Pseudocode: Tool 1 - Fetches user ID
        from google.adk.tools import ToolContext
        import uuid
    
        def get_user_profile(tool_context: ToolContext) -> dict:
            user_id = str(uuid.uuid4()) # Simulate fetching ID
            # Save the ID to state for the next tool
            tool_context.state["temp:current_user_id"] = user_id
            return {"profile_status": "ID generated"}
    
        # Pseudocode: Tool 2 - Uses user ID from state
        def get_user_orders(tool_context: ToolContext) -> dict:
            user_id = tool_context.state.get("temp:current_user_id")
            if not user_id:
                return {"error": "User ID not found in state"}
    
            print(f"Fetching orders for user ID: {user_id}")
            # ... logic to fetch orders using user_id ...
            return {"orders": ["order123", "order456"]}
        ```

    === "Java"

        ```java
        // Pseudocode: Tool 1 - Fetches user ID
        import com.google.adk.tools.ToolContext;
        import java.util.UUID;
    
        public Map<String, String> getUserProfile(ToolContext toolContext){
            String userId = UUID.randomUUID().toString();
            // Save the ID to state for the next tool
            toolContext.state().put("temp:current_user_id", user_id);
            return Map.of("profile_status", "ID generated");
        }
    
        // Pseudocode: Tool 2 - Uses user ID from state
        public  Map<String, String> getUserOrders(ToolContext toolContext){
            String userId = toolContext.state().get("temp:current_user_id");
            if(userId.isEmpty()){
                return Map.of("error", "User ID not found in state");
            }
            System.out.println("Fetching orders for user id: " + userId);
             // ... logic to fetch orders using user_id ...
            return Map.of("orders", "order123");
        }
        ```

*   **更新使用者偏好設定：**

    === "Python"
    
        ```python
        # Pseudocode: Tool or Callback identifies a preference
        from google.adk.tools import ToolContext # Or CallbackContext
    
        def set_user_preference(tool_context: ToolContext, preference: str, value: str) -> dict:
            # Use 'user:' prefix for user-level state (if using a persistent SessionService)
            state_key = f"user:{preference}"
            tool_context.state[state_key] = value
            print(f"Set user preference '{preference}' to '{value}'")
            return {"status": "Preference updated"}
        ```
    
    === "Java"
    
        ```java
        // Pseudocode: Tool or Callback identifies a preference
        import com.google.adk.tools.ToolContext; // Or CallbackContext
    
        public Map<String, String> setUserPreference(ToolContext toolContext, String preference, String value){
            // Use 'user:' prefix for user-level state (if using a persistent SessionService)
            String stateKey = "user:" + preference;
            toolContext.state().put(stateKey, value);
            System.out.println("Set user preference '" + preference + "' to '" + value + "'");
            return Map.of("status", "Preference updated");
        }
        ```

*   **狀態前綴（State Prefixes）：** 雖然基本狀態是以工作階段（session）為單位，但像是 `app:` 和 `user:` 這類前綴可搭配具備持久性（persistent）的 `SessionService` 實作（例如 `DatabaseSessionService` 或 `VertexAiSessionService`）來表示更廣泛的範圍（如應用程式層級或使用者跨工作階段的範圍）。`temp:` 則可用來標示僅在本次呼叫（invocation）內相關的資料。

### 使用 Artifact（產物）

使用 artifact 來處理與工作階段相關的檔案或大型資料區塊。常見用途：處理上傳的文件。

*   **文件摘要器（Document Summarizer）範例流程：**

    1.  **擷取參考資料（例如在 Setup Tool 或 Callback 中）：** 將文件的 *路徑或 URI* 作為 artifact 儲存，而非將整個內容存入。

        === "Python"
    
               ```python
               # Pseudocode: In a callback or initial tool
               from google.adk.agents.callback_context import CallbackContext # Or ToolContext
               from google.genai import types
                
               def save_document_reference(context: CallbackContext, file_path: str) -> None:
                   # Assume file_path is something like "gs://my-bucket/docs/report.pdf" or "/local/path/to/report.pdf"
                   try:
                       # Create a Part containing the path/URI text
                       artifact_part = types.Part(text=file_path)
                       version = context.save_artifact("document_to_summarize.txt", artifact_part)
                       print(f"Saved document reference '{file_path}' as artifact version {version}")
                       # Store the filename in state if needed by other tools
                       context.state["temp:doc_artifact_name"] = "document_to_summarize.txt"
                   except ValueError as e:
                       print(f"Error saving artifact: {e}") # E.g., Artifact service not configured
                   except Exception as e:
                       print(f"Unexpected error saving artifact reference: {e}")
                
               # Example usage:
               # save_document_reference(callback_context, "gs://my-bucket/docs/report.pdf")
               ```
    
        === "Java"
    
               ```java
               // Pseudocode: In a callback or initial tool
               import com.google.adk.agents.CallbackContext;
               import com.google.genai.types.Content;
               import com.google.genai.types.Part;
                
                
               pubic void saveDocumentReference(CallbackContext context, String filePath){
                   // Assume file_path is something like "gs://my-bucket/docs/report.pdf" or "/local/path/to/report.pdf"
                   try{
                       // Create a Part containing the path/URI text
                       Part artifactPart = types.Part(filePath)
                       Optional<Integer> version = context.saveArtifact("document_to_summarize.txt", artifactPart)
                       System.out.println("Saved document reference" + filePath + " as artifact version " + version);
                       // Store the filename in state if needed by other tools
                       context.state().put("temp:doc_artifact_name", "document_to_summarize.txt");
                   } catch(Exception e){
                       System.out.println("Unexpected error saving artifact reference: " + e);
                   }
               }
                    
               // Example usage:
               // saveDocumentReference(context, "gs://my-bucket/docs/report.pdf")
               ```

    2.  **摘要工具（Summarizer Tool）：** 載入 artifact 以取得路徑/URI，使用適當的函式庫讀取實際文件內容，進行摘要，並回傳結果。

        === "Python"

            ```python
            # Pseudocode: In the Summarizer tool function
            from google.adk.tools import ToolContext
            from google.genai import types
            # Assume libraries like google.cloud.storage or built-in open are available
            # Assume a 'summarize_text' function exists
            # from my_summarizer_lib import summarize_text

            def summarize_document_tool(tool_context: ToolContext) -> dict:
                artifact_name = tool_context.state.get("temp:doc_artifact_name")
                if not artifact_name:
                    return {"error": "Document artifact name not found in state."}

                try:
                    # 1. Load the artifact part containing the path/URI
                    artifact_part = tool_context.load_artifact(artifact_name)
                    if not artifact_part or not artifact_part.text:
                        return {"error": f"Could not load artifact or artifact has no text path: {artifact_name}"}

                    file_path = artifact_part.text
                    print(f"Loaded document reference: {file_path}")

                    # 2. Read the actual document content (outside ADK context)
                    document_content = ""
                    if file_path.startswith("gs://"):
                        # Example: Use GCS client library to download/read
                        # from google.cloud import storage
                        # client = storage.Client()
                        # blob = storage.Blob.from_string(file_path, client=client)
                        # document_content = blob.download_as_text() # Or bytes depending on format
                        pass # Replace with actual GCS reading logic
                    elif file_path.startswith("/"):
                         # Example: Use local file system
                         with open(file_path, 'r', encoding='utf-8') as f:
                             document_content = f.read()
                    else:
                        return {"error": f"Unsupported file path scheme: {file_path}"}

                    # 3. Summarize the content
                    if not document_content:
                         return {"error": "Failed to read document content."}

                    # summary = summarize_text(document_content) # Call your summarization logic
                    summary = f"Summary of content from {file_path}" # Placeholder

                    return {"summary": summary}

                except ValueError as e:
                     return {"error": f"Artifact service error: {e}"}
                except FileNotFoundError:
                     return {"error": f"Local file not found: {file_path}"}
                # except Exception as e: # Catch specific exceptions for GCS etc.
                #      return {"error": f"Error reading document {file_path}: {e}"}
            ```

        === "Java"

            ```java
            // Pseudocode: In the Summarizer tool function
            import com.google.adk.tools.ToolContext;
            import com.google.genai.types.Content;
            import com.google.genai.types.Part;

            public Map<String, String> summarizeDocumentTool(ToolContext toolContext){
                String artifactName = toolContext.state().get("temp:doc_artifact_name");
                if(artifactName.isEmpty()){
                    return Map.of("error", "Document artifact name not found in state.");
                }
                try{
                    // 1. Load the artifact part containing the path/URI
                    Maybe<Part> artifactPart = toolContext.loadArtifact(artifactName);
                    if((artifactPart == null) || (artifactPart.text().isEmpty())){
                        return Map.of("error", "Could not load artifact or artifact has no text path: " + artifactName);
                    }
                    filePath = artifactPart.text();
                    System.out.println("Loaded document reference: " + filePath);

                    // 2. Read the actual document content (outside ADK context)
                    String documentContent = "";
                    if(filePath.startsWith("gs://")){
                        // Example: Use GCS client library to download/read into documentContent
                        pass; // Replace with actual GCS reading logic
                    } else if(){
                        // Example: Use local file system to download/read into documentContent
                    } else{
                        return Map.of("error", "Unsupported file path scheme: " + filePath); 
                    }

                    // 3. Summarize the content
                    if(documentContent.isEmpty()){
                        return Map.of("error", "Failed to read document content."); 
                    }

                    // summary = summarizeText(documentContent) // Call your summarization logic
                    summary = "Summary of content from " + filePath; // Placeholder

                    return Map.of("summary", summary);
                } catch(IllegalArgumentException e){
                    return Map.of("error", "Artifact service error " + filePath + e);
                } catch(FileNotFoundException e){
                    return Map.of("error", "Local file not found " + filePath + e);
                } catch(Exception e){
                    return Map.of("error", "Error reading document " + filePath + e);
                }
            }
            ```
    
*   **列出產物（Artifacts）：** 探索有哪些檔案可用。
    
    === "Python"
        
        ```python
        # Pseudocode: In a tool function
        from google.adk.tools import ToolContext
        
        def check_available_docs(tool_context: ToolContext) -> dict:
            try:
                artifact_keys = tool_context.list_artifacts()
                print(f"Available artifacts: {artifact_keys}")
                return {"available_docs": artifact_keys}
            except ValueError as e:
                return {"error": f"Artifact service error: {e}"}
        ```
        
    === "Java"
        
        ```java
        // Pseudocode: In a tool function
        import com.google.adk.tools.ToolContext;
        
        public Map<String, String> checkAvailableDocs(ToolContext toolContext){
            try{
                Single<List<String>> artifactKeys = toolContext.listArtifacts();
                System.out.println("Available artifacts" + artifactKeys.tostring());
                return Map.of("availableDocs", "artifactKeys");
            } catch(IllegalArgumentException e){
                return Map.of("error", "Artifact service error: " + e);
            }
        }
        ```

### 處理工具驗證

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出/即將推出。"}

安全地管理工具所需的 API 金鑰或其他憑證。

```python
# Pseudocode: Tool requiring auth
from google.adk.tools import ToolContext
from google.adk.auth import AuthConfig # Assume appropriate AuthConfig is defined

# Define your required auth configuration (e.g., OAuth, API Key)
MY_API_AUTH_CONFIG = AuthConfig(...)
AUTH_STATE_KEY = "user:my_api_credential" # Key to store retrieved credential

def call_secure_api(tool_context: ToolContext, request_data: str) -> dict:
    # 1. Check if credential already exists in state
    credential = tool_context.state.get(AUTH_STATE_KEY)

    if not credential:
        # 2. If not, request it
        print("Credential not found, requesting...")
        try:
            tool_context.request_credential(MY_API_AUTH_CONFIG)
            # The framework handles yielding the event. The tool execution stops here for this turn.
            return {"status": "Authentication required. Please provide credentials."}
        except ValueError as e:
            return {"error": f"Auth error: {e}"} # e.g., function_call_id missing
        except Exception as e:
            return {"error": f"Failed to request credential: {e}"}

    # 3. If credential exists (might be from a previous turn after request)
    #    or if this is a subsequent call after auth flow completed externally
    try:
        # Optionally, re-validate/retrieve if needed, or use directly
        # This might retrieve the credential if the external flow just completed
        auth_credential_obj = tool_context.get_auth_response(MY_API_AUTH_CONFIG)
        api_key = auth_credential_obj.api_key # Or access_token, etc.

        # Store it back in state for future calls within the session
        tool_context.state[AUTH_STATE_KEY] = auth_credential_obj.model_dump() # Persist retrieved credential

        print(f"Using retrieved credential to call API with data: {request_data}")
        # ... Make the actual API call using api_key ...
        api_result = f"API result for {request_data}"

        return {"result": api_result}
    except Exception as e:
        # Handle errors retrieving/using the credential
        print(f"Error using credential: {e}")
        # Maybe clear the state key if credential is invalid?
        # tool_context.state[AUTH_STATE_KEY] = None
        return {"error": "Failed to use credential"}

```
*請記住：`request_credential` 會暫停工具並提示需要進行驗證。使用者或系統需提供認證資訊，隨後再次呼叫時，`get_auth_response`（或再次檢查狀態）即可讓工具繼續執行。* `tool_context.function_call_id` 由框架隱式使用，用於連結請求與回應。

### 善用記憶體（Memory）

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出／即將上線。"}

從過去或外部來源存取相關資訊。

```python
# Pseudocode: Tool using memory search
from google.adk.tools import ToolContext

def find_related_info(tool_context: ToolContext, topic: str) -> dict:
    try:
        search_results = tool_context.search_memory(f"Information about {topic}")
        if search_results.results:
            print(f"Found {len(search_results.results)} memory results for '{topic}'")
            # Process search_results.results (which are SearchMemoryResponseEntry)
            top_result_text = search_results.results[0].text
            return {"memory_snippet": top_result_text}
        else:
            return {"message": "No relevant memories found."}
    except ValueError as e:
        return {"error": f"Memory service error: {e}"} # e.g., Service not configured
    except Exception as e:
        return {"error": f"Unexpected error searching memory: {e}"}
```

### 進階：直接使用 `InvocationContext`

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將上線。"}

雖然大多數互動是透過 `CallbackContext` 或 `ToolContext` 進行，但有時 agent 的核心邏輯（`_run_async_impl`/`_run_live_impl`）需要直接存取。

```python
# Pseudocode: Inside agent's _run_async_impl
from google.adk.agents import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event
from typing import AsyncGenerator

class MyControllingAgent(BaseAgent):
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        # Example: Check if a specific service is available
        if not ctx.memory_service:
            print("Memory service is not available for this invocation.")
            # Potentially change agent behavior

        # Example: Early termination based on some condition
        if ctx.session.state.get("critical_error_flag"):
            print("Critical error detected, ending invocation.")
            ctx.end_invocation = True # Signal framework to stop processing
            yield Event(author=self.name, invocation_id=ctx.invocation_id, content="Stopping due to critical error.")
            return # Stop this agent's execution

        # ... Normal agent processing ...
        yield # ... event ...
```

設定 `ctx.end_invocation = True` 是一種讓 agent 或其 callback／工具（透過各自的 context 物件，也能存取並修改底層 `InvocationContext` 的旗標）從內部優雅地終止整個請求－回應流程的方法。

## 重要重點與最佳實踐

*   **選用正確的 Context：** 請務必使用所提供的最具體 context 物件（在 tools／tool-callbacks 中使用 `ToolContext`，在 agent／model-callbacks 中使用 `CallbackContext`，在適用時使用 `ReadonlyContext`）。僅在必要時，於 `_run_async_impl`／`_run_live_impl` 中直接使用完整的 `InvocationContext`（`ctx`）。
*   **State 用於資料流通：** `context.state` 是在一次呼叫中分享資料、記憶偏好設定，以及管理對話記憶的主要方式。當使用持久性儲存時，請善用前綴（`app:`、`user:`、`temp:`）。
*   **Artifacts 用於檔案管理：** 使用 `context.save_artifact` 與 `context.load_artifact` 來管理檔案參考（如路徑或 URI）或較大的資料區塊。僅儲存參考，按需載入內容。
*   **變更追蹤：** 透過 context 方法對 state 或 artifacts 的修改，會自動與目前步驟的 `EventActions` 連結，並由 `SessionService` 處理。
*   **從簡單開始：** 請先專注於 `state` 及基本 artifact 的使用。當需求變複雜時，再深入探索驗證、記憶體，以及進階 `InvocationContext` 欄位（如即時串流相關欄位）。

透過理解並有效運用這些 context 物件，您可以利用 Agent Development Kit (ADK)（ADK）建立更進階、有狀態且更強大的 agent。
