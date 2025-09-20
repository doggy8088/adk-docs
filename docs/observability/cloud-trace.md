# 使用 Cloud Trace 監控 Agent Observability

透過 Agent Development Kit (ADK)，你已經能夠利用[這裡](https://doggy8088.github.io/adk-docs/evaluate/#debugging-with-the-trace-view)介紹的強大網頁開發 UI，在本機檢查並觀察 agent 的互動。然而，若目標是雲端部署，我們則需要一個集中式儀表板來觀察實際流量。

Cloud Trace 是 Google Cloud Observability 的一個組件。它是一款專注於追蹤（tracing）功能的強大工具，可用於監控、除錯，以及提升應用程式效能。對於 Agent Development Kit (ADK) 應用來說，Cloud Trace 能夠提供完整的追蹤能力，協助你了解請求如何流經 agent 的互動流程，並找出 AI agent 中的效能瓶頸或錯誤。

## 概覽

Cloud Trace 建構於 [OpenTelemetry](https://opentelemetry.io/) 之上，這是一個支援多種語言與資料收集方式的開源標準。這與 Agent Development Kit (ADK) 應用的可觀測性實踐相符，ADK 也採用與 OpenTelemetry 相容的儀器化方式，讓你可以：

- 追蹤 agent 互動：Cloud Trace 持續從你的專案收集並分析追蹤資料，讓你能快速診斷 ADK 應用中的延遲問題與錯誤。這種自動化資料收集，簡化了在複雜 agent 工作流程中找出問題的過程。
- 除錯問題：透過分析詳細的追蹤資料，能快速診斷延遲問題與錯誤。這對於理解跨服務溝通延遲增加，或在特定 agent 行為（如工具呼叫 (tool calls)）期間出現的問題尤其重要。
- 深入分析與視覺化：Trace Explorer 是分析追蹤資料的主要工具，提供如 span 持續時間熱圖、請求/錯誤率折線圖等視覺化輔助工具。它也提供可依服務與操作分組的 spans 表格，讓你一鍵存取代表性追蹤，以及瀑布圖視圖，方便快速找出 agent 執行路徑中的瓶頸與錯誤來源。

以下範例將假設你的 agent 目錄結構如下：

```
working_dir/
├── weather_agent/
│   ├── agent.py
│   └── __init__.py
└── deploy_agent_engine.py
└── deploy_fast_api_app.py
└── agent_runner.py
```

```python
# weather_agent/agent.py

import os
from google.adk.agents import Agent

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "{your-project-id}")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")


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
root_agent = Agent(
    name="weather_agent",
    model="gemini-2.5-flash",
    description="Agent to answer questions using weather tools.",
    instruction="You must use the available tools to find an answer.",
    tools=[get_weather],
)
```

## Cloud Trace 設定

### Agent Engine 部署設定

#### 透過 ADK CLI 進行 Agent Engine 部署

當你使用 `adk deploy agent_engine` 指令部署 agent engine 時，可以加入 `--trace_to_cloud` 旗標來啟用 cloud tracing。

```bash
adk deploy agent_engine \
    --project=$GOOGLE_CLOUD_PROJECT \
    --region=$GOOGLE_CLOUD_LOCATION \
    --staging_bucket=$STAGING_BUCKET \
    --trace_to_cloud \
    $AGENT_PATH
```

#### Agent Engine 部署 - 使用 Python SDK

如果你偏好使用 Python SDK，可以在初始化 `AdkApp` 物件時加入 `enable_tracing=True`，以啟用雲端追蹤（cloud tracing）。

```python
# deploy_agent_engine.py

from vertexai.preview import reasoning_engines
from vertexai import agent_engines
from weather_agent.agent import root_agent

import vertexai

PROJECT_ID = "{your-project-id}"
LOCATION = "{your-preferred-location}"
STAGING_BUCKET = "{your-staging-bucket}"

vertexai.init(
    project=PROJECT_ID,
    location=LOCATION,
    staging_bucket=STAGING_BUCKET,
)

adk_app = reasoning_engines.AdkApp(
    agent=root_agent,
    enable_tracing=True,
)


remote_app = agent_engines.create(
    agent_engine=adk_app,
    extra_packages=[
        "./weather_agent",
    ],
    requirements=[
        "google-cloud-aiplatform[adk,agent_engines]",
    ],
)
```

### Cloud Run 部署設定

#### 透過 ADK CLI 進行 Cloud Run 部署

當你使用 `adk deploy cloud_run` 命令進行 Cloud Run 部署時，只需加上 `--trace_to_cloud` 旗標，即可啟用雲端追蹤功能。

```bash
adk deploy cloud_run \
    --project=$GOOGLE_CLOUD_PROJECT \
    --region=$GOOGLE_CLOUD_LOCATION \
    --trace_to_cloud \
    $AGENT_PATH
```

如果你想啟用 cloud tracing（雲端追蹤），並且在 Cloud Run 上使用自訂的 agent 服務部署，可以參考下方的 [Setup for Customized Deployment](#setup-for-customized-deployment) 章節。

### Setup for Customized Deployment

#### 從內建的 `get_fast_api_app` 模組

如果你想自訂自己的 agent 服務，可以透過使用內建的 `get_fast_api_app` 模組來初始化 FastAPI 應用程式，並設定 `trace_to_cloud=True`，以啟用 cloud tracing。

```python
# deploy_fast_api_app.py

import os
from google.adk.cli.fast_api import get_fast_api_app
from fastapi import FastAPI

# Set GOOGLE_CLOUD_PROJECT environment variable for cloud tracing
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "alvin-exploratory-2")

# Discover the `weather_agent` directory in current working dir
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Create FastAPI app with enabled cloud tracing
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    trace_to_cloud=True,
)

app.title = "weather-agent"
app.description = "API for interacting with the Agent weather-agent"


# Main execution
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
```


#### 從自訂 Agent Runner

如果你希望完全自訂你的 Agent Development Kit (ADK) agent 執行環境，可以透過使用 Opentelemetry 的 `CloudTraceSpanExporter` 模組來啟用雲端追蹤（cloud tracing）。

```python
# agent_runner.py

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from weather_agent.agent import root_agent as weather_agent
from google.genai.types import Content, Part
from opentelemetry import trace
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
from opentelemetry.sdk.trace import export
from opentelemetry.sdk.trace import TracerProvider

APP_NAME = "weather_agent"
USER_ID = "u_123"
SESSION_ID = "s_123"

provider = TracerProvider()
processor = export.BatchSpanProcessor(
    CloudTraceSpanExporter(project_id="{your-project-id}")
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

session_service = InMemorySessionService()
runner = Runner(agent=weather_agent, app_name=APP_NAME, session_service=session_service)


async def main():
    session = await session_service.get_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    if session is None:
        session = await session_service.create_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
        )

    user_content = Content(
        role="user", parts=[Part(text="what's weather in paris?")]
    )

    final_response_content = "No response"
    async for event in runner.run_async(
        user_id=USER_ID, session_id=SESSION_ID, new_message=user_content
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_response_content = event.content.parts[0].text

    print(final_response_content)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
```

## 檢視 Cloud Trace 追蹤紀錄

完成設定後，每當你與 agent 互動時，系統會自動將追蹤資料傳送到 Cloud Trace。你可以前往 [console.cloud.google.com](https://console.cloud.google.com)，並在已設定的 Google Cloud 專案中造訪 Trace Explorer 來檢視這些追蹤紀錄。

![cloud-trace](../assets/cloud-trace1.png)

接著，你將會看到所有由 Agent Development Kit (ADK) agent 所產生的可用追蹤紀錄，這些追蹤會以多個 span 名稱顯示，例如 `invocation`、`agent_run`、`call_llm` 和 `execute_tool`。

![cloud-trace](../assets/cloud-trace2.png)

如果你點擊其中一筆追蹤紀錄，將會看到詳細流程的瀑布圖（waterfall view），這與我們在網頁開發 UI 中使用 `adk web` 指令時所見的畫面類似。

![cloud-trace](../assets/cloud-trace3.png)

## 相關資源

- [Google Cloud Trace 文件說明](https://cloud.google.com/trace)
