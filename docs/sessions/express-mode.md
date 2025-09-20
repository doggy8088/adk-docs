# Vertex AI Express 模式：免費使用 Vertex AI Sessions 與 Memory

如果你有興趣使用 `VertexAiSessionService` 或 `VertexAiMemoryBankService`，但尚未擁有 Google Cloud 專案，可以註冊 Vertex AI Express 模式，免費存取並體驗這些服務！你可以使用符合資格的 ***gmail*** 帳號在[這裡](https://console.cloud.google.com/expressmode)註冊。如需更多 Vertex AI Express 模式的詳細資訊，請參閱[總覽頁面](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview)。  
註冊完成後，取得[API key](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview#api-keys)，即可開始在本機使用你的 Agent Development Kit (ADK) agent 搭配 Vertex AI Session 與 Memory 服務！

!!! info Vertex AI Express mode limitations

    Vertex AI Express 模式在免費方案中有一些限制。免費的 Express 模式專案僅有效 90 天，且僅能使用部分服務，且配額有限。例如，Agent Engine 的數量限制為 10 個，且僅付費方案才能部署到 Agent Engine。若要解除配額限制並使用 Vertex AI 的所有服務，請將帳單帳戶新增至您的 Express 模式專案。

## 建立 Agent Engine

`Session` 物件是 `AgentEngine` 的子物件。在使用 Vertex AI Express 模式時，我們可以建立一個空的 `AgentEngine` 父物件來管理所有的 `Session` 和 `Memory` 物件。
首先，請確保您的環境變數設定正確。例如，在 Python 中：

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

    3. 將 `YOUR_AGENT_ENGINE_DISPLAY_NAME` 和 `YOUR_AGENT_ENGINE_DESCRIPTION` 替換為你的使用情境。
    4. 從回應中取得 Agent Engine 的名稱與 ID

        ```py
        APP_NAME = "/".join(response['name'].split("/")[:6])
        APP_ID = APP_NAME.split('/')[-1]
        ```

## 使用 `VertexAiSessionService` 管理 Session

[`VertexAiSessionService`](session.md###sessionservice-implementations) 相容於 Vertex AI Express 模式 API KEY。我們可以在初始化 session 物件時，不需要指定任何專案（project）或位置（location）。

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

!!! info Session Service Quotas

    對於免費 Vertex AI Express 模式專案，`VertexAiSessionService` 擁有以下配額：

    - 100 個 Session 實體
    - 10,000 個 Event 實體

## 使用 `VertexAiMemoryBankService` 管理記憶體

[`VertexAiMemoryBankService`](memory.md###memoryservice-implementations) 相容於 Vertex AI Express 模式 API KEY。我們可以在初始化記憶體物件時，不需要指定任何專案或位置。

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

!!! info Memory Service Quotas

    對於免費的 Vertex AI Express 模式專案，`VertexAiMemoryBankService` 有以下配額：

    - 200 個記憶體實體（Memory Entities）

## 範例程式碼：使用 Session 與 Memory 的天氣代理（Weather Agent），採用 Vertex AI Express 模式

在此範例中，我們建立了一個天氣代理（weather agent），同時運用 `VertexAiSessionService` 與 `VertexAiMemoryBankService` 進行情境管理（context management），讓我們的 agent 能夠記住使用者偏好與對話內容！

**[使用 Vertex AI Express 模式的 Session 與 Memory 建立天氣代理](https://github.com/google/adk-docs/blob/main/examples/python/notebooks/express-mode-weather-agent.ipynb)**
