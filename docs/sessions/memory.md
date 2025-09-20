# 記憶體：使用 `MemoryService` 實現長期知識

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出／即將上線。"}

我們已經了解 `Session` 如何追蹤*單一、持續對話*的歷史紀錄（`events`）與暫存資料（`state`）。但如果 agent 需要從*過去*的對話中回憶資訊，或是存取外部知識庫該怎麼辦？這時就需要**長期知識（Long-Term Knowledge）**以及**`MemoryService`** 的概念。

你可以這樣理解：

* **`Session` / `State`：** 就像你在單一聊天過程中的短期記憶。  
* **長期知識（Long-Term Knowledge，`MemoryService`）**：像是 agent 可以查詢的可搜尋檔案庫或知識圖書館，可能包含許多過去對話或其他來源的資訊。

## `MemoryService` 的角色

`BaseMemoryService` 定義了管理這個可搜尋長期知識庫的介面。其主要職責包括：

1. **資訊匯入（`add_session_to_memory`）：** 將（通常已結束的）`Session` 內容提取並將相關資訊加入長期知識庫。  
2. **資訊搜尋（`search_memory`）：** 允許 agent（通常透過 `Tool`）查詢知識庫，並根據搜尋查詢檢索相關片段或上下文。

## 選擇合適的記憶體服務

Agent Development Kit (ADK) 提供兩種不同的 `MemoryService` 實作，分別適用於不同情境。請參考下表，選擇最適合你 agent 的方案。

| **功能** | **InMemoryMemoryService** | **[全新！] VertexAiMemoryBankService** |
| :--- | :--- | :--- |
| **持久性** | 無（重新啟動後資料會遺失） | 有（由 Vertex AI 管理） |
| **主要使用情境** | 原型開發、本機開發與簡單測試 | 從使用者對話中建立有意義且可演進的記憶 |
| **記憶體提取** | 儲存完整對話內容 | 從對話中提取[有意義的資訊](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/generate-memories)，並與現有記憶整合（由大型語言模型 (LLM) 驅動） |
| **搜尋能力** | 基本關鍵字比對 | 進階語意搜尋 |
| **設定複雜度** | 無。為預設選項。 | 低。需在 Vertex AI 建立 [Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview)。 |
| **相依套件** | 無 | Google Cloud Project、Vertex AI API |
| **適用時機** | 需要在多個工作階段的聊天紀錄中搜尋以進行原型開發時 | 希望 agent 能記住並學習過往互動內容時 |

## In-Memory Memory

`InMemoryMemoryService` 會將工作階段資訊儲存在應用程式的記憶體中，並以基本關鍵字比對方式進行搜尋。它不需要任何設定，最適合用於不需持久化的原型開發與簡單測試場景。

```py
from google.adk.memory import InMemoryMemoryService
memory_service = InMemoryMemoryService()
```

**範例：新增與搜尋記憶體**

本範例為了簡化說明，展示了使用 `InMemoryMemoryService` 的基本流程。

??? "完整程式碼"

    ```py
    import asyncio
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService, Session
    from google.adk.memory import InMemoryMemoryService # Import MemoryService
    from google.adk.runners import Runner
    from google.adk.tools import load_memory # Tool to query memory
    from google.genai.types import Content, Part

    # --- Constants ---
    APP_NAME = "memory_example_app"
    USER_ID = "mem_user"
    MODEL = "gemini-2.0-flash" # Use a valid model

    # --- Agent Definitions ---
    # Agent 1: Simple agent to capture information
    info_capture_agent = LlmAgent(
        model=MODEL,
        name="InfoCaptureAgent",
        instruction="Acknowledge the user's statement.",
    )

    # Agent 2: Agent that can use memory
    memory_recall_agent = LlmAgent(
        model=MODEL,
        name="MemoryRecallAgent",
        instruction="Answer the user's question. Use the 'load_memory' tool "
                    "if the answer might be in past conversations.",
        tools=[load_memory] # Give the agent the tool
    )

    # --- Services ---
    # Services must be shared across runners to share state and memory
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService() # Use in-memory for demo

    async def run_scenario():
        # --- Scenario ---

        # Turn 1: Capture some information in a session
        print("--- Turn 1: Capturing Information ---")
        runner1 = Runner(
            # Start with the info capture agent
            agent=info_capture_agent,
            app_name=APP_NAME,
            session_service=session_service,
            memory_service=memory_service # Provide the memory service to the Runner
        )
        session1_id = "session_info"
        await runner1.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)
        user_input1 = Content(parts=[Part(text="My favorite project is Project Alpha.")], role="user")

        # Run the agent
        final_response_text = "(No final response)"
        async for event in runner1.run_async(user_id=USER_ID, session_id=session1_id, new_message=user_input1):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
        print(f"Agent 1 Response: {final_response_text}")

        # Get the completed session
        completed_session1 = await runner1.session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)

        # Add this session's content to the Memory Service
        print("\n--- Adding Session 1 to Memory ---")
        await memory_service.add_session_to_memory(completed_session1)
        print("Session added to memory.")

        # Turn 2: Recall the information in a new session
        print("\n--- Turn 2: Recalling Information ---")
        runner2 = Runner(
            # Use the second agent, which has the memory tool
            agent=memory_recall_agent,
            app_name=APP_NAME,
            session_service=session_service, # Reuse the same service
            memory_service=memory_service   # Reuse the same service
        )
        session2_id = "session_recall"
        await runner2.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session2_id)
        user_input2 = Content(parts=[Part(text="What is my favorite project?")], role="user")

        # Run the second agent
        final_response_text_2 = "(No final response)"
        async for event in runner2.run_async(user_id=USER_ID, session_id=session2_id, new_message=user_input2):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text_2 = event.content.parts[0].text
        print(f"Agent 2 Response: {final_response_text_2}")

    # To run this example, you can use the following snippet:
    # asyncio.run(run_scenario())

    # await run_scenario()
    ```

## Vertex AI Memory Bank

`VertexAiMemoryBankService` 將你的 agent 連接到 [Vertex AI Memory Bank](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview)，這是一項由 Google Cloud 完全託管的服務，為對話式 agent 提供先進且持久的記憶功能。

### 運作方式

此服務會自動處理兩項關鍵操作：

*   **產生記憶（Memories）：** 在對話結束時，Agent Development Kit (ADK) 會將本次工作階段的事件傳送至 Memory Bank，該服務會智慧地處理並將資訊儲存為「記憶」。
*   **擷取記憶：** 你的 agent 程式碼可以向 Memory Bank 發出搜尋查詢，以從過去的對話中擷取相關的記憶。

### 先決條件

在你使用此功能之前，必須具備以下條件：

1.  **Google Cloud 專案：** 並已啟用 Vertex AI API。
2.  **Agent Engine：** 你需要在 Vertex AI 中建立一個 Agent Engine。這將提供設定所需的 **Agent Engine ID**。
3.  **驗證（Authentication）：** 請確保你的本機環境已通過驗證，可以存取 Google Cloud 服務。最簡單的方式是執行：
    ```bash
    gcloud auth application-default login
    ```
4.  **Environment Variables:** The service requires your Google Cloud Project ID and Location. Set them as environment variables:


4.  **環境變數：** 此服務需要您的 Google Cloud 專案 ID（Project ID）與位置（Location）。請將它們設為環境變數：
    ```bash
    export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
    export GOOGLE_CLOUD_LOCATION="your-gcp-location"
    ```

### 設定

要將你的 agent 連接到 Memory Bank，請在啟動 Agent Development Kit (ADK) 伺服器時使用 `--memory_service_uri` 旗標（`adk web` 或 `adk api_server`）。URI 必須採用 `agentengine://<agent_engine_id>` 格式。

```bash title="bash"
adk web path/to/your/agents_dir --memory_service_uri="agentengine://1234567890"
```

或者，你也可以手動實例化`VertexAiMemoryBankService`，並將其傳遞給`Runner`，來設定你的 agent 使用 Memory Bank。

```py
from google.adk.memory import VertexAiMemoryBankService

agent_engine_id = agent_engine.api_resource.name.split("/")[-1]

memory_service = VertexAiMemoryBankService(
    project="PROJECT_ID",
    location="LOCATION",
    agent_engine_id=agent_engine_id
)

runner = adk.Runner(
    ...
    memory_service=memory_service
)
``` 

### 在您的 agent 中使用 Memory

完成服務設定後，Agent Development Kit (ADK) 會自動將工作階段資料儲存到 Memory Bank。若要讓您的 agent 使用這些記憶資料，您需要在 agent 的程式碼中呼叫 `search_memory` 方法。

這通常會在回合開始時執行，以便在產生回應前取得相關的情境資訊。

**範例：**

```python
from google.adk.agents import Agent
from google.genai import types

class MyAgent(Agent):
    async def run(self, request: types.Content, **kwargs) -> types.Content:
        # Get the user's latest message
        user_query = request.parts[0].text

        # Search the memory for context related to the user's query
        search_result = await self.search_memory(query=user_query)

        # Create a prompt that includes the retrieved memories
        prompt = f"Based on my memory, here's what I recall about your query: {search_result.memories}\n\nNow, please respond to: {user_query}"

        # Call the LLM with the enhanced prompt
        return await self.llm.generate_content_async(prompt)
```

## 進階概念

### 記憶體在實務中的運作方式

記憶體的工作流程在內部包含以下步驟：

1. **工作階段互動：** 使用者透過`Session`與 agent 互動，該工作階段由`SessionService`管理。事件會被新增，狀態也可能被更新。  
2. **寫入記憶體：** 在某個時點（通常是在工作階段結束或取得重要資訊時），您的應用程式會呼叫`memory_service.add_session_to_memory(session)`。這個方法會從工作階段的事件中擷取相關資訊，並將其加入長期知識儲存區（記憶體中的字典或 RAG Corpus）。  
3. **後續查詢：** 在*不同*（或相同）的工作階段中，使用者可能會提出需要過去脈絡的問題（例如：「我們上週討論過 project X 什麼內容？」）。  
4. **agent 使用記憶體工具：** 配備有記憶體檢索工具（如內建的`load_memory`工具）的 agent 會辨識到需要過去的脈絡，並呼叫該工具，提供查詢字串（例如：「discussion project X last week」）。  
5. **執行搜尋：** 該工具會在內部呼叫`memory_service.search_memory(app_name, user_id, query)`。  
6. **回傳結果：** `MemoryService`會在其儲存區中（透過關鍵字比對或語意搜尋）搜尋，並以`SearchMemoryResponse`的形式回傳相關片段，內容包含`MemoryResult`物件清單（每個物件可能包含來自相關過去工作階段的事件）。  
7. **agent 使用結果：** 該工具會將這些結果回傳給 agent，通常作為脈絡或函式回應的一部分。agent 隨後可利用這些檢索到的資訊，來組成最終回覆給使用者的答案。

### agent 可以存取多個記憶體服務嗎？

*   **透過標準設定：不行。** 此框架（`adk web`、`adk api_server`）設計上一次僅能透過`--memory_service_uri`旗標設定一個記憶體服務。這個單一服務會提供給 agent，並透過內建的`self.search_memory()`方法存取。從設定的角度來看，您只能為該程序下所有 agent 選擇一個後端（`InMemory`、`VertexAiMemoryBankService`）。

*   **在您的 agent 程式碼中：可以，絕對可以。** 沒有任何限制阻止您在 agent 程式碼內手動引入並實例化另一個記憶體服務。這讓您可以在單一 agent 回合中存取多個記憶體來源。

舉例來說，您的 agent 可以使用框架設定的`VertexAiMemoryBankService`來回顧對話歷史，同時手動實例化`InMemoryMemoryService`以查詢技術手冊中的資訊。

#### 範例：同時使用兩個記憶體服務

以下說明如何在您的 agent 程式碼中實作這個功能：

```python
from google.adk.agents import Agent
from google.adk.memory import InMemoryMemoryService, VertexAiMemoryBankService
from google.genai import types

class MultiMemoryAgent(Agent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.memory_service = InMemoryMemoryService()
        # Manually instantiate a second memory service for document lookups
        self.vertexai_memorybank_service = VertexAiMemoryBankService(
            project="PROJECT_ID",
            location="LOCATION",
            agent_engine_id="AGENT_ENGINE_ID"
        )

    async def run(self, request: types.Content, **kwargs) -> types.Content:
        user_query = request.parts[0].text

        # 1. Search conversational history using the framework-provided memory
        #    (This would be InMemoryMemoryService if configured)
        conversation_context = await self.memory_service.search_memory(query=user_query)

        # 2. Search the document knowledge base using the manually created service
        document_context = await self.vertexai_memorybank_service.search_memory(query=user_query)

        # Combine the context from both sources to generate a better response
        prompt = "From our past conversations, I remember:\n"
        prompt += f"{conversation_context.memories}\n\n"
        prompt += "From the technical manuals, I found:\n"
        prompt += f"{document_context.memories}\n\n"
        prompt += f"Based on all this, here is my answer to '{user_query}':"

        return await self.llm.generate_content_async(prompt)
```
