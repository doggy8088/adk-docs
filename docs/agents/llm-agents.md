# LLM Agent

`LlmAgent`（通常簡稱為 `Agent`）是 Agent Development Kit (ADK)（ADK）中的核心元件，負責作為應用程式的「思考」部分。它運用大型語言模型 (Large Language Model, LLM) 的強大能力來進行推理、理解自然語言、做出決策、產生回應，以及與工具互動。

與遵循預先定義執行路徑的[Workflow Agents](workflow-agents/index.md)不同，`LlmAgent`的行為是非決定性的。它會利用 LLM 來解讀指令與上下文，動態決定如何執行、是否使用工具（如有需要），或是否將控制權轉交給其他 agent。

要打造一個有效的 `LlmAgent`，需要定義其身份，透過明確的指令引導其行為，並賦予必要的工具與能力。

## 定義 agent 的身份與目的

首先，你需要明確 agent *是什麼* 以及 *用途為何*。

* **`name`（必填）：** 每個 agent 都需要一個唯一的字串識別碼。這個 `name` 對於內部運作至關重要，特別是在多代理系統（multi-agent system）中，agent 之間需要互相指派或委派任務。請選擇一個能反映 agent 功能的描述性名稱（例如：`customer_support_router`、`billing_inquiry_agent`）。避免使用像 `user` 這類保留名稱。

* **`description`（選填，建議用於多代理系統）：** 提供一個簡明的 agent 能力說明。這個描述主要供*其他* LLM agent 判斷是否應將任務指派給此 agent。請具體說明以區分於其他 agent（例如：「處理有關當前帳單明細的查詢」，而非僅寫「帳單 agent」）。

* **`model`（必填）：** 指定將為此 agent 提供推理能力的底層 LLM。這是一個像 `"gemini-2.0-flash"` 這樣的字串識別碼。模型的選擇會影響 agent 的能力、成本與效能。請參閱 [Models](models.md) 頁面以了解可用選項與相關考量。

=== "Python"

    ```python
    # Example: Defining the basic identity
    capital_agent = LlmAgent(
        model="gemini-2.0-flash",
        name="capital_agent",
        description="Answers user questions about the capital city of a given country."
        # instruction and tools will be added next
    )
    ```

=== "Java"

    ```java
    // Example: Defining the basic identity
    LlmAgent capitalAgent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("capital_agent")
            .description("Answers user questions about the capital city of a given country.")
            // instruction and tools will be added next
            .build();
    ```


## 引導 agent：指令（`instruction`）

`instruction` 參數可以說是決定 `LlmAgent` 行為最關鍵的要素。它是一個字串（或回傳字串的函式），用來告訴 agent：

* 其核心任務或目標。
* 其個性或角色（例如：「你是一位樂於助人的助手」、「你是一位風趣的海盜」）。
* 對其行為的限制（例如：「只回答有關 X 的問題」、「絕不透露 Y」）。
* 如何以及何時使用其 `tools`。你應該說明每個工具的用途，以及應在何種情境下呼叫，補充工具本身的描述。
* 輸出的期望格式（例如：「以 JSON 回應」、「請提供條列清單」）。

**有效指令撰寫小技巧：**

* **清楚且具體：** 避免模稜兩可。明確說明期望的行動與結果。
* **善用 Markdown：** 針對複雜指令，使用標題、清單等提升可讀性。
* **提供範例（Few-Shot）：** 對於複雜任務或特定輸出格式，請直接在指令中加入範例。
* **引導工具使用：** 不僅僅列出工具，還要說明 agent 應該在*什麼時候*、*為什麼*使用這些工具。

**State（狀態）：**

* 指令是一個字串模板，你可以使用 `{var}` 語法將動態值插入指令中。
* `{var}` 用於插入名為 var 的狀態變數值。
* `{artifact.var}` 用於插入名為 var 的 artifact 文字內容。
* 如果狀態變數或 artifact 不存在，agent 會拋出錯誤。如果你想忽略該錯誤，可以在變數名稱後加上 `?`，如 `{var?}`。

=== "Python"

    ```python
    # Example: Adding instructions
    capital_agent = LlmAgent(
        model="gemini-2.0-flash",
        name="capital_agent",
        description="Answers user questions about the capital city of a given country.",
        instruction="""You are an agent that provides the capital city of a country.
    When a user asks for the capital of a country:
    1. Identify the country name from the user's query.
    2. Use the `get_capital_city` tool to find the capital.
    3. Respond clearly to the user, stating the capital city.
    Example Query: "What's the capital of {country}?"
    Example Response: "The capital of France is Paris."
    """,
        # tools will be added next
    )
    ```

=== "Java"

    ```java
    // Example: Adding instructions
    LlmAgent capitalAgent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("capital_agent")
            .description("Answers user questions about the capital city of a given country.")
            .instruction(
                """
                You are an agent that provides the capital city of a country.
                When a user asks for the capital of a country:
                1. Identify the country name from the user's query.
                2. Use the `get_capital_city` tool to find the capital.
                3. Respond clearly to the user, stating the capital city.
                Example Query: "What's the capital of {country}?"
                Example Response: "The capital of France is Paris."
                """)
            // tools will be added next
            .build();
    ```

*(注意：若需對系統中*所有*代理（agent）設定指令，建議在 root agent 上使用`global_instruction`，詳情請參閱[Multi-Agents](multi-agents.md)章節。)*

## 裝備代理：工具（Tools，`tools`）

tools 能讓你的`LlmAgent`具備超越大型語言模型 (LLM) 內建知識或推理能力的功能。它們允許 agent 與外部世界互動、執行計算、取得即時資料，或執行特定動作。

* **`tools`（可選）：** 提供 agent 可使用的 tools 清單。清單中的每個項目可以是：
    * 原生函式或方法（需包裝為`FunctionTool`）。Python Agent Development Kit (ADK) 會自動將原生函式包裝成`FuntionTool`，而在 Java 中則需你明確使用`FunctionTool.create(...)`進行包裝。
    * 繼承自`BaseTool`的類別實例。
    * 另一個 agent 的實例（`AgentTool`，可實現 agent 之間的委派—詳見[Multi-Agents](multi-agents.md)）。

大型語言模型 (LLM) 會根據工具/函式名稱、描述（來自 docstring 或`description`欄位），以及參數結構，依據對話內容與指令判斷要呼叫哪個工具。

=== "Python"

    ```python
    # Define a tool function
    def get_capital_city(country: str) -> str:
      """Retrieves the capital city for a given country."""
      # Replace with actual logic (e.g., API call, database lookup)
      capitals = {"france": "Paris", "japan": "Tokyo", "canada": "Ottawa"}
      return capitals.get(country.lower(), f"Sorry, I don't know the capital of {country}.")
    
    # Add the tool to the agent
    capital_agent = LlmAgent(
        model="gemini-2.0-flash",
        name="capital_agent",
        description="Answers user questions about the capital city of a given country.",
        instruction="""You are an agent that provides the capital city of a country... (previous instruction text)""",
        tools=[get_capital_city] # Provide the function directly
    )
    ```

=== "Java"

    ```java
    
    // Define a tool function
    // Retrieves the capital city of a given country.
    public static Map<String, Object> getCapitalCity(
            @Schema(name = "country", description = "The country to get capital for")
            String country) {
      // Replace with actual logic (e.g., API call, database lookup)
      Map<String, String> countryCapitals = new HashMap<>();
      countryCapitals.put("canada", "Ottawa");
      countryCapitals.put("france", "Paris");
      countryCapitals.put("japan", "Tokyo");
    
      String result =
              countryCapitals.getOrDefault(
                      country.toLowerCase(), "Sorry, I couldn't find the capital for " + country + ".");
      return Map.of("result", result); // Tools must return a Map
    }
    
    // Add the tool to the agent
    FunctionTool capitalTool = FunctionTool.create(experiment.getClass(), "getCapitalCity");
    LlmAgent capitalAgent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("capital_agent")
            .description("Answers user questions about the capital city of a given country.")
            .instruction("You are an agent that provides the capital city of a country... (previous instruction text)")
            .tools(capitalTool) // Provide the function wrapped as a FunctionTool
            .build();
    ```

深入瞭解工具（tools），請參閱 [Tools](../tools/index.md) 章節。

## 進階設定與控制

除了核心參數外，`LlmAgent` 還提供多種選項以進行更細緻的控制：

### 設定大型語言模型 (LLM) 生成行為（`generate_content_config`） {#fine-tuning-llm-generation-generate_content_config}

你可以透過 `generate_content_config` 調整底層大型語言模型 (LLM) 的回應生成方式。

* **`generate_content_config`（可選）：** 傳入 [`google.genai.types.GenerateContentConfig`](https://googleapis.github.io/python-genai/genai.html#genai.types.GenerateContentConfig) 的實例，以控制如 `temperature`（隨機性）、`max_output_tokens`（回應長度）、`top_p`、`top_k` 以及安全性設定等參數。

=== "Python"

    ```python
    from google.genai import types

    agent = LlmAgent(
        # ... other params
        generate_content_config=types.GenerateContentConfig(
            temperature=0.2, # More deterministic output
            max_output_tokens=250,
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                )
            ]
        )
    )
    ```

=== "Java"

    ```java
    import com.google.genai.types.GenerateContentConfig;

    LlmAgent agent =
        LlmAgent.builder()
            // ... other params
            .generateContentConfig(GenerateContentConfig.builder()
                .temperature(0.2F) // More deterministic output
                .maxOutputTokens(250)
                .build())
            .build();
    ```

### 結構化資料（`input_schema`, `output_schema`, `output_key`）

針對需要與`LLM Agent`進行結構化資料交換的情境，Agent Development Kit (ADK)（ADK）提供了機制，可透過 schema 定義來指定預期的輸入與輸出格式。

* **`input_schema`（選用）：** 定義一個代表預期輸入結構的 schema。如果設定此項，傳遞給此 agent 的使用者訊息內容*必須*是符合該 schema 的 JSON 字串。你的指示應引導使用者或前一個 agent 依此格式提供資料。

* **`output_schema`（選用）：** 定義一個代表期望輸出結構的 schema。如果設定此項，該 agent 的最終回應*必須*是符合該 schema 的 JSON 字串。

* **`output_key`（選用）：** 提供一個字串型的 key。如果設定此項，該 agent *最終*回應的文字內容將自動儲存至 session 的 state 字典中，並以此 key 作為索引。這對於在多個 agent 或工作流程步驟間傳遞結果特別有用。
    * 在 Python 中，可能如下所示：`session.state[output_key] = agent_response_text`
    * 在 Java 中：`session.state().put(outputKey, agentResponseText)`

=== "Python"

    The input and output schema is typically a `Pydantic` BaseModel.

    ```python
    from pydantic import BaseModel, Field
    
    class CapitalOutput(BaseModel):
        capital: str = Field(description="The capital of the country.")
    
    structured_capital_agent = LlmAgent(
        # ... name, model, description
        instruction="""You are a Capital Information Agent. Given a country, respond ONLY with a JSON object containing the capital. Format: {"capital": "capital_name"}""",
        output_schema=CapitalOutput, # Enforce JSON output
        output_key="found_capital"  # Store result in state['found_capital']
        # Cannot use tools=[get_capital_city] effectively here
    )
    ```

=== "Java"

     The input and output schema is a `google.genai.types.Schema` object.

    ```java
    private static final Schema CAPITAL_OUTPUT =
        Schema.builder()
            .type("OBJECT")
            .description("Schema for capital city information.")
            .properties(
                Map.of(
                    "capital",
                    Schema.builder()
                        .type("STRING")
                        .description("The capital city of the country.")
                        .build()))
            .build();
    
    LlmAgent structuredCapitalAgent =
        LlmAgent.builder()
            // ... name, model, description
            .instruction(
                    "You are a Capital Information Agent. Given a country, respond ONLY with a JSON object containing the capital. Format: {\"capital\": \"capital_name\"}")
            .outputSchema(capitalOutput) // Enforce JSON output
            .outputKey("found_capital") // Store result in state.get("found_capital")
            // Cannot use tools(getCapitalCity) effectively here
            .build();
    ```

### 管理上下文（`include_contents`）

控制 agent 是否接收先前的對話歷史紀錄。

* **`include_contents`（選填，預設值：`'default'`）：** 決定是否將 `contents`（歷史紀錄）傳送給大型語言模型（LLM）。
    * `'default'`：agent 會接收相關的對話歷史紀錄。
    * `'none'`：agent 不會接收任何先前的 `contents`。它僅根據目前的指令以及本次回合所提供的輸入來運作（適用於無狀態任務或需強制指定特定上下文時）。

=== "Python"

    ```python
    stateless_agent = LlmAgent(
        # ... other params
        include_contents='none'
    )
    ```

=== "Java"

    ```java
    import com.google.adk.agents.LlmAgent.IncludeContents;
    
    LlmAgent statelessAgent =
        LlmAgent.builder()
            // ... other params
            .includeContents(IncludeContents.NONE)
            .build();
    ```

### 規劃器（Planner）

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將登場。"}

**`planner`（選用）：** 指定`BasePlanner`實例，可在執行前啟用多步推理與規劃。目前有兩種主要的規劃器：

* **`BuiltInPlanner`：** 利用模型的內建規劃能力（例如 Gemini 的思考功能）。詳情與範例請參考 [Gemini Thinking](https://ai.google.dev/gemini-api/docs/thinking)。

    在此，`thinking_budget`參數用於引導模型在產生回應時應使用多少思考 token。`include_thoughts`參數則控制模型是否應在回應中包含其原始思考內容與內部推理過程。

    ```python
    from google.adk import Agent
    from google.adk.planners import BuiltInPlanner
    from google.genai import types

    my_agent = Agent(
        model="gemini-2.5-flash",
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
                thinking_budget=1024,
            )
        ),
        # ... your tools here
    )
    ```
    
* **`PlanReActPlanner`：** 此規劃器會指示模型在輸出時遵循特定結構：先建立計畫，再執行動作（例如呼叫 tools），並針對每個步驟提供推理說明。*這對於沒有內建「思考」功能的模型特別有用*。

    ```python
    from google.adk import Agent
    from google.adk.planners import PlanReActPlanner

    my_agent = Agent(
        model="gemini-2.0-flash",
        planner=PlanReActPlanner(),
        # ... your tools here
    )
    ```

    代理（agent）的回應將遵循結構化格式：

    ```
    [user]: ai news
    [google_search_agent]: /*PLANNING*/
    1. Perform a Google search for "latest AI news" to get current updates and headlines related to artificial intelligence.
    2. Synthesize the information from the search results to provide a summary of recent AI news.

    /*ACTION*/
    /*REASONING*/
    The search results provide a comprehensive overview of recent AI news, covering various aspects like company developments, research breakthroughs, and applications. I have enough information to answer the user's request.

    /*FINAL_ANSWER*/
    Here's a summary of recent AI news:
    ....
    ```

### 程式碼執行

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將上線。"}

* **`code_executor`（選用）：** 提供`BaseCodeExecutor`實例，以允許代理（agent）執行大型語言模型 (LLM) 回應中的程式碼區塊。（[請參閱 內建工具](../tools/built-in-tools.md)）

使用 built-in-planner 的範例：
```python




from dotenv import load_dotenv


import asyncio
import os

from google.genai import types
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService # Optional
from google.adk.planners import BasePlanner, BuiltInPlanner, PlanReActPlanner
from google.adk.models import LlmRequest

from google.genai.types import ThinkingConfig
from google.genai.types import GenerateContentConfig

import datetime
from zoneinfo import ZoneInfo

APP_NAME = "weather_app"
USER_ID = "1234"
SESSION_ID = "session1234"

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


def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city.

    Args:
        city (str): The name of the city for which to retrieve the current time.

    Returns:
        dict: status and result or error msg.
    """

    if city.lower() == "new york":
        tz_identifier = "America/New_York"
    else:
        return {
            "status": "error",
            "error_message": (
                f"Sorry, I don't have timezone information for {city}."
            ),
        }

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    report = (
        f'The current time in {city} is {now.strftime("%Y-%m-%d %H:%M:%S %Z%z")}'
    )
    return {"status": "success", "report": report}

# Step 1: Create a ThinkingConfig
thinking_config = ThinkingConfig(
    include_thoughts=True,   # Ask the model to include its thoughts in the response
    thinking_budget=256      # Limit the 'thinking' to 256 tokens (adjust as needed)
)
print("ThinkingConfig:", thinking_config)

# Step 2: Instantiate BuiltInPlanner
planner = BuiltInPlanner(
    thinking_config=thinking_config
)
print("BuiltInPlanner created.")

# Step 3: Wrap the planner in an LlmAgent
agent = LlmAgent(
    model="gemini-2.5-pro-preview-03-25",  # Set your model name
    name="weather_and_time_agent",
    instruction="You are an agent that returns time and weather",
    planner=planner,
    tools=[get_weather, get_current_time]
)

# Session and Runner
session_service = InMemorySessionService()
session = session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)

# Agent Interaction
def call_agent(query):
    content = types.Content(role='user', parts=[types.Part(text=query)])
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    for event in events:
        print(f"\nDEBUG EVENT: {event}\n")
        if event.is_final_response() and event.content:
            final_answer = event.content.parts[0].text.strip()
            print("\n🟢 FINAL ANSWER\n", final_answer, "\n")

call_agent("If it's raining in New York right now, what is the current temperature?")

```

## 綜合應用：範例

??? "程式碼"
    以下是完整的基礎 `capital_agent`：

    === "Python"
    
        ```python
        --8<-- "examples/python/snippets/agents/llm-agent/capital_agent.py"
        ```
    
    === "Java"
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/LlmAgentExample.java:full_code"
        ```

_（本範例展示了核心概念。更複雜的代理（agent）可能會結合 schema、情境控制、規劃等功能。）_

## 相關概念（延伸主題）

本頁說明了`LlmAgent`的核心設定，還有其他相關概念可提供更進階的控制，詳情請參閱其他章節：

* **Callbacks（回呼）:** 使用`before_model_callback`、`after_model_callback`等攔截執行點（模型呼叫前/後、工具呼叫前/後）。請參閱 [Callbacks](../callbacks/types-of-callbacks.md)。
* **多代理控制（Multi-Agent Control）:** 進階的代理（agent）互動策略，包括規劃（`planner`）、代理轉移控制（`disallow_transfer_to_parent`、`disallow_transfer_to_peers`），以及系統層級指令（`global_instruction`）。請參閱 [Multi-Agents](multi-agents.md)。
