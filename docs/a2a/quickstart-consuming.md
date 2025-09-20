# 快速開始：透過 A2A 使用遠端 agent

本快速開始涵蓋了每位開發者最常見的起點：**「有一個遠端 agent，我要如何讓我的 Agent Development Kit (ADK) agent 透過 A2A 使用它？」**。這對於建構複雜的多 agent 系統、讓不同 agent 能夠協作與互動至關重要。

## 概述

本範例展示了 Agent Development Kit (ADK) 中的 **Agent-to-Agent (A2A)** 架構，說明多個 agent 如何協同處理複雜任務。範例實作了一個能擲骰子並檢查數字是否為質數的 agent。

```text
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Root Agent    │───▶│   Roll Agent     │    │   Remote Prime     │
│  (Local)        │    │   (Local)        │    │   Agent            │
│                 │    │                  │    │  (localhost:8001)  │
│                 │───▶│                  │◀───│                    │
└─────────────────┘    └──────────────────┘    └────────────────────┘
```

A2A Basic 範例包含以下組件：

- **Root Agent**（`root_agent`）：主要的協調者，負責將任務分派給專門的子 agent
- **Roll Agent**（`roll_agent`）：本機子 agent，負責擲骰子的操作
- **Prime Agent**（`prime_agent`）：遠端的 A2A agent，負責判斷數字是否為質數，此 agent 執行於另一個獨立的 A2A 伺服器上

## 使用 ADK 伺服器公開你的 agent

  Agent Development Kit (ADK) 提供了內建的命令列介面 (Command Line Interface) 指令 `adk api_server --a2a`，可用於透過 A2A 協定公開你的 agent。

  在 `a2a_basic` 範例中，你需要先透過 A2A 伺服器公開 `check_prime_agent`，以便本機的 Root Agent 能夠使用它。

### 1. 取得範例程式碼 { #getting-the-sample-code }

首先，請確認你已安裝所有必要的相依套件：

```bash
pip install google-adk[a2a]
```

你可以在這裡複製並前往 [**`a2a_basic`** 範例](https://github.com/google/adk-python/tree/main/contributing/samples/a2a_basic)：

```bash
git clone https://github.com/google/adk-python.git
```

如您所見，資料夾結構如下：

```text
a2a_basic/
├── remote_a2a/
│   └── check_prime_agent/
│       ├── __init__.py
│       ├── agent.json
│       └── agent.py
├── README.md
├── __init__.py
└── agent.py # local root agent
```

#### 主 Agent (`a2a_basic/agent.py`)

- **`roll_die(sides: int)`**：擲骰子功能工具函式
- **`roll_agent`**：專門處理擲骰子的本地 agent
- **`prime_agent`**：遠端 A2A agent 設定
- **`root_agent`**：具備委派邏輯的主協調者

#### 遠端質數 Agent (`a2a_basic/remote_a2a/check_prime_agent/`)

- **`agent.py`**：質數檢查服務的實作
- **`agent.json`**：A2A agent 的 agent card
- **`check_prime(nums: list[int])`**：質數檢查演算法

### 2. 啟動遠端質數 Agent 伺服器 { #start-the-remote-prime-agent-server }

為了展示你的 Agent Development Kit (ADK) agent 如何透過 A2A 消費遠端 agent，你需要先啟動一個遠端 agent 伺服器，該伺服器將託管質數 agent（位於 `check_prime_agent`）。

```bash
# Start the remote a2a server that serves the check_prime_agent on port 8001
adk api_server --a2a --port 8001 contributing/samples/a2a_basic/remote_a2a
```

??? note "為 `--log_level debug` 新增除錯用的日誌紀錄"
    若要啟用 debug 等級的日誌紀錄，您可以在 `adk api_server` 中加入 `--log_level debug`，例如：
    ```bash
    adk api_server --a2a --port 8001 contributing/samples/a2a_basic/remote_a2a --log_level debug
    ```
    這將為你在測試 agent 時，提供更豐富的日誌以便檢查。

??? note "為什麼要使用 8001 埠口？"
    在本次快速開始（Quickstart）中，當你在本機測試時，agent 會使用 localhost，因此對於公開的 agent（遠端的 prime agent）所使用的 A2A 伺服器的 `port` 必須與消費端 agent 的埠口不同。你將與消費端 agent 互動的 `adk web` 預設埠口是 `8000`，這也是為什麼 A2A 伺服器會使用另一個獨立的埠口 `8001` 來建立。

執行後，你應該會看到類似以下的內容：

``` shell
INFO:     Started server process [56558]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```
  
### 3. 留意遠端 agent 所需的 agent card（`agent-card.json`） { #look-out-for-the-required-agent-card-agent-json-of-the-remote-agent }

A2A Protocol 要求每個 agent 都必須有一個 agent card，用來描述其功能。

如果你要在自己的 agent 中串接他人已經建置好的遠端 A2A agent，請確認對方是否有提供 agent card（`agent-card.json`）。

在此範例中，`check_prime_agent` 已經有提供 agent card：

```json title="a2a_basic/remote_a2a/check_prime_agent/agent-card.json"

{
  "capabilities": {},
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["application/json"],
  "description": "An agent specialized in checking whether numbers are prime. It can efficiently determine the primality of individual numbers or lists of numbers.",
  "name": "check_prime_agent",
  "skills": [
    {
      "id": "prime_checking",
      "name": "Prime Number Checking",
      "description": "Check if numbers in a list are prime using efficient mathematical algorithms",
      "tags": ["mathematical", "computation", "prime", "numbers"]
    }
  ],
  "url": "http://localhost:8001/a2a/check_prime_agent",
  "version": "1.0.0"
}
```

??? note "更多有關 Agent Development Kit (ADK) 中 agent 卡片的資訊"

    In ADK, you can use a `to_a2a(root_agent)` wrapper which automatically generates an agent card for you. If you're interested in learning more about how to expose your existing agent so others can use it, then please look at the [A2A Quickstart (Exposing)](quickstart-exposing.md) tutorial. 

### 4. 執行主（消費）agent { #run-the-main-consuming-agent }

  ```bash
  # In a separate terminal, run the adk web server
  adk web contributing/samples/
  ```

#### 運作原理

主要的 agent 會使用 `RemoteA2aAgent()` 函式來消費遠端 agent（在本範例中為 `prime_agent`）。如下面所示，`RemoteA2aAgent()` 需要 `name`、`description`，以及 `agent_card` 的 URL。

```python title="a2a_basic/agent.py"
<...code truncated...>

from google.adk.agents.remote_a2a_agent import AGENT_CARD_WELL_KNOWN_PATH
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

prime_agent = RemoteA2aAgent(
    name="prime_agent",
    description="Agent that handles checking if numbers are prime.",
    agent_card=(
        f"http://localhost:8001/a2a/check_prime_agent{AGENT_CARD_WELL_KNOWN_PATH}"
    ),
)

<...code truncated>
```

然後，你就可以在你的 agent 中直接使用 `RemoteA2aAgent`。在此範例中，`prime_agent` 作為 `root_agent` 中的一個子 agent 被使用，如下所示：

```python title="a2a_basic/agent.py"
from google.adk.agents.llm_agent import Agent
from google.genai import types

root_agent = Agent(
    model="gemini-2.0-flash",
    name="root_agent",
    instruction="""
      <You are a helpful assistant that can roll dice and check if numbers are prime.
      You delegate rolling dice tasks to the roll_agent and prime checking tasks to the prime_agent.
      Follow these steps:
      1. If the user asks to roll a die, delegate to the roll_agent.
      2. If the user asks to check primes, delegate to the prime_agent.
      3. If the user asks to roll a die and then check if the result is prime, call roll_agent first, then pass the result to prime_agent.
      Always clarify the results before proceeding.>
    """,
    global_instruction=(
        "You are DicePrimeBot, ready to roll dice and check prime numbers."
    ),
    sub_agents=[roll_agent, prime_agent],
    tools=[example_tool],
    generate_content_config=types.GenerateContentConfig(
        safety_settings=[
            types.SafetySetting(  # avoid false alarm about rolling dice.
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
        ]
    ),
)
```

## 範例互動

當你的主 agent 和遠端 agent 都已經運行後，你可以與 root agent 互動，觀察它如何透過 A2A 呼叫遠端 agent：

**簡單擲骰子：**  
這個互動會使用本機 agent，也就是 Roll Agent：

```text
User: Roll a 6-sided die
Bot: I rolled a 4 for you.
```

**質數檢查：**

此互動會透過 A2A 使用遠端 agent——Prime Agent：

```text
User: Is 7 a prime number?
Bot: Yes, 7 is a prime number.
```

**綜合操作：**

此互動同時使用本機的 Roll Agent 以及遠端的 Prime Agent：

```text
User: Roll a 10-sided die and check if it's prime
Bot: I rolled an 8 for you.
Bot: 8 is not a prime number.
```

## 下一步

現在你已經建立了一個透過 A2A 伺服器使用遠端 agent 的 agent，接下來的步驟是學習如何從另一個 agent 連接到它。

- [**A2A 快速開始（公開）**](./quickstart-exposing.md)：學習如何將你現有的 agent 透過 A2A Protocol 公開，讓其他 agent 可以使用。
