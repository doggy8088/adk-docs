# State：Session 的暫存區

在每個 `Session`（即我們的對話執行緒）中，**`state`** 屬性就像是 agent 專屬於該次互動的暫存區。`session.events` 儲存完整的歷史紀錄，而 `session.state` 則是 agent 在對話過程中儲存與更新動態細節的地方。

## 什麼是 `session.state`？

從概念上來說，`session.state` 是一個集合（dictionary 或 Map），用來存放鍵值對。它專為 agent 需要記住或追蹤的資訊設計，以提升當前對話的效率：

* **個人化互動：** 記住使用者先前提到的偏好（例如：`'user_preference_theme': 'dark'`）。
* **追蹤任務進度：** 追蹤多輪流程中的步驟（例如：`'booking_step': 'confirm_payment'`）。
* **累積資訊：** 建立清單或摘要（例如：`'shopping_cart_items': ['book', 'pen']`）。
* **做出明智決策：** 儲存影響下個回應的旗標或數值（例如：`'user_is_authenticated': True`）。

### `State` 的主要特性

1. **結構：可序列化的鍵值對**

    * 資料以 `key: value` 形式儲存。
    * **鍵（Keys）：** 一律為字串（`str`）。建議使用清楚易懂的名稱（例如：`'departure_city'`、`'user:language_preference'`）。
    * **值（Values）：** 必須是**可序列化（serializable）**的。也就是說，這些值可以被 `SessionService` 輕鬆儲存與載入。請僅使用特定語言（Python/Java）中的基本型別，如字串、數字、布林值，以及僅包含這些基本型別的簡單 list 或 dictionary。（詳細資訊請參考 API 文件說明）
    * **⚠️ 避免複雜物件：** **請勿直接在 state 中儲存不可序列化的物件**（自訂類別實例、函式、連線等）。如有需要，請僅儲存簡單的識別碼，並在其他地方取得複雜物件。

2. **可變性：內容會變動**

    * `state` 的內容會隨著對話進行而變化。

3. **持久性：取決於 `SessionService`**

    * state 是否能在應用程式重啟後保留，取決於你選用的服務：
      * `InMemorySessionService`：**不具持久性。** 重啟後 state 會遺失。
      * `DatabaseSessionService` / `VertexAiSessionService`：**具持久性。** state 會被可靠地儲存。

!!! Note
    具體的原語（primitives）參數或方法名稱會依不同 SDK 語言略有差異（例如：Python 中的 `session.state['current_intent'] = 'book_flight'`，Java 中的 `session.state().put("current_intent", "book_flight)`）。詳細資訊請參閱各語言的 API 文件說明。

### 使用前綴組織狀態：範圍很重要

狀態鍵（state key）上的前綴會定義其範圍與持久化行為，這在使用持久化服務時尤其重要：

* **無前綴（Session State）：**

    * **範圍（Scope）：** 只針對*目前*的 session（`id`）。
    * **持久化（Persistence）：** 僅當 `SessionService` 為持久化（`Database`、`VertexAI`）時才會保存。
    * **使用情境（Use Cases）：** 追蹤當前任務進度（例如：`'current_booking_step'`）、此次互動的臨時旗標（例如：`'needs_clarification'`）。
    * **範例（Example）：** `session.state['current_intent'] = 'book_flight'`

* **`user:` 前綴（User State）：**

    * **範圍（Scope）：** 綁定於 `user_id`，並在該使用者於同一 `app_name` 下的*所有* session 中共用。
    * **持久化（Persistence）：** 透過 `Database` 或 `VertexAI` 持久化。（由 `InMemory` 儲存，但重啟後會遺失）
    * **使用情境（Use Cases）：** 使用者偏好設定（例如：`'user:theme'`）、個人資料細節（例如：`'user:name'`）。
    * **範例（Example）：** `session.state['user:preferred_language'] = 'fr'`

* **`app:` 前綴（App State）：**

    * **範圍（Scope）：** 綁定於 `app_name`，並在該應用程式的*所有*使用者與 session 間共用。
    * **持久化（Persistence）：** 透過 `Database` 或 `VertexAI` 持久化。（由 `InMemory` 儲存，但重啟後會遺失）
    * **使用情境（Use Cases）：** 全域設定（例如：`'app:api_endpoint'`）、共用範本。
    * **範例（Example）：** `session.state['app:global_discount_code'] = 'SAVE10'`

* **`temp:` 前綴（Temporary Invocation State）：**

    * **範圍（Scope）：** 僅限於目前**invocation**（從 agent 接收使用者輸入到為該輸入產生最終輸出的整個過程）。
    * **持久化（Persistence）：** **不會持久化。** invocation 結束後即會丟棄，不會延續到下一次。
    * **使用情境（Use Cases）：** 在單次 invocation 內儲存中間運算結果、旗標或在工具呼叫（tool calls）間傳遞的資料。
    * **不建議使用時機（When Not to Use）：** 需要跨多次 invocation 保留的資訊，例如使用者偏好、對話歷史摘要或累積資料。
    * **範例（Example）：** `session.state['temp:raw_api_response'] = {...}`

!!! note "Sub-Agents and Invocation Context"
    當父 agent 呼叫子 agent（例如，使用 `SequentialAgent` 或 `ParallelAgent`）時，會將其 `InvocationContext` 傳遞給子 agent。這表示整個 agent 呼叫鏈會共用相同的 invocation ID，因此也共用相同的 `temp:` session state。

**Agent 端的視角：** 你的 agent 程式碼會透過單一的 `session.state` 集合（dict/Map）與*合併後*的 state 互動。`SessionService` 會根據前綴自動從正確的底層儲存空間擷取/合併 state。

### 在 Agent 指令中存取 Session State

當你使用 `LlmAgent` 實例時，可以直接透過簡單的樣板語法，將 session state 的值注入到 agent 的指令字串中。這讓你能夠建立動態且具備情境感知的指令，而不必僅依賴自然語言指示。

#### 使用 `{key}` 樣板語法

若要從 session state 注入變數值，只需將欲取得的 state 變數 key 包在大括號內：`{key}`。框架會在將指令傳遞給大型語言模型 (LLM) 前，自動以 `session.state` 中對應的值取代這個佔位符。

**範例：**

```python
from google.adk.agents import LlmAgent

story_generator = LlmAgent(
    name="StoryGenerator",
    model="gemini-2.0-flash",
    instruction="""Write a short story about a cat, focusing on the theme: {topic}."""
)

# Assuming session.state['topic'] is set to "friendship", the LLM 
# will receive the following instruction:
# "Write a short story about a cat, focusing on the theme: friendship."
```

#### 重要注意事項

* 鍵值存在性：請確保你在指令字串中引用的鍵值已存在於 session.state 中。如果該鍵值不存在，agent 會拋出錯誤。若你想使用一個可能存在也可能不存在的鍵值，可以在鍵值後面加上一個問號（?），例如 `{topic?}`。
* 資料型別：與鍵值關聯的值應該是字串，或是可以輕鬆轉換為字串的型別。
* 跳脫字元：如果你需要在指令中使用字面上的大括號（例如用於 JSON 格式化），則需要進行跳脫處理。

#### 使用 `InstructionProvider` 跳過 state 注入

在某些情境下，你可能希望在指令中直接使用 `{{` 和 `}}`，而不觸發 state 注入機制。例如，你可能正在為一個使用相同語法的模板語言設計 agent 指令。

為達到此目的，你可以將 `instruction` 參數設為一個函式，而非字串。這個函式稱為 `InstructionProvider`。當你使用 `InstructionProvider` 時，Agent Development Kit (ADK) 不會嘗試注入 state，且你的指令字串會原封不動地傳遞給模型。

`InstructionProvider` 函式會接收一個 `ReadonlyContext` 物件，你可以利用該物件存取 session state 或其他情境資訊，以動態產生指令內容。

=== "Python"

    ```python
    from google.adk.agents import LlmAgent
    from google.adk.agents.readonly_context import ReadonlyContext

    # This is an InstructionProvider
    def my_instruction_provider(context: ReadonlyContext) -> str:
        # You can optionally use the context to build the instruction
        # For this example, we'll return a static string with literal braces.
        return "This is an instruction with {{literal_braces}} that will not be replaced."

    agent = LlmAgent(
        model="gemini-2.0-flash",
        name="template_helper_agent",
        instruction=my_instruction_provider
    )
    ```

如果你想同時使用`InstructionProvider` *並且*將 session state 注入到你的指令中，可以使用`inject_session_state` 輔助函式。

=== "Python"

    ```python
    from google.adk.agents import LlmAgent
    from google.adk.agents.readonly_context import ReadonlyContext
    from google.adk.utils import instructions_utils

    async def my_dynamic_instruction_provider(context: ReadonlyContext) -> str:
        template = "This is a {adjective} instruction with {{literal_braces}}."
        # This will inject the 'adjective' state variable but leave the literal braces.
        return await instructions_utils.inject_session_state(template, context)

    agent = LlmAgent(
        model="gemini-2.0-flash",
        name="dynamic_template_helper_agent",
        instruction=my_dynamic_instruction_provider
    )
    ```

**直接注入 (Direct Injection) 的優點**

* 清晰性：明確指出指令中哪些部分是動態的，並且基於 session state。
* 可靠性：避免依賴大型語言模型 (LLM) 正確解讀自然語言指令以存取 state。
* 維護性：簡化指令字串，並在更新 state 變數名稱時降低錯誤風險。

**與其他 state 存取方法的關係**

此直接注入方法僅適用於 LlmAgent 指令。關於其他 state 存取方法，請參考下方章節以獲得更多資訊。

### State 如何被更新：建議的方法

!!! note "The Right Way to Modify State"
    當你需要變更 session state 時，**正確且最安全的方法是直接修改提供給你函式（例如 `callback_context.state['my_key'] = 'new_value'`）的 `Context` 上的 `state` 物件**。這被認為是「正確的直接狀態操作」，因為框架會自動追蹤這些變更。

    這點與你直接修改從 `SessionService`（例如 `my_session.state['my_key'] = 'new_value'`）取得的 `Session` 物件上的 `state` 有根本上的不同。**你應該避免這麼做**，因為這會繞過 Agent Development Kit (ADK) 的事件追蹤機制，可能導致資料遺失。關於這個重要差異，請參閱本頁結尾的「警告」章節以取得更多細節。

session state 應該**永遠**在使用 `session_service.append_event()` 將 `Event` 新增到 session 歷史紀錄時一併更新。這樣才能確保變更被正確追蹤、資料持久化運作正常，並且更新具備執行緒安全性。

**1\. 最簡單的方法：`output_key`（適用於 agent 文字回應）**

這是將 agent 最終文字回應直接儲存到 state 中最簡單的方法。當你定義 `LlmAgent` 時，請指定 `output_key`：

=== "Python"

    ```py
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService, Session
    from google.adk.runners import Runner
    from google.genai.types import Content, Part

    # Define agent with output_key
    greeting_agent = LlmAgent(
        name="Greeter",
        model="gemini-2.0-flash", # Use a valid model
        instruction="Generate a short, friendly greeting.",
        output_key="last_greeting" # Save response to state['last_greeting']
    )

    # --- Setup Runner and Session ---
    app_name, user_id, session_id = "state_app", "user1", "session1"
    session_service = InMemorySessionService()
    runner = Runner(
        agent=greeting_agent,
        app_name=app_name,
        session_service=session_service
    )
    session = await session_service.create_session(app_name=app_name,
                                        user_id=user_id,
                                        session_id=session_id)
    print(f"Initial state: {session.state}")

    # --- Run the Agent ---
    # Runner handles calling append_event, which uses the output_key
    # to automatically create the state_delta.
    user_message = Content(parts=[Part(text="Hello")])
    for event in runner.run(user_id=user_id,
                            session_id=session_id,
                            new_message=user_message):
        if event.is_final_response():
          print(f"Agent responded.") # Response text is also in event.content

    # --- Check Updated State ---
    updated_session = await session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=session_id)
    print(f"State after agent run: {updated_session.state}")
    # Expected output might include: {'last_greeting': 'Hello there! How can I help you today?'}
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/state/GreetingAgentExample.java:full_code"
    ```

在幕後，`Runner` 會使用 `output_key` 來建立所需的 `EventActions`，並搭配 `state_delta`，然後呼叫 `append_event`。

**2\. 標準方式：`EventActions.state_delta`（用於複雜更新）**

針對較為複雜的情境（如同時更新多個鍵、非字串值、特定範圍如 `user:` 或 `app:`，或是與 agent 最終回應文字無直接關聯的更新），你可以在 `EventActions` 中手動建立 `state_delta`。

=== "Python"

    ```py
    from google.adk.sessions import InMemorySessionService, Session
    from google.adk.events import Event, EventActions
    from google.genai.types import Part, Content
    import time

    # --- Setup ---
    session_service = InMemorySessionService()
    app_name, user_id, session_id = "state_app_manual", "user2", "session2"
    session = await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state={"user:login_count": 0, "task_status": "idle"}
    )
    print(f"Initial state: {session.state}")

    # --- Define State Changes ---
    current_time = time.time()
    state_changes = {
        "task_status": "active",              # Update session state
        "user:login_count": session.state.get("user:login_count", 0) + 1, # Update user state
        "user:last_login_ts": current_time,   # Add user state
        "temp:validation_needed": True        # Add temporary state (will be discarded)
    }

    # --- Create Event with Actions ---
    actions_with_update = EventActions(state_delta=state_changes)
    # This event might represent an internal system action, not just an agent response
    system_event = Event(
        invocation_id="inv_login_update",
        author="system", # Or 'agent', 'tool' etc.
        actions=actions_with_update,
        timestamp=current_time
        # content might be None or represent the action taken
    )

    # --- Append the Event (This updates the state) ---
    await session_service.append_event(session, system_event)
    print("`append_event` called with explicit state delta.")

    # --- Check Updated State ---
    updated_session = await session_service.get_session(app_name=app_name,
                                                user_id=user_id,
                                                session_id=session_id)
    print(f"State after event: {updated_session.state}")
    # Expected: {'user:login_count': 1, 'task_status': 'active', 'user:last_login_ts': <timestamp>}
    # Note: 'temp:validation_needed' is NOT present.
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/state/ManualStateUpdateExample.java:full_code"
    ```

**3. 透過 `CallbackContext` 或 `ToolContext`（建議用於 Callbacks 與工具）**

在 agent 的 Callbacks（例如 `on_before_agent_call`、`on_after_agent_call`）或工具函式中修改 state，最佳做法是使用傳遞給你函式的 `CallbackContext` 或 `ToolContext` 的 `state` 屬性。

*   `callback_context.state['my_key'] = my_value`
*   `tool_context.state['my_key'] = my_value`

這些 context 物件專為在其各自的執行範圍內管理 state 變更而設計。當你修改 `context.state` 時，Agent Development Kit (ADK) 框架會自動擷取這些變更，並正確地將其導入由 callback 或工具所產生事件的 `EventActions.state_delta`。這個 delta 會在事件被附加時由 `SessionService` 處理，確保正確的持久化與追蹤。

這種方式讓你在 callbacks 與工具中，無需手動建立 `EventActions` 與 `state_delta`，即可處理大多數常見的 state 更新情境，使你的程式碼更簡潔且更不易出錯。

如需關於 context 物件的更詳細說明，請參閱 [Context documentation](../context/index.md)。

=== "Python"

    ```python
    # In an agent callback or tool function
    from google.adk.agents import CallbackContext # or ToolContext

    def my_callback_or_tool_function(context: CallbackContext, # Or ToolContext
                                     # ... other parameters ...
                                    ):
        # Update existing state
        count = context.state.get("user_action_count", 0)
        context.state["user_action_count"] = count + 1

        # Add new state
        context.state["temp:last_operation_status"] = "success"

        # State changes are automatically part of the event's state_delta
        # ... rest of callback/tool logic ...
    ```

=== "Java"

    ```java
    // In an agent callback or tool method
    import com.google.adk.agents.CallbackContext; // or ToolContext
    // ... other imports ...

    public class MyAgentCallbacks {
        public void onAfterAgent(CallbackContext callbackContext) {
            // Update existing state
            Integer count = (Integer) callbackContext.state().getOrDefault("user_action_count", 0);
            callbackContext.state().put("user_action_count", count + 1);

            // Add new state
            callbackContext.state().put("temp:last_operation_status", "success");

            // State changes are automatically part of the event's state_delta
            // ... rest of callback logic ...
        }
    }
    ```

**`append_event` 的作用：**

* 將 `Event` 加入 `session.events`。
* 從事件的 `actions` 讀取 `state_delta`。
* 將這些變更套用到由 `SessionService` 管理的 state，並根據服務類型正確處理前綴與持久化。
* 更新 session 的 `last_update_time`。
* 確保多執行緒下的更新具備執行緒安全性。

### ⚠️ 關於直接修改 state 的警告

請避免在 agent 呼叫的受控生命週期*之外*（即不是透過 `CallbackContext` 或 `ToolContext`）直接修改從 `SessionService`（例如經由 `session_service.get_session()` 或 `session_service.create_session()`）取得的 `Session` 物件上的 `session.state` 集合（dictionary/Map）。例如，像 `retrieved_session = await session_service.get_session(...); retrieved_session.state['key'] = value` 這樣的程式碼會有問題。

在 callback 或 tools 內，使用 `CallbackContext.state` 或 `ToolContext.state` 進行 state 修改，才是確保變更被正確追蹤的正確方式，因為這些 context 物件會處理與事件系統的必要整合。

**為什麼強烈不建議在 context 之外直接修改：**

1. **繞過事件歷史紀錄：** 這種變更不會被記錄為 `Event`，因此失去稽核能力。
2. **破壞持久化：** 以這種方式做的變更**很可能不會被** `DatabaseSessionService` 或 `VertexAiSessionService` 儲存。它們仰賴 `append_event` 來觸發儲存。
3. **非執行緒安全：** 可能導致競爭條件與資料遺失。
4. **忽略時間戳與邏輯：** 不會更新 `last_update_time`，也不會觸發相關事件邏輯。

**建議：** 請僅透過 `output_key`、`EventActions.state_delta`（當手動建立事件時），或在各自的範疇內修改 `CallbackContext` 或 `ToolContext` 物件的 `state` 屬性來更新 state。這些方法能確保 state 管理的可靠性、可追蹤性與持久性。僅在*讀取* state 時，才直接存取從 `SessionService` 取得的 `session.state`。

### State 設計最佳實踐重點回顧

* **極簡主義：** 只儲存必要且具動態性的資料。
* **可序列化：** 使用基本且可序列化的型別。
* **具描述性的鍵與前綴：** 使用清楚的名稱與適當的前綴（`user:`、`app:`、`temp:` 或無）。
* **淺層結構：** 盡量避免深層巢狀。
* **標準更新流程：** 依賴 `append_event`。
