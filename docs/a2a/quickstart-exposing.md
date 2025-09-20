# 快速開始：透過 A2A 對外公開遠端 agent

本快速開始涵蓋了每位開發者最常見的起點：**「我已經有一個 agent。我要如何對外公開，讓其他 agent 可以透過 A2A 使用我的 agent？」**。這對於建構複雜的多代理系統（multi-agent system），讓不同 agent 能夠協作與互動至關重要。

## 概覽

本範例展示如何輕鬆對外公開一個 Agent Development Kit (ADK)（ADK）agent，使其能夠被其他 agent 透過 A2A Protocol 使用。

有兩種主要方式可以透過 A2A 對外公開 ADK agent：

* **使用 `to_a2a(root_agent)` 函式**：如果你只是想將現有的 agent 轉換為支援 A2A，並且希望能透過 `uvicorn` 伺服器對外公開（而不是 `adk deploy api_server`），可以使用此函式。這代表當你要將 agent 上線時，能夠更細緻地控制要透過 `uvicorn` 對外公開哪些內容。此外，`to_a2a()` 函式會根據你的 agent 程式碼自動產生 agent card。
* **自行建立 agent card（`agent.json`）並使用 `adk api_server --a2a` 進行託管**：採用這種方式有兩個主要好處。首先，`adk api_server --a2a` 能與 `adk web` 搭配運作，讓你更容易使用、除錯及測試你的 agent。其次，透過 `adk api_server`，你可以指定包含多個獨立 agent 的父資料夾。只要這些 agent 有 agent card（`agent.json`），其他 agent 就能透過同一伺服器自動以 A2A 方式存取。不過，你需要自行建立 agent card。建立 agent card 的方法可參考 [A2A Python tutorial](https://a2a-protocol.org/latest/tutorials/python/1-introduction/)。

本快速開始將著重於 `to_a2a()`，因為這是最簡單的 agent 對外公開方式，且會在背景自動產生 agent card。如果你想採用 `adk api_server` 方式，可以參考 [A2A Quickstart (Consuming) documentation](quickstart-consuming.md)。

```text
Before:
                                                ┌────────────────────┐
                                                │ Hello World Agent  │
                                                │  (Python Object)   │
                                                | without agent card │
                                                └────────────────────┘

                                                          │
                                                          │ to_a2a()
                                                          ▼

After:
┌────────────────┐                             ┌───────────────────────────────┐
│   Root Agent   │       A2A Protocol          │ A2A-Exposed Hello World Agent │
│(RemoteA2aAgent)│────────────────────────────▶│      (localhost: 8001)         │
│(localhost:8000)│                             └───────────────────────────────┘
└────────────────┘
```

此範例包含：

- **Remote Hello World Agent**（`remote_a2a/hello_world/agent.py`）：這是你想要透過 A2A 對外公開，讓其他 agent 可以使用的 agent。它是一個處理擲骰子和質數判斷的 agent。透過 `to_a2a()` 函式來公開，並使用 `uvicorn` 來提供服務。
- **Root Agent**（`agent.py`）：一個簡單的 agent，僅用來呼叫遠端的 Hello World agent。

## 使用 `to_a2a(root_agent)` 函式公開 Remote Agent

你可以將現有使用 Agent Development Kit (ADK) 建立的 agent，僅需用 `to_a2a()` 函式包裝，即可讓其支援 A2A。例如，假設你有一個如下在 `root_agent` 中定義的 agent：

```python
# Your agent code here
root_agent = Agent(
    model='gemini-2.0-flash',
    name='hello_world_agent',
    
    <...your agent code...>
)
```

然後，你只需要使用 `to_a2a(root_agent)`，即可讓它支援 A2A 相容。

```python
from google.adk.a2a.utils.agent_to_a2a import to_a2a

# Make your agent A2A-compatible
a2a_app = to_a2a(root_agent, port=8001)
```

`to_a2a()` 函式甚至會在幕後自動於記憶體中產生一張 agent card，方法是[從 ADK agent 擷取技能、能力與中繼資料](https://github.com/google/adk-python/blob/main/src/google/adk/a2a/utils/agent_card_builder.py)，因此當使用 `uvicorn` 提供 agent endpoint 時，會自動提供 well-known agent card。

現在讓我們來深入了解範例程式碼。

### 1. 取得範例程式碼 { #getting-the-sample-code }

首先，請確保你已安裝所需的相依套件：

```bash
pip install google-adk[a2a]
```

你可以在這裡複製並前往 [**a2a_root** 範例](https://github.com/google/adk-python/tree/main/contributing/samples/a2a_root)：

```bash
git clone https://github.com/google/adk-python.git
```

如您所見，資料夾結構如下：

```text
a2a_root/
├── remote_a2a/
│   └── hello_world/    
│       ├── __init__.py
│       └── agent.py    # Remote Hello World Agent
├── README.md
└── agent.py            # Root agent
```

#### Root Agent (`a2a_root/agent.py`)

- **`root_agent`**：一個`RemoteA2aAgent`，用於連接遠端 A2A 服務
- **Agent Card URL**：指向遠端伺服器上的 well-known agent card 端點

#### Remote Hello World Agent (`a2a_root/remote_a2a/hello_world/agent.py`)

- **`roll_die(sides: int)`**：具備狀態管理的擲骰子 Function tool（工具函式）
- **`check_prime(nums: list[int])`**：用於質數判斷的 async 函式
- **`root_agent`**：具備完整指令說明的主要 agent
- **`a2a_app`**：使用`to_a2a()`工具建立的 A2A 應用程式

### 2. 啟動遠端 A2A Agent 伺服器 { #start-the-remote-a2a-agent-server }

你現在可以啟動遠端 agent 伺服器，該伺服器將在 hello_world agent 中託管`a2a_app`：

```bash
# Ensure current working directory is adk-python/
# Start the remote agent using uvicorn
uvicorn contributing.samples.a2a_root.remote_a2a.hello_world.agent:a2a_app --host localhost --port 8001
```

??? note "為什麼要使用 8001 埠口？"
    在本快速開始中，當你在本機測試時，代理（agent）會使用 localhost，因此用於暴露代理（遠端 prime agent）的 A2A 伺服器的 `port` 必須與消費端代理所使用的埠口不同。你將與消費端代理互動的 `adk web` 預設埠口是 `8000`，這也是為什麼 A2A 伺服器會使用另一個獨立埠口 `8001` 來建立。

執行後，你應該會看到類似以下的畫面：

```shell
INFO:     Started server process [10615]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8001 (Press CTRL+C to quit)
```

### 3. 檢查你的遠端 agent 是否正在運行 { #check-that-your-remote-agent-is-running }

你可以透過造訪先前在 `a2a_root/remote_a2a/hello_world/agent.py` 中由你的 `to_a2a()` 函式自動產生的 agent 卡片，來確認你的 agent 是否已經啟動並正在運行：

[http://localhost:8001/.well-known/agent-card.json](http://localhost:8001/.well-known/agent-card.json)

你應該會看到 agent 卡片的內容，畫面應如下所示：

```json
{"capabilities":{},"defaultInputModes":["text/plain"],"defaultOutputModes":["text/plain"],"description":"hello world agent that can roll a dice of 8 sides and check prime numbers.","name":"hello_world_agent","protocolVersion":"0.2.6","skills":[{"description":"hello world agent that can roll a dice of 8 sides and check prime numbers. \n      I roll dice and answer questions about the outcome of the dice rolls.\n      I can roll dice of different sizes.\n      I can use multiple tools in parallel by calling functions in parallel(in one request and in one round).\n      It is ok to discuss previous dice roles, and comment on the dice rolls.\n      When I are asked to roll a die, I must call the roll_die tool with the number of sides. Be sure to pass in an integer. Do not pass in a string.\n      I should never roll a die on my own.\n      When checking prime numbers, call the check_prime tool with a list of integers. Be sure to pass in a list of integers. I should never pass in a string.\n      I should not check prime numbers before calling the tool.\n      When I are asked to roll a die and check prime numbers, I should always make the following two function calls:\n      1. I should first call the roll_die tool to get a roll. Wait for the function response before calling the check_prime tool.\n      2. After I get the function response from roll_die tool, I should call the check_prime tool with the roll_die result.\n        2.1 If user asks I to check primes based on previous rolls, make sure I include the previous rolls in the list.\n      3. When I respond, I must include the roll_die result from step 1.\n      I should always perform the previous 3 steps when asking for a roll and checking prime numbers.\n      I should not rely on the previous history on prime results.\n    ","id":"hello_world_agent","name":"model","tags":["llm"]},{"description":"Roll a die and return the rolled result.\n\nArgs:\n  sides: The integer number of sides the die has.\n  tool_context: the tool context\nReturns:\n  An integer of the result of rolling the die.","id":"hello_world_agent-roll_die","name":"roll_die","tags":["llm","tools"]},{"description":"Check if a given list of numbers are prime.\n\nArgs:\n  nums: The list of numbers to check.\n\nReturns:\n  A str indicating which number is prime.","id":"hello_world_agent-check_prime","name":"check_prime","tags":["llm","tools"]}],"supportsAuthenticatedExtendedCard":false,"url":"http://localhost:8001","version":"0.0.1"}
```

### 4. 執行主（消費端）agent { #run-the-main-consuming-agent }

現在您的遠端 agent 已經在運行，可以啟動開發 UI，並選擇「a2a_root」作為您的 agent。

```bash
# In a separate terminal, run the adk web server
adk web contributing/samples/
```

要開啟 adk web 伺服器，請前往：[http://localhost:8000](http://localhost:8000)。

## 範例互動

當兩個服務都在執行時，你可以與 root agent 互動，觀察它如何透過 A2A 呼叫遠端 agent：

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

**複合操作：**

此互動同時使用本機 Roll Agent 與遠端 Prime Agent：

```text
User: Roll a 10-sided die and check if it's prime
Bot: I rolled an 8 for you.
Bot: 8 is not a prime number.
```

## 下一步

現在你已經建立了一個透過 A2A server 對外公開遠端 agent 的 agent，下一步可以學習如何從另一個 agent 來存取它。

- [**A2A 快速開始（消費端）**](./quickstart-consuming.md)：了解你的 agent 如何透過 A2A Protocol 使用其他 agent。
