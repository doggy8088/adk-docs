# 快速開始：透過 A2A 將遠端 agent 對外公開

本快速開始涵蓋了每位開發者最常見的起點：「**我已經有一個 agent。我要如何將它對外公開，讓其他 agent 能夠透過 A2A 使用我的 agent？**」這對於建構複雜的多 agent 系統（multi-agent systems），讓不同 agent 能夠協作與互動至關重要。

## 概覽

本範例說明如何輕鬆將一個 Agent Development Kit (ADK) agent 對外公開，讓其他 agent 可以透過 A2A Protocol 來存取。

有兩種主要方式可以透過 A2A 將 ADK agent 對外公開：

* **使用 `to_a2a(root_agent)` 函式**：如果你只想將現有的 agent 轉換為支援 A2A，並且希望透過 `uvicorn` 以伺服器方式對外公開（而非 `adk deploy api_server`），可以選擇這個方法。這代表你可以更精細地控制要透過 `uvicorn` 對外公開哪些功能，特別是在將 agent 部署到正式環境時。此外，`to_a2a()` 函式會根據你的 agent 程式碼自動產生 agent card。
* **自行建立 agent card（`agent.json`）並使用 `adk api_server --a2a` 來託管**：這種方式有兩大優點。首先，`adk api_server --a2a` 可與 `adk web` 搭配運作，使你能更輕鬆地使用、除錯與測試 agent。其次，透過 `adk api_server`，你可以指定一個父資料夾，裡面包含多個獨立的 agent。只要這些 agent 有 agent card（`agent.json`），其他 agent 就能透過同一個伺服器自動以 A2A 方式存取。不過，你需要自行建立 agent card。關於如何建立 agent card，可以參考 [A2A Python 教學](https://a2a-protocol.org/latest/tutorials/python/1-introduction/)。

本快速開始將著重於 `to_a2a()`，因為這是最簡單的 agent 對外公開方式，且會在背景自動產生 agent card。如果你想採用 `adk api_server` 方式，可以參考 [A2A 快速開始（消費端）文件](quickstart-consuming.md)。

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

本範例包含：

- **Remote Hello World Agent**（`remote_a2a/hello_world/agent.py`）：這是你希望透過 A2A 對外公開，讓其他 agent 可以使用的 agent。它是一個負責擲骰子與質數檢查的 agent。透過 `to_a2a()` 函式進行公開，並以 `uvicorn` 來服務。
- **Root Agent**（`agent.py`）：這是一個簡單的 agent，僅用來呼叫遠端的 Hello World agent。

## 使用 `to_a2a(root_agent)` 函式公開遠端 agent

你可以將既有、使用 Agent Development Kit (ADK) 建立的 agent，透過簡單地用 `to_a2a()` 函式包裝，使其支援 A2A。例如，假設你有一個如下所示、定義在 `root_agent` 的 agent：

```python
# Your agent code here
root_agent = Agent(
    model='gemini-2.0-flash',
    name='hello_world_agent',
    
    <...your agent code...>
)
```

然後，你只需要使用 `to_a2a(root_agent)`，即可讓它相容於 A2A：

```python
from google.adk.a2a.utils.agent_to_a2a import to_a2a

# Make your agent A2A-compatible
a2a_app = to_a2a(root_agent, port=8001)
```

`to_a2a()` 函式甚至會在幕後自動於記憶體中產生一張 agent 卡片，方法是[從 Agent Development Kit (ADK) agent 中擷取技能、能力與中繼資料](https://github.com/google/adk-python/blob/main/src/google/adk/a2a/utils/agent_card_builder.py)，因此當使用 `uvicorn` 提供 agent 端點時，會自動提供 well-known agent 卡片。

現在讓我們深入了解範例程式碼。

### 1. 取得範例程式碼 { #getting-the-sample-code }

首先，請確保你已安裝必要的相依套件：

```bash
pip install google-adk[a2a]
```

你可以在這裡複製（clone）並前往 [**a2a_root** 範例](https://github.com/google/adk-python/tree/main/contributing/samples/a2a_root)：

```bash
git clone https://github.com/google/adk-python.git
```

如你所見，資料夾結構如下：

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

- **`root_agent`**：一個`RemoteA2aAgent`，用於連接到遠端的 A2A 服務
- **Agent Card URL**：指向遠端伺服器上的 well-known agent card endpoint

#### 遠端 Hello World Agent (`a2a_root/remote_a2a/hello_world/agent.py`)

- **`roll_die(sides: int)`**：具備狀態管理的擲骰子工具函式
- **`check_prime(nums: list[int])`**：用於質數判斷的 async 函式
- **`root_agent`**：具備完整指令的主要 agent
- **`a2a_app`**：使用`to_a2a()`工具建立的 A2A 應用程式

### 2. 啟動遠端 A2A Agent 伺服器 { #start-the-remote-a2a-agent-server }

您現在可以啟動遠端 agent 伺服器，該伺服器將在 hello_world agent 中託管`a2a_app`：

```bash
# Ensure current working directory is adk-python/
# Start the remote agent using uvicorn
uvicorn contributing.samples.a2a_root.remote_a2a.hello_world.agent:a2a_app --host localhost --port 8001
```

??? note "為什麼使用 8001 埠號？"
    在本快速開始中，當你在本機測試時，你的 agent 會使用 localhost，因此用於 exposed agent（遠端、prime agent）的 A2A 伺服器的 `port` 必須與 consuming agent 的埠號不同。你將與 consuming agent 互動的 `adk web` 預設埠號為 `8000`，這也是為什麼 A2A 伺服器會使用另一個獨立的埠號 `8001` 來建立。

執行後，你應該會看到類似以下的內容：

```shell
INFO:     Started server process [10615]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8001 (Press CTRL+C to quit)
```

### 3. 檢查你的遠端 agent 是否正在運行 { #check-that-your-remote-agent-is-running }

你可以透過造訪在 `a2a_root/remote_a2a/hello_world/agent.py` 中，作為 `to_a2a()` 函式的一部分自動產生的 agent 卡片，來確認你的 agent 是否已經啟動並運行：

[http://localhost:8001/.well-known/agent-card.json](http://localhost:8001/.well-known/agent-card.json)

你應該會看到 agent 卡片的內容，畫面應如下所示：

```json
{"capabilities":{},"defaultInputModes":["text/plain"],"defaultOutputModes":["text/plain"],"description":"hello world agent that can roll a dice of 8 sides and check prime numbers.","name":"hello_world_agent","protocolVersion":"0.2.6","skills":[{"description":"hello world agent that can roll a dice of 8 sides and check prime numbers. \n      I roll dice and answer questions about the outcome of the dice rolls.\n      I can roll dice of different sizes.\n      I can use multiple tools in parallel by calling functions in parallel(in one request and in one round).\n      It is ok to discuss previous dice roles, and comment on the dice rolls.\n      When I are asked to roll a die, I must call the roll_die tool with the number of sides. Be sure to pass in an integer. Do not pass in a string.\n      I should never roll a die on my own.\n      When checking prime numbers, call the check_prime tool with a list of integers. Be sure to pass in a list of integers. I should never pass in a string.\n      I should not check prime numbers before calling the tool.\n      When I are asked to roll a die and check prime numbers, I should always make the following two function calls:\n      1. I should first call the roll_die tool to get a roll. Wait for the function response before calling the check_prime tool.\n      2. After I get the function response from roll_die tool, I should call the check_prime tool with the roll_die result.\n        2.1 If user asks I to check primes based on previous rolls, make sure I include the previous rolls in the list.\n      3. When I respond, I must include the roll_die result from step 1.\n      I should always perform the previous 3 steps when asking for a roll and checking prime numbers.\n      I should not rely on the previous history on prime results.\n    ","id":"hello_world_agent","name":"model","tags":["llm"]},{"description":"Roll a die and return the rolled result.\n\nArgs:\n  sides: The integer number of sides the die has.\n  tool_context: the tool context\nReturns:\n  An integer of the result of rolling the die.","id":"hello_world_agent-roll_die","name":"roll_die","tags":["llm","tools"]},{"description":"Check if a given list of numbers are prime.\n\nArgs:\n  nums: The list of numbers to check.\n\nReturns:\n  A str indicating which number is prime.","id":"hello_world_agent-check_prime","name":"check_prime","tags":["llm","tools"]}],"supportsAuthenticatedExtendedCard":false,"url":"http://localhost:8001","version":"0.0.1"}
```

### 4. 執行主（消費端）agent { #run-the-main-consuming-agent }

現在你的遠端 agent 已經在運行，你可以啟動開發 UI，並選擇 "a2a_root" 作為你的 agent。

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

**綜合操作：**

此互動同時使用本機 Roll Agent 與遠端 Prime Agent：

```text
User: Roll a 10-sided die and check if it's prime
Bot: I rolled an 8 for you.
Bot: 8 is not a prime number.
```

## 下一步

現在你已經建立了一個透過 A2A 伺服器公開遠端 agent 的 agent，下一步是學習如何從另一個 agent 來存取它。

- [**A2A 快速開始（消費端）**](./quickstart-consuming.md)：了解你的 agent 如何使用 A2A Protocol 來存取其他 agent。
