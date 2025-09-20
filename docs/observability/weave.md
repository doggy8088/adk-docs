# 使用 Weave by WandB 進行 Agent 可觀測性

[Weave by Weights & Biases (WandB)](https://weave-docs.wandb.ai/) 提供了一個強大的平台，用於記錄和視覺化模型呼叫。透過將 Google Agent Development Kit (ADK) 與 Weave 整合，您可以利用 OpenTelemetry (OTEL) 追蹤來追蹤並分析您的 agent 執行效能與行為。

## 先決條件

1. 請至 [WandB](https://wandb.ai) 註冊帳號。

2. 從 [WandB Authorize](https://wandb.ai/authorize) 取得您的 API KEY。

3. 使用所需的 API KEY 設定您的環境：

   ```bash
   export WANDB_API_KEY=<your-wandb-api-key>
   export GOOGLE_API_KEY=<your-google-api-key>
   ```

## 安裝相依套件

請確保您已安裝必要的套件：

```bash
pip install google-adk opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

## 傳送追蹤資料到 Weave

本範例說明如何設定 OpenTelemetry，將 Google Agent Development Kit (ADK)（ADK）的追蹤資料傳送至 Weave。

```python
# math_agent/agent.py

import base64
import os
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk import trace as trace_sdk
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry import trace

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from dotenv import load_dotenv

load_dotenv()

# Configure Weave endpoint and authentication
WANDB_BASE_URL = "https://trace.wandb.ai"
PROJECT_ID = "your-entity/your-project"  # e.g., "teamid/projectid"
OTEL_EXPORTER_OTLP_ENDPOINT = f"{WANDB_BASE_URL}/otel/v1/traces"

# Set up authentication
WANDB_API_KEY = os.getenv("WANDB_API_KEY")
AUTH = base64.b64encode(f"api:{WANDB_API_KEY}".encode()).decode()

OTEL_EXPORTER_OTLP_HEADERS = {
    "Authorization": f"Basic {AUTH}",
    "project_id": PROJECT_ID,
}

# Create the OTLP span exporter with endpoint and headers
exporter = OTLPSpanExporter(
    endpoint=OTEL_EXPORTER_OTLP_ENDPOINT,
    headers=OTEL_EXPORTER_OTLP_HEADERS,
)

# Create a tracer provider and add the exporter
tracer_provider = trace_sdk.TracerProvider()
tracer_provider.add_span_processor(SimpleSpanProcessor(exporter))

# Set the global tracer provider BEFORE importing/using ADK
trace.set_tracer_provider(tracer_provider)

# Define a simple tool for demonstration
def calculator(a: float, b: float) -> str:
    """Add two numbers and return the result.

    Args:
        a: First number
        b: Second number

    Returns:
        The sum of a and b
    """
    return str(a + b)

calculator_tool = FunctionTool(func=calculator)

# Create an LLM agent
root_agent = LlmAgent(
    name="MathAgent",
    model="gemini-2.0-flash-exp",
    instruction=(
        "You are a helpful assistant that can do math. "
        "When asked a math problem, use the calculator tool to solve it."
    ),
    tools=[calculator_tool],
)
```

## 在 Weave 儀表板中檢視追蹤紀錄

當 agent 執行後，所有的追蹤紀錄都會被記錄到對應專案的 [Weave 儀表板](https://wandb.ai/home)。

![Traces in Weave](https://wandb.github.io/weave-public-assets/google-adk/traces-overview.png)

你可以在這裡查看你的 Agent Development Kit (ADK) agent 執行期間所發出的呼叫時間軸——

![Timeline view](https://wandb.github.io/weave-public-assets/google-adk/adk-weave-timeline.gif)


## 注意事項

- **環境變數**：請確保你的 WandB 與 Google API 金鑰的環境變數都已正確設定。
- **專案設定**：請將 `<your-entity>/<your-project>` 替換為你實際的 WandB entity 與專案名稱。
- **Entity 名稱**：你可以在 [WandB 儀表板](https://wandb.ai/home) 左側邊欄的 **Teams** 欄位找到你的 entity 名稱。
- **Tracer Provider**：在使用任何 ADK 元件之前，務必先設定全域 tracer provider，以確保追蹤功能正常。

依照上述步驟，你可以有效地將 Google Agent Development Kit (ADK) 與 Weave 整合，實現 AI agent 的模型呼叫、工具調用與推理過程的完整日誌記錄與視覺化。

## 相關資源

- **[將 OpenTelemetry 追蹤資料發送至 Weave](https://weave-docs.wandb.ai/guides/tracking/otel)** - 詳細說明如何將 OTEL 與 Weave 配置，包括驗證與進階設定選項。

- **[瀏覽追蹤檢視畫面](https://weave-docs.wandb.ai/guides/tracking/trace-tree)** - 學習如何在 Weave UI 中有效分析與除錯你的追蹤紀錄，包括理解追蹤階層與 span 細節。

- **[Weave 整合](https://weave-docs.wandb.ai/guides/integrations/)** - 探索其他框架整合方式，了解 Weave 如何與你的整個 AI 技術堆疊協同運作。