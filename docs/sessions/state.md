# 狀態：Session 的暫存區

在每個 `Session`（我們的對話執行緒）中，**`state`** 屬性就像該次互動專屬於 agent 的暫存區。雖然 `session.events` 儲存完整歷史紀錄，`session.state` 則是 agent 在對話過程中儲存和更新所需動態細節的地方。

## 什麼是 `session.state`？

概念上，`session.state` 是一個集合（dictionary 或 Map），用來儲存鍵值對。它設計用於 agent 需要記憶或追蹤的資訊，以提升當前對話的效率：

* **個人化互動：** 記住先前提及的使用者偏好（例如 `'user_preference_theme': 'dark'`）。
* **追蹤任務進度：** 監控多輪流程中的步驟（例如 `'booking_step': 'confirm_payment'`）。
* **累積資訊：** 建立清單或摘要（例如 `'shopping_cart_items': ['book', 'pen']`）。
* **做出明智決策：** 儲存影響下次回應的旗標或數值（例如 `'user_is_authenticated': True`）。

### `State` 的主要特性

1. **結構：可序列化的鍵值對**

    * 資料以 `key: value` 形式儲存。
    * **鍵（Keys）：** 一律為字串（`str`）。請使用清楚明確的名稱（例如 `'departure_city'`、`'user:language_preference'`）。
    * **值（Values）：** 必須是**可序列化**的。也就是說，這些值可以被 `SessionService` 輕鬆地儲存與載入。請僅使用各語言（Python/Java）中的基本型別，如字串、數字、布林值，以及只包含這些基本型別的簡單 list 或 dictionary。（詳細請參考 API 文件）
    * **⚠️ 避免複雜物件：** **請勿直接在 state 中儲存不可序列化的物件**（自訂類別實例、函式、連線等）。如有需要，請僅儲存簡單識別碼，並於其他地方取得複雜物件。

2. **可變性：內容會變動**

    * 隨著對話進行，`state` 的內容預期會隨之變化。

3. **持久性：取決於 `SessionService`**

    * 狀態是否能在應用程式重啟後保留，取決於你選用的服務：
      * `InMemorySessionService`：**不具持久性。** 重啟後狀態會遺失。
      * `DatabaseSessionService` / `VertexAiSessionService`：**具持久性。** 狀態會被可靠地儲存。

!!! Note
    各語言 SDK 的原始方法名稱或參數可能略有不同（例如 Python 的 `session.state['current_intent'] = 'book_flight'`，Java 的 `session.state().put("current_intent", "book_flight)`）。請參考各語言的 API 文件以獲取詳細資訊。

### 使用前綴組織狀態：作用域很重要

狀態鍵的前綴決定其作用域與持久化行為，特別是在使用持久化服務時：

* **無前綴（Session 狀態）：**

    * **作用域：** 限於*當前* session（`id`）。
    * **持久性：** 僅在 `SessionService` 具持久性時才會保存（`Database`、`VertexAI`）。
    * **使用情境：** 追蹤當前任務進度（例如 `'current_booking_step'`）、本次互動的暫時旗標（例如 `'needs_clarification'`）。
    * **範例：** `session.state['current_intent'] = 'book_flight'`

* **`user:` 前綴（User 狀態）：**

    * **作用域：** 綁定於 `user_id`，在同一 `app_name` 下該使用者的*所有* session 共享。
    * **持久性：** 搭配 `Database` 或 `VertexAI` 時具持久性。（由 `InMemory` 儲存，但重啟後會遺失）
    * **使用情境：** 使用者偏好（例如 `'user:theme'`）、個人資料細節（例如 `'user:name'`）。
    * **範例：** `session.state['user:preferred_language'] = 'fr'`

* **`app:` 前綴（App 狀態）：**

    * **作用域：** 綁定於 `app_name`，該應用程式下*所有*使用者與 session 共享。
    * **持久性：** 搭配 `Database` 或 `VertexAI` 時具持久性。（由 `InMemory` 儲存，但重啟後會遺失）
    * **使用情境：** 全域設定（例如 `'app:api_endpoint'`）、共用範本。
    * **範例：** `session.state['app:global_discount_code'] = 'SAVE10'`

* **`temp:` 前綴（暫時性呼叫狀態）：**

    * **作用域：** 限於當前**呼叫**（即 agent 從接收使用者輸入到為該輸入產生最終輸出這整個過程）。
    * **持久性：** **不具持久性。** 呼叫結束後即丟棄，不會延續到下一次呼叫。
    * **使用情境：** 在單次呼叫內於工具呼叫間傳遞的中間計算結果、旗標或資料。
    * **不適用情境：** 需跨多次呼叫保存的資訊，例如使用者偏好、對話歷史摘要或累積資料。
    * **範例：** `session.state['temp:raw_api_response'] = {...}`

!!! note "子 agent 與呼叫上下文"
    當父 agent 呼叫子 agent（例如使用 `SequentialAgent` 或 `ParallelAgent`）時，會將其 `InvocationContext` 傳遞給子 agent。這表示整個 agent 呼叫鏈會共用同一個呼叫 ID，因此也共用同一份 `temp:` 狀態。

**Agent 如何看待這一切：** 你的 agent 程式碼會透過單一的 `session.state` 集合（dict/Map）來操作*合併後*的狀態。`SessionService` 會根據前綴，自動從正確的底層儲存空間提取/合併狀態。

### 在 Agent 指令中存取 Session 狀態

當你操作 `LlmAgent` 實例時，可以使用簡單的樣板語法，直接將 session 狀態值注入 agent 的指令字串。這讓你能建立動態且具情境感知的指令，而不必完全依賴自然語言描述。

#### 使用 `{key}` 樣板語法

要從 session 狀態注入變數值，只需將目標狀態變數的鍵以大括號包起來：`{key}`。框架會在將指令傳遞給大型語言模型 (LLM) 前，自動以 `session.state` 中對應的值取代這個佔位符。

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

* 鍵值存在性：請確保你在指令字串中引用的鍵（key）已存在於 `session.state` 中。如果該鍵不存在，agent 會拋出錯誤。若你想使用一個可能存在也可能不存在的鍵，可以在鍵名後加上問號（?）（例如：`{topic?}`）。
* 資料型別：與鍵相關聯的值應為字串，或是可以輕易轉換為字串的型別。
* 跳脫字元：如果你需要在指令中使用字面上的大括號（例如用於 JSON 格式化），你需要對它們進行跳脫處理。

#### 使用 `InstructionProvider` 跳過狀態注入

在某些情境下，你可能希望在指令中直接使用 `{{` 和 `}}`，而不觸發狀態注入機制。例如，你可能正在為一個使用相同語法的樣板語言（templating language）撰寫 agent 指令。

為達成此目的，你可以將 `instruction` 參數設為一個函式（function），而非字串。這個函式稱為 `InstructionProvider`。當你使用 `InstructionProvider` 時，Agent Development Kit (ADK) 不會嘗試進行狀態注入，並會將你的指令字串原封不動地傳遞給模型。

`InstructionProvider` 函式會接收一個 `ReadonlyContext` 物件，你可以利用這個物件來存取 session state 或其他情境資訊，若你需要動態構建指令時會很有用。

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

如果你想同時使用 `InstructionProvider` *並且* 將狀態注入到你的指令中，可以使用 `inject_session_state` 公用函式。

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

**直接注入的優點**

* 清晰性：明確指出指令中哪些部分是動態的，並且基於 session state（工作階段狀態）。
* 可靠性：避免依賴大型語言模型 (LLM) 正確解讀自然語言指令以存取狀態。
* 可維護性：簡化指令字串，並在更新狀態變數名稱時降低出錯風險。

**與其他狀態存取方法的關係**

這種直接注入的方法是專為 LlmAgent 指令設計的。關於其他狀態存取方法，請參考下一節。

### 狀態如何更新：建議的方法

!!! note "正確修改狀態的方法"
    當你需要變更 session state（工作階段狀態）時，最正確且最安全的方法是**直接修改提供給你的函式（例如 `callback_context.state['my_key'] = 'new_value'`）中的 `Context` 上的 `state` 物件**。這被認為是「正確的直接狀態操作」，因為框架會自動追蹤這些變更。

    This is critically different from directly modifying the `state` on a `Session` object you retrieve from the `SessionService` (e.g., `my_session.state['my_key'] = 'new_value'`). **You should avoid this**, as it bypasses the ADK's event tracking and can lead to lost data. The "Warning" section at the end of this page has more details on this important distinction.

狀態應該**始終**在使用`session_service.append_event()`將`Event`新增到 session 歷史紀錄時進行更新。這可確保變更被正確追蹤、資料持久化運作正常，並且更新具備執行緒安全性。

**1\. 最簡單的方法：`output_key`（適用於 agent 文字回應）**

這是將 agent 最終文字回應直接儲存到狀態中的最簡單方式。在定義您的`LlmAgent`時，請指定`output_key`：

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

在幕後，`Runner` 會使用 `output_key` 來建立必要的 `EventActions`，並配合 `state_delta`，然後呼叫 `append_event`。

**2\. 標準方式：`EventActions.state_delta`（用於複雜更新）**

針對較複雜的情境（例如同時更新多個鍵值、非字串型別的值、特定範疇如 `user:` 或 `app:`，或是更新並非直接與 agent 最終文字綁定），你需要在 `EventActions` 中手動建構 `state_delta`。

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

**3. 透過 `CallbackContext` 或 `ToolContext`（建議用於回呼函式與工具）**

在 agent 回呼函式（例如 `on_before_agent_call`、`on_after_agent_call`）或工具函式中修改狀態，最佳做法是使用傳遞給你函式的 `CallbackContext` 或 `ToolContext` 的 `state` 屬性。

*   `callback_context.state['my_key'] = my_value`
*   `tool_context.state['my_key'] = my_value`

這些 context 物件專為在其各自執行範疇內管理狀態變更而設計。當你修改 `context.state` 時，Agent Development Kit (ADK) 框架會自動捕捉這些變更，並正確地將其導入由該回呼或工具所產生事件的 `EventActions.state_delta`。這個差異（delta）隨後會在事件被附加時由 `SessionService` 處理，確保正確的持久化與追蹤。

這種方法將大多數在回呼與工具中常見的狀態更新情境下，手動建立 `EventActions` 與 `state_delta` 的過程抽象化，讓你的程式碼更簡潔且更不易出錯。

如需更完整的 context 物件說明，請參閱 [Context documentation](../context/index.md)。

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

* 將 `Event` 加入到 `session.events`。
* 從事件的 `actions` 讀取 `state_delta`。
* 將這些變更套用到由 `SessionService` 所管理的狀態，並根據服務類型正確處理前綴與持久化。
* 更新 session 的 `last_update_time`。
* 確保在多執行緒同時更新時的執行緒安全性。

### ⚠️ 關於直接修改狀態的警告

請避免在 agent 呼叫的受控生命週期*之外*（也就是不是透過 `CallbackContext` 或 `ToolContext`），直接修改從 `SessionService`（例如經由 `session_service.get_session()` 或 `session_service.create_session()`）取得的 `Session` 物件上的 `session.state` 集合（dictionary/Map）。例如，像 `retrieved_session = await session_service.get_session(...); retrieved_session.state['key'] = value` 這樣的程式碼就是有問題的。

在 callback 或 tools 中，透過 `CallbackContext.state` 或 `ToolContext.state` 進行狀態修改，才是確保變更能被正確追蹤的正確方式，因為這些 context 物件會處理與事件系統整合所需的相關作業。

**為什麼強烈不建議在 context 之外直接修改狀態：**

1. **繞過事件歷史紀錄：** 這樣的變更不會被記錄為 `Event`，因此失去稽核能力。
2. **破壞持久化機制：** 以這種方式做的變更**很可能不會被** `DatabaseSessionService` 或 `VertexAiSessionService` 儲存。這些元件依賴 `append_event` 來觸發保存。
3. **非執行緒安全：** 可能導致競爭條件與資料遺失。
4. **忽略時間戳與邏輯：** 不會更新 `last_update_time` 或觸發相關事件邏輯。

**建議做法：** 請透過 `output_key`、`EventActions.state_delta`（當你需要手動建立事件時），或在各自作用域內修改 `CallbackContext` 或 `ToolContext` 物件的 `state` 屬性來更新狀態。這些方法能確保狀態管理的可靠性、可追蹤性與持久性。僅在需要*讀取*狀態時，才直接存取從 `SessionService` 取得的 session 的 `session.state`。

### 狀態設計最佳實踐重點回顧

* **極簡主義：** 只儲存必要且具動態性的資料。
* **可序列化：** 使用基本且可序列化的型別。
* **具描述性的鍵與前綴：** 使用清楚的名稱與適當的前綴（`user:`、`app:`、`temp:` 或無前綴）。
* **淺層結構：** 儘量避免深層巢狀結構。
* **標準更新流程：** 依賴 `append_event`。
