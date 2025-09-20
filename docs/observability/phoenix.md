# 使用 Phoenix 進行 Agent Observability

[Phoenix](https://arize.com/docs/phoenix) 是一個開源、自行架設的可觀測性平台，可用於大規模監控、除錯與優化大型語言模型 (LLM) 應用程式與 AI agent。Phoenix 為你的 Google Agent Development Kit (ADK) 應用程式提供完整的追蹤與評估功能。你可以先註冊一個[免費帳號](https://phoenix.arize.com/)開始使用。

## 概覽

Phoenix 能夠透過 [OpenInference instrumentation](https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-google-adk) 自動從 Google Agent Development Kit (ADK) 收集追蹤資料，讓你可以：

- **追蹤 agent 互動** — 自動擷取每一次 agent 執行、工具呼叫 (tool calls)、模型請求與回應，並保留完整上下文與中繼資料
- **評估效能** — 使用自訂或內建評估器來評估 agent 行為，並執行實驗以測試 agent 設定
- **除錯問題** — 分析詳細的追蹤資料，快速找出瓶頸、失敗的工具呼叫 (tool calls) 以及非預期的 agent 行為
- **自行架設控制** — 將資料保留在你自己的基礎架構上

## 安裝

### 1. 安裝必要套件 { #install-required-packages }

```bash
pip install openinference-instrumentation-google-adk google-adk arize-phoenix-otel
```

## 設定

### 1. 啟動 Phoenix { #launch-phoenix }

以下說明將指引你如何使用 Phoenix Cloud。你也可以在 notebook、終端機中 [啟動 Phoenix](https://arize.com/docs/phoenix/integrations/llm-providers/google-gen-ai/google-adk-tracing)，或是透過容器自行架設。

1. 註冊一個 [免費的 Phoenix 帳號](https://phoenix.arize.com/)。
2. 在新的 Phoenix Space 的設定頁面中，建立你的 API KEY。
3. 複製你的 endpoint，格式應如下所示：https://app.phoenix.arize.com/s/[your-space-name]

**設定你的 Phoenix endpoint 與 API KEY：**

```python
import os

os.environ["PHOENIX_API_KEY"] = "ADD YOUR PHOENIX API KEY"
os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "ADD YOUR PHOENIX COLLECTOR ENDPOINT"

# If you created your Phoenix Cloud instance before June 24th, 2025, set the API key as a header:
# os.environ["PHOENIX_CLIENT_HEADERS"] = f"api_key={os.getenv('PHOENIX_API_KEY')}"
```

### 2.  將您的應用程式連接至 Phoenix { #connect-your-application-to-phoenix }

```python
from phoenix.otel import register

# Configure the Phoenix tracer
tracer_provider = register(
    project_name="my-llm-app",  # Default is 'default'
    auto_instrument=True        # Auto-instrument your app based on installed OI dependencies
)
```

## 觀察（Observe）

現在你已經完成追蹤（tracing）設定，所有 Google Agent Development Kit (ADK) SDK 的請求都會被串流至 Phoenix 進行可觀察性（observability）與評估。

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

## 支援與資源
- [Phoenix 文件說明](https://arize.com/docs/phoenix/integrations/llm-providers/google-gen-ai/google-adk-tracing)
- [社群 Slack](https://arize-ai.slack.com/join/shared_invite/zt-11t1vbu4x-xkBIHmOREQnYnYDH1GDfCg#/shared-invite/email)
- [OpenInference 套件](https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-google-adk)
