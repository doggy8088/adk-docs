# 使用 Arize AX 進行 Agent 可觀測性

[Arize AX](https://arize.com/docs/ax) 是一個具備生產等級的可觀測性平台，可用於大規模監控、除錯及優化大型語言模型 (LLM) 應用程式與 AI agent。它為你的 Google Agent Development Kit (ADK) 應用程式提供完整的追蹤、評估與監控能力。開始使用前，請先註冊[免費帳號](https://app.arize.com/auth/join)。

若你需要開源且可自我託管的替代方案，請參考 [Phoenix](https://arize.com/docs/phoenix)。

## 概覽

Arize AX 可透過 [OpenInference instrumentation](https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-google-adk) 自動從 Google Agent Development Kit (ADK) 收集追蹤資料，讓你能夠：

- **追蹤 agent 互動** — 自動擷取每一次 agent 執行、工具呼叫 (tool calls)、模型請求與回應，並保留相關上下文與中繼資料
- **評估效能** — 使用自訂或內建的評估器來評量 agent 行為，並執行實驗測試 agent 設定
- **生產環境監控** — 建立即時儀表板與警示，追蹤效能狀態
- **除錯問題** — 分析詳細追蹤資料，快速找出瓶頸、失敗的工具呼叫 (tool calls) 及任何異常的 agent 行為

![Agent Traces](https://storage.googleapis.com/arize-phoenix-assets/assets/images/google-adk-traces.png)

## 安裝

請安裝所需套件：

```bash
pip install openinference-instrumentation-google-adk google-adk arize-otel
```

## 設定

### 1. 設定環境變數 { #configure-environment-variables }

設定你的 Google API 金鑰：

```bash
export GOOGLE_API_KEY=[your_key_here]
```

### 2. 將您的應用程式連接到 Arize AX { #connect-your-application-to-arize-ax }

```python
from arize.otel import register

# Register with Arize AX
tracer_provider = register(
    space_id="your-space-id",      # Found in app space settings page
    api_key="your-api-key",        # Found in app space settings page
    project_name="your-project-name"  # Name this whatever you prefer
)

# Import and configure the automatic instrumentor from OpenInference
from openinference.instrumentation.google_adk import GoogleADKInstrumentor

# Finish automatic instrumentation
GoogleADKInstrumentor().instrument(tracer_provider=tracer_provider)
```

## 觀察（Observe）

現在你已經完成追蹤（tracing）設定，所有 Google Agent Development Kit (ADK) SDK 的請求都會串流至 Arize AX，以進行可觀察性（observability）與評估。

```python
import nest_asyncio
nest_asyncio.apply()

from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types

# Define a tool function
def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.

    Args:
        city (str): The name of the city for which to retrieve the weather report.

    Returns:
        dict: status and result or error msg.
    """
    if city.lower() == "new york":
        return {
            "status": "success",
            "report": (
                "The weather in New York is sunny with a temperature of 25 degrees"
                " Celsius (77 degrees Fahrenheit)."
            ),
        }
    else:
        return {
            "status": "error",
            "error_message": f"Weather information for '{city}' is not available.",
        }

# Create an agent with tools
agent = Agent(
    name="weather_agent",
    model="gemini-2.0-flash-exp",
    description="Agent to answer questions using weather tools.",
    instruction="You must use the available tools to find an answer.",
    tools=[get_weather]
)

app_name = "weather_app"
user_id = "test_user"
session_id = "test_session"
runner = InMemoryRunner(agent=agent, app_name=app_name)
session_service = runner.session_service

await session_service.create_session(
    app_name=app_name,
    user_id=user_id,
    session_id=session_id
)

# Run the agent (all interactions will be traced)
async for event in runner.run_async(
    user_id=user_id,
    session_id=session_id,
    new_message=types.Content(role="user", parts=[
        types.Part(text="What is the weather in New York?")]
    )
):
    if event.is_final_response():
        print(event.content.parts[0].text.strip())
```
## 在 Arize AX 中檢視結果
![Traces in Arize AX](https://storage.googleapis.com/arize-phoenix-assets/assets/images/google-adk-dashboard.png)
![Agent Visualization](https://storage.googleapis.com/arize-phoenix-assets/assets/images/google-adk-agent.png)
![Agent Experiments](https://storage.googleapis.com/arize-phoenix-assets/assets/images/google-adk-experiments.png)

## 支援與資源
- [Arize AX 文件說明](https://arize.com/docs/ax/observe/tracing-integrations-auto/google-adk)
- [Arize 社群 Slack](https://arize-ai.slack.com/join/shared_invite/zt-11t1vbu4x-xkBIHmOREQnYnYDH1GDfCg#/shared-invite/email)
- [OpenInference 套件](https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-google-adk)
