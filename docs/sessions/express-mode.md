# Vertex AI Express 模式：免費使用 Vertex AI Sessions 與記憶體服務

如果你有興趣使用 `VertexAiSessionService` 或 `VertexAiMemoryBankService`，但尚未擁有 Google Cloud 專案（Google Cloud Project），你可以註冊 Vertex AI Express 模式，免費取得存取權，體驗這些服務！你可以使用符合資格的 ***gmail*** 帳戶在[這裡](https://console.cloud.google.com/expressmode)註冊。關於 Vertex AI Express 模式的更多細節，請參閱[總覽頁面](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview)。
註冊完成後，取得[API 金鑰](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview#api-keys)，即可開始使用你的本機 Agent Development Kit (ADK) agent 搭配 Vertex AI Session 與記憶體服務！

!!! info Vertex AI Express 模式限制

    Vertex AI Express Mode has certain limitations in the free tier. Free Express mode projects are only valid for 90 days and only select services are available to be used with limited quota. For example, the number of Agent Engines is restricted to 10 and deployment to Agent Engine is reserved for the paid tier only. To remove the quota restrictions and use all of Vertex AI's services, add a billing account to your Express Mode project.

## 建立 Agent Engine

`Session` 物件是 `AgentEngine` 的子物件。在使用 Vertex AI Express Mode 時，我們可以建立一個空的 `AgentEngine` 父物件來管理所有的 `Session` 和 `Memory` 物件。
首先，請確保您的環境變數已正確設定。例如，在 Python 中：

```env title="weather_agent/.env"
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_EXPRESS_MODE_API_KEY_HERE
```

接下來，我們可以建立 Agent Engine 實例。你可以使用 Gen AI SDK。

=== "Gen AI SDK"

    1. 匯入 Gen AI SDK。

        ```py
        from google import genai
        ```

    2. 將 Vertex AI 設為 True，然後使用`POST`請求來建立 Agent Engine
        
        ```py
        # Create Agent Engine with Gen AI SDK
        client = genai.Client(vertexai=True)._api_client

        response = client.request(
            http_method='POST',
            path=f'reasoningEngines',
            request_dict={"displayName": "YOUR_AGENT_ENGINE_DISPLAY_NAME", "description": "YOUR_AGENT_ENGINE_DESCRIPTION"},
        )
        response
        ```

    3. 將 `YOUR_AGENT_ENGINE_DISPLAY_NAME` 和 `YOUR_AGENT_ENGINE_DESCRIPTION` 替換為您的使用情境。
    4. 從回應中取得 Agent Engine 的名稱與 ID

        ```py
        APP_NAME = "/".join(response['name'].split("/")[:6])
        APP_ID = APP_NAME.split('/')[-1]
        ```

## 使用 `VertexAiSessionService` 管理工作階段

[`VertexAiSessionService`](session.md###sessionservice-implementations) 相容於 Vertex AI Express mode API Keys。我們可以在不指定任何專案（project）或區域（location）的情況下初始化 session 物件。

```py
# Requires: pip install google-adk[vertexai]
# Plus environment variable setup:
# GOOGLE_GENAI_USE_VERTEXAI=TRUE
# GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_EXPRESS_MODE_API_KEY_HERE
from google.adk.sessions import VertexAiSessionService

# The app_name used with this service should be the Reasoning Engine ID or name
APP_ID = "your-reasoning-engine-id"

# Project and location are not required when initializing with Vertex Express Mode
session_service = VertexAiSessionService(agent_engine_id=APP_ID)
# Use REASONING_ENGINE_APP_ID when calling service methods, e.g.:
# session = await session_service.create_session(app_name=REASONING_ENGINE_APP_ID, user_id= ...)
```

!!! info Session Service 配額

    For Free Express Mode Projects, `VertexAiSessionService` has the following quota:

    - 100 Session Entities
    - 10,000 Event Entities

## 使用 `VertexAiMemoryBankService` 管理記憶體

[`VertexAiMemoryBankService`](memory.md###memoryservice-implementations) 相容於 Vertex AI Express mode API KEY。我們可以在不指定任何 GCP 專案或位置的情況下初始化記憶體物件。

```py
# Requires: pip install google-adk[vertexai]
# Plus environment variable setup:
# GOOGLE_GENAI_USE_VERTEXAI=TRUE
# GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_EXPRESS_MODE_API_KEY_HERE
from google.adk.sessions import VertexAiMemoryBankService

# The app_name used with this service should be the Reasoning Engine ID or name
APP_ID = "your-reasoning-engine-id"

# Project and location are not required when initializing with Vertex Express Mode
memory_service = VertexAiMemoryBankService(agent_engine_id=APP_ID)
# Generate a memory from that session so the Agent can remember relevant details about the user
# memory = await memory_service.add_session_to_memory(session)
```

!!! info 記憶體服務配額

    For Free Express Mode Projects, `VertexAiMemoryBankService` has the following quota:

    - 200 Memory Entities

## 程式碼範例：使用 Vertex AI Express Mode 的 Weather Agent（支援 Session 與 Memory）

在本範例中，我們建立了一個 weather agent，利用 `VertexAiSessionService` 和 `VertexAiMemoryBankService` 來進行情境管理，讓 agent 能夠記住使用者偏好與對話內容！

**[使用 Vertex AI Express Mode 的 Weather Agent（支援 Session 與 Memory）](https://github.com/google/adk-docs/blob/main/examples/python/notebooks/express-mode-weather-agent.ipynb)**
