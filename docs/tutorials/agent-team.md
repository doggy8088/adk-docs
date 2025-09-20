# 建立你的第一個智慧型代理團隊：使用 ADK 打造進階天氣機器人

<!-- Optional outer container for overall padding/spacing -->
<div style="padding: 10px 0;">

  <!-- Line 1: Open in Colab -->
  <!-- This div ensures the link takes up its own line and adds space below -->
  <div style="margin-bottom: 10px;">
    <a href="https://colab.research.google.com/github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" style="display: inline-flex; align-items: center; gap: 5px; text-decoration: none; color: #4285F4;">
      <img width="32px" src="https://www.gstatic.com/pantheon/images/bigquery/welcome_page/colab-logo.svg" alt="Google Colaboratory logo">
      <span>在 Colab 中開啟</span>
    </a>
  </div>

  <!-- Line 2: Share Links -->
  <!-- This div acts as a flex container for the "Share to" text and icons -->
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <!-- Share Text -->
    <span style="font-weight: bold;">分享至：</span>

    <!-- Social Media Links -->
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A//github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" title="Share on LinkedIn">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg" alt="LinkedIn logo" style="vertical-align: middle;">
    </a>
    <a href="https://bsky.app/intent/compose?text=https%3A//github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" title="Share on Bluesky">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky logo" style="vertical-align: middle;">
    </a>
    <a href="https://twitter.com/intent/tweet?url=https%3A//github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" title="Share on X (Twitter)">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg" alt="X logo" style="vertical-align: middle;">
    </a>
    <a href="https://reddit.com/submit?url=https%3A//github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" title="Share on Reddit">
      <img width="20px" src="https://redditinc.com/hubfs/Reddit%20Inc/Brand/Reddit_Logo.png" alt="Reddit logo" style="vertical-align: middle;">
    </a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A//github/google/adk-docs/blob/main/examples/python/tutorial/agent_team/adk_tutorial.ipynb" target="_blank" title="Share on Facebook">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook logo" style="vertical-align: middle;">
    </a>
  </div>

</div>

本教學延續自 [快速入門範例](https://google.github.io/adk-docs/get-started/quickstart/)，針對 [Agent Development Kit (ADK)](https://google.github.io/adk-docs/get-started/) 進行更深入的應用。現在，你已經準備好進一步探索，並打造一個更進階的 **多智能體系統（multi-agent system）**。

我們將從建立一個 **天氣機器人（Weather Bot）智能體團隊** 開始，並在簡單的基礎上逐步加入進階功能。從一個能查詢天氣的單一智能體出發，逐步增加以下能力：

*   支援多種 AI 模型（如 Gemini、GPT、Claude）。
*   為不同任務設計專門的子智能體（如問候與道別）。
*   讓智能體之間能夠智慧地委派任務。
*   透過持久化會話狀態，賦予智能體記憶能力。
*   利用回呼（callback）實作關鍵的安全防護措施。

**為什麼選擇天氣機器人團隊？**

這個案例雖然看似簡單，卻能作為實用且易於理解的範例，讓你深入探索 ADK 的核心概念，這些都是打造複雜、真實世界智能體應用的基礎。你將學會如何設計互動結構、管理狀態、確保安全，以及協調多個 AI「大腦」協同運作。

**ADK 再次說明**

提醒一下，Agent Development Kit (ADK) 是一個專為大型語言模型（Large Language Model, LLM）應用開發設計的 Python 框架。它提供強大的基礎元件，協助你打造能夠推理、規劃、使用工具、與使用者動態互動，並在團隊中有效協作的智能體。

**在這份進階教學中，你將學會：**

*   ✅ **工具定義與使用：** 編寫 Python 函式（`tools`），賦予智能體特定能力（如抓取資料），並教導智能體如何有效使用這些工具。
*   ✅ **多 LLM 彈性支援：** 配置智能體，透過 LiteLLM 整合使用多種主流 LLM（如 Gemini、GPT-4o、Claude Sonnet），讓你可根據任務選擇最合適的模型。
*   ✅ **智能體委派與協作：** 設計專門的子智能體，並實現自動路由（`auto flow`），將使用者請求分派給團隊中最合適的智能體。
*   ✅ **會話狀態與記憶：** 利用 `Session State` 和 `ToolContext`，讓智能體能在多輪對話中記住資訊，實現更具情境感的互動。
*   ✅ **安全防護與回呼機制：** 實作 `before_model_callback` 和 `before_tool_callback`，根據預設規則檢查、修改或阻擋請求／工具使用，提升應用的安全性與可控性。

**最終成果預期：**

完成本教學後，你將打造出一套功能完整的多智能體天氣機器人系統。這個系統不僅能提供天氣資訊，還能處理對話禮儀、記住上次查詢的城市，並在安全規範下運作，所有流程皆由 ADK 協同管理。

**先備知識：**

*   ✅ **具備紮實的 Python 程式設計能力。**
*   ✅ **熟悉大型語言模型（LLM）、API 及智能體相關概念。**
*   ❗ **重點：已完成 ADK 快速入門教學，或具備等同的 ADK 基礎知識（如 Agent、Runner、SessionService、基本 Tool 使用）。** 本教學將直接延續這些基礎。
*   ✅ **你打算使用的 LLM API 金鑰**（例如 Gemini 需 Google AI Studio、OpenAI 平台、Anthropic Console 等）。


---

**執行環境說明：**

本教學設計適用於互動式筆記本環境，如 Google Colab、Colab Enterprise 或 Jupyter 筆記本。請注意以下事項：

*   **執行非同步程式碼：** 筆記本環境對非同步程式碼的處理方式有所不同。你會看到使用 `await` 的範例（適用於事件迴圈已在運作的情境，常見於筆記本），或 `asyncio.run()`（通常用於獨立 `.py` 腳本或特定筆記本設定）。程式碼區塊會針對這兩種情境分別說明。
*   **手動建立 Runner／Session：** 步驟中會明確建立 `Runner` 與 `SessionService` 實例。這麼做是為了讓你能細緻掌控智能體的執行生命週期、會話管理與狀態持久化。

**替代方案：使用 ADK 內建工具（Web UI／CLI／API 伺服器）**

如果你偏好讓 ADK 標準工具自動處理 runner 與 session 管理，可參考[這裡](https://github.com/google/adk-docs/tree/main/examples/python/tutorial/agent_team/adk-tutorial)的對應程式碼。該版本設計可直接用 `adk web`（Web UI）、`adk run`（命令列介面）、或 `adk api_server`（API 服務）等指令執行。請依照該資源中的 `README.md` 指示操作。

---

**準備好打造你的智能體團隊了嗎？讓我們開始吧！**

> **注意：** 本教學適用於 adk 1.0.0 以上版本

```python
# @title Step 0: Setup and Installation
# Install ADK and LiteLLM for multi-model support

!pip install google-adk -q
!pip install litellm -q

print("Installation complete.")
```


請提供原文、初始譯文、品質分析和改進建議，我才能根據您的要求進行翻譯改進。

```python
# @title Import necessary libraries
import os
import asyncio
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm # For multi-model support
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types # For creating message Content/Parts

import warnings
# Ignore all warnings
warnings.filterwarnings("ignore")

import logging
logging.basicConfig(level=logging.ERROR)

print("Libraries imported.")
```


請提供原文、初始譯文、品質分析與改進建議內容，我才能協助改進翻譯。

```python
# @title Configure API Keys (Replace with your actual keys!)

# --- IMPORTANT: Replace placeholders with your real API keys ---

# Gemini API Key (Get from Google AI Studio: https://aistudio.google.com/app/apikey)
os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY" # <--- REPLACE

# [Optional]
# OpenAI API Key (Get from OpenAI Platform: https://platform.openai.com/api-keys)
os.environ['OPENAI_API_KEY'] = 'YOUR_OPENAI_API_KEY' # <--- REPLACE

# [Optional]
# Anthropic API Key (Get from Anthropic Console: https://console.anthropic.com/settings/keys)
os.environ['ANTHROPIC_API_KEY'] = 'YOUR_ANTHROPIC_API_KEY' # <--- REPLACE

# --- Verify Keys (Optional Check) ---
print("API Keys Set:")
print(f"Google API Key set: {'Yes' if os.environ.get('GOOGLE_API_KEY') and os.environ['GOOGLE_API_KEY'] != 'YOUR_GOOGLE_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")
print(f"OpenAI API Key set: {'Yes' if os.environ.get('OPENAI_API_KEY') and os.environ['OPENAI_API_KEY'] != 'YOUR_OPENAI_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")
print(f"Anthropic API Key set: {'Yes' if os.environ.get('ANTHROPIC_API_KEY') and os.environ['ANTHROPIC_API_KEY'] != 'YOUR_ANTHROPIC_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")

# Configure ADK to use API keys directly (not Vertex AI for this multi-model setup)
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


# @markdown **Security Note:** It's best practice to manage API keys securely (e.g., using Colab Secrets or environment variables) rather than hardcoding them directly in the notebook. Replace the placeholder strings above.
```


請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。

```python
# --- Define Model Constants for easier use ---

# More supported models can be referenced here: https://ai.google.dev/gemini-api/docs/models#model-variations
MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"

# More supported models can be referenced here: https://docs.litellm.ai/docs/providers/openai#openai-chat-completion-models
MODEL_GPT_4O = "openai/gpt-4.1" # You can also try: gpt-4.1-mini, gpt-4o etc.

# More supported models can be referenced here: https://docs.litellm.ai/docs/providers/anthropic
MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4-20250514" # You can also try: claude-opus-4-20250514 , claude-3-7-sonnet-20250219 etc

print("\nEnvironment configured.")
```

---

## 步驟 1：你的第一個 Agent —— 基本天氣查詢

讓我們從建構 Weather Bot 的基礎元件開始：一個能夠執行特定任務的單一 agent —— 查詢天氣資訊。這包含建立兩個核心部分：

1. **工具（Tool）：** 一個 Python 函式，賦予 agent *取得天氣資料* 的能力。  
2. **Agent：** 這個 AI「大腦」能理解使用者的請求，知道自己擁有天氣工具，並決定何時以及如何使用它。

---

**1\. 定義工具（`get_weather`）**

在 Agent Development Kit (ADK) 中，**工具（Tools）** 是賦予 agent 實際能力的基礎元件，不僅僅是產生文字。它們通常是執行特定動作的標準 Python 函式，例如呼叫 API、查詢資料庫或進行計算。

我們的第一個工具會提供一個*模擬*天氣報告。這讓我們可以專注於 agent 的架構，而暫時不需要外部 API 金鑰。日後，你可以很容易地將這個模擬函式替換為真正呼叫天氣服務的版本。

**關鍵概念：Docstring 非常重要！** agent 所用的大型語言模型 (LLM) 主要依賴函式的 **docstring** 來理解：

* 這個工具*做什麼*。  
* *何時*該使用它。  
* 需要哪些*參數*（`city: str`）。  
* 會回傳哪些*資訊*。

**最佳實踐：** 為你的工具撰寫清楚、具描述性且準確的 docstring。這對於 LLM 正確使用工具至關重要。


```python
# @title Define the get_weather Tool
def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.

    Args:
        city (str): The name of the city (e.g., "New York", "London", "Tokyo").

    Returns:
        dict: A dictionary containing the weather information.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'report' key with weather details.
              If 'error', includes an 'error_message' key.
    """
    print(f"--- Tool: get_weather called for city: {city} ---") # Log tool execution
    city_normalized = city.lower().replace(" ", "") # Basic normalization

    # Mock weather data
    mock_weather_db = {
        "newyork": {"status": "success", "report": "The weather in New York is sunny with a temperature of 25°C."},
        "london": {"status": "success", "report": "It's cloudy in London with a temperature of 15°C."},
        "tokyo": {"status": "success", "report": "Tokyo is experiencing light rain and a temperature of 18°C."},
    }

    if city_normalized in mock_weather_db:
        return mock_weather_db[city_normalized]
    else:
        return {"status": "error", "error_message": f"Sorry, I don't have weather information for '{city}'."}

# Example tool usage (optional test)
print(get_weather("New York"))
print(get_weather("Paris"))
```

---

**2\. 定義 Agent（`weather_agent`）**

現在，讓我們來建立**Agent**本身。在 Agent Development Kit (ADK) 中，`Agent` 負責協調使用者、大型語言模型 (LLM) 與可用工具之間的互動。

我們需要為其設定幾個關鍵參數：

* `name`：這個 agent 的唯一識別碼（例如："weather\_agent\_v1"）。
* `model`：指定要使用哪一個 LLM（例如，`MODEL_GEMINI_2_0_FLASH`）。這裡我們會先採用特定的 Gemini 模型。
* `description`：簡明扼要地說明這個 agent 的整體用途。當其他 agent 需要判斷是否要將任務委派給*這個* agent 時，這個說明會變得非常重要。
* `instruction`：針對 LLM 提供詳細的指引，說明其應有的行為、角色設定、目標，以及*如何與何時*使用其分配到的`tools`。
* `tools`：列出 agent 被允許使用的實際 Python 工具函式清單（例如：`[get_weather]`）。

**最佳實踐：**請提供明確且具體的`instruction`提示。指令越詳細，LLM 越能理解其角色並有效運用工具。如有錯誤處理需求，請明確說明。

**最佳實踐：**請選用具描述性的`name`與`description`值。這些值會在 ADK 內部使用，對於自動委派等功能（後續會介紹）非常關鍵。


```python
# @title Define the Weather Agent
# Use one of the model constants defined earlier
AGENT_MODEL = MODEL_GEMINI_2_0_FLASH # Starting with Gemini

weather_agent = Agent(
    name="weather_agent_v1",
    model=AGENT_MODEL, # Can be a string for Gemini or a LiteLlm object
    description="Provides weather information for specific cities.",
    instruction="You are a helpful weather assistant. "
                "When the user asks for the weather in a specific city, "
                "use the 'get_weather' tool to find the information. "
                "If the tool returns an error, inform the user politely. "
                "If the tool is successful, present the weather report clearly.",
    tools=[get_weather], # Pass the function directly
)

print(f"Agent '{weather_agent.name}' created using model '{AGENT_MODEL}'.")
```

---

**3\. 設定 Runner 與 Session Service**

為了管理對話並執行代理（agent），我們還需要兩個元件：

* `SessionService`：負責管理不同使用者與工作階段（session）的對話歷史與狀態。`InMemorySessionService` 是一個簡單的實作，將所有資料儲存在記憶體中，適合用於測試與簡單應用。它會追蹤交換過的訊息。我們會在第 4 步進一步探討狀態持久化。
* `Runner`：負責協調互動流程的引擎。它接收使用者輸入，將其導向適當的代理（agent），依據代理的邏輯管理對大型語言模型 (LLM) 及工具的呼叫，透過 `SessionService` 處理 session 更新，並產生代表互動進度的事件。


```python
# @title Setup Session Service and Runner

# --- Session Management ---
# Key Concept: SessionService stores conversation history & state.
# InMemorySessionService is simple, non-persistent storage for this tutorial.
session_service = InMemorySessionService()

# Define constants for identifying the interaction context
APP_NAME = "weather_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001" # Using a fixed ID for simplicity

# Create the specific session where the conversation will happen
session = await session_service.create_session(
    app_name=APP_NAME,
    user_id=USER_ID,
    session_id=SESSION_ID
)
print(f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'")

# --- Runner ---
# Key Concept: Runner orchestrates the agent execution loop.
runner = Runner(
    agent=weather_agent, # The agent we want to run
    app_name=APP_NAME,   # Associates runs with our app
    session_service=session_service # Uses our session manager
)
print(f"Runner created for agent '{runner.agent.name}'.")
```

---

**4\. 與 Agent 互動**

我們需要一種方式來傳送訊息給我們的 agent，並接收其回應。由於大型語言模型 (LLM) 呼叫與工具執行可能需要一些時間，Agent Development Kit (ADK) 的 `Runner` 是以非同步方式運作的。

我們將定義一個 `async` 輔助函式（`call_agent_async`），其功能如下：

1. 接收使用者查詢字串。  
2. 將其封裝成 ADK 的 `Content` 格式。  
3. 呼叫 `runner.run_async`，傳入使用者／工作階段內容以及新訊息。  
4. 遍歷 runner 所產生的 **Events**（事件）。這些事件代表 agent 執行過程中的各個步驟（例如：請求呼叫工具、收到工具結果、中間的 LLM 思考、最終回應等）。  
5. 使用 `event.is_final_response()` 辨識並印出**最終回應**事件。

**為什麼要用 `async`？** 與大型語言模型 (LLM) 以及可能的工具（如外部 API）互動，屬於 I/O 密集型操作。使用 `asyncio` 可以讓程式有效率地處理這些操作，而不會阻塞執行流程。


```python
# @title Define Agent Interaction Function

from google.genai import types # For creating message Content/Parts

async def call_agent_async(query: str, runner, user_id, session_id):
  """Sends a query to the agent and prints the final response."""
  print(f"\n>>> User Query: {query}")

  # Prepare the user's message in ADK format
  content = types.Content(role='user', parts=[types.Part(text=query)])

  final_response_text = "Agent did not produce a final response." # Default

  # Key Concept: run_async executes the agent logic and yields Events.
  # We iterate through events to find the final answer.
  async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
      # You can uncomment the line below to see *all* events during execution
      # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")

      # Key Concept: is_final_response() marks the concluding message for the turn.
      if event.is_final_response():
          if event.content and event.content.parts:
             # Assuming text response in the first part
             final_response_text = event.content.parts[0].text
          elif event.actions and event.actions.escalate: # Handle potential errors/escalations
             final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
          # Add more checks here if needed (e.g., specific error codes)
          break # Stop processing events once the final response is found

  print(f"<<< Agent Response: {final_response_text}")
```

---

**5\. 執行對話流程**

最後，讓我們透過發送幾個查詢給 agent 來測試我們的設定。我們將 `async` 呼叫包裝在主要的 `async` 函式中，並使用 `await` 來執行它。

請觀察以下輸出：

* 查看使用者查詢。  
* 注意當 agent 使用工具時的 `--- Tool: get_weather called... ---` 日誌。  
* 觀察 agent 的最終回應，包括它如何處理無法取得天氣資料（如巴黎）的情境。


```python
# @title Run the Initial Conversation

# We need an async function to await our interaction helper
async def run_conversation():
    await call_agent_async("What is the weather like in London?",
                                       runner=runner,
                                       user_id=USER_ID,
                                       session_id=SESSION_ID)

    await call_agent_async("How about Paris?",
                                       runner=runner,
                                       user_id=USER_ID,
                                       session_id=SESSION_ID) # Expecting the tool's error message

    await call_agent_async("Tell me the weather in New York",
                                       runner=runner,
                                       user_id=USER_ID,
                                       session_id=SESSION_ID)

# Execute the conversation using await in an async context (like Colab/Jupyter)
await run_conversation()

# --- OR ---

# Uncomment the following lines if running as a standard Python script (.py file):
# import asyncio
# if __name__ == "__main__":
#     try:
#         asyncio.run(run_conversation())
#     except Exception as e:
#         print(f"An error occurred: {e}")
```

---

恭喜你！你已成功建立並與你的第一個 ADK agent 互動。它能理解使用者的請求，利用工具查找資訊，並根據工具的結果做出適當回應。

在下一步，我們將探索如何輕鬆切換支援此 agent 的底層大型語言模型 (LLM)。

## 步驟 2：使用 LiteLLM 輕鬆切換多種模型【選用】

在步驟 1 中，我們建立了一個由特定 Gemini 模型支援的 Weather Agent。雖然這樣已經很有效，但實際應用中，能夠靈活使用*不同*的大型語言模型 (LLM) 通常更具優勢。為什麼呢？

*   **效能：** 某些模型在特定任務（如程式設計、推理、創意寫作）上表現更佳。
*   **成本：** 不同模型的價格各異。
*   **功能：** 各模型提供多樣化的功能、上下文視窗大小與微調選項。
*   **可用性／備援性：** 擁有多個選擇可確保你的應用即使某個服務供應商發生問題時仍能運作。

ADK 透過與 [**LiteLLM**](https://github.com/BerriAI/litellm) 函式庫的整合，讓模型切換變得無縫。LiteLLM 提供超過 100 種不同 LLM 的一致介面。

**在這個步驟中，我們將：**

1.  學習如何設定 ADK `Agent`，透過 `LiteLlm` 包裝器使用如 OpenAI (GPT) 和 Anthropic (Claude) 等供應商的模型。
2.  定義並設定（包含各自的 session 與 runner），並立即測試多個 Weather Agent 實例，每個都由不同的 LLM 支援。
3.  與這些不同的 agent 互動，觀察即使使用相同工具時，其回應可能出現的差異。

---

**1\. 匯入 `LiteLlm`**

我們在初始設定（步驟 0）時已經匯入這個元件，但它是支援多模型功能的關鍵組件：


```python
# @title 1. Import LiteLlm
from google.adk.models.lite_llm import LiteLlm
```

**2\. 定義並測試多模型 Agent**

與僅傳入模型名稱字串（預設為 Google 的 Gemini 模型）不同，我們將欲使用的模型識別字串包裝在 `LiteLlm` 類別中。

*   **重點概念：`LiteLlm` 包裝器：** `LiteLlm(model="provider/model_name")` 語法會指示 Agent Development Kit (ADK) 透過 LiteLLM 函式庫，將此 agent 的請求路由至指定的模型供應商。

請確認你已在步驟 0 配置好 OpenAI 與 Anthropic 所需的 API 金鑰。我們將使用 `call_agent_async` 函式（前面已定義，現在可接受 `runner`、`user_id` 和 `session_id`）來在每個 agent 設定完成後立即與其互動。

以下每個區塊將會：

*   使用特定的 LiteLLM 模型（`MODEL_GPT_4O` 或 `MODEL_CLAUDE_SONNET`）定義 agent。
*   為該 agent 的測試執行建立一個*全新且獨立*的 `InMemorySessionService` 與 session。這樣可在本範例中隔離各自的對話紀錄。
*   建立一個針對該 agent 及其 session 服務所設定的 `Runner`。
*   立即呼叫 `call_agent_async`，發送查詢並測試該 agent。

**最佳實踐：** 請使用常數來定義模型名稱（如步驟 0 中定義的 `MODEL_GPT_4O`、`MODEL_CLAUDE_SONNET`），以避免拼寫錯誤並讓程式碼更易於管理。

**錯誤處理：** 我們將 agent 定義包裹在 `try...except` 區塊中。這樣即使某個供應商的 API 金鑰缺失或無效，也不會導致整個程式碼區塊失敗，讓教學可以繼續執行已正確設定的模型。

首先，讓我們使用 OpenAI 的 GPT-4o 建立並測試 agent。


```python
# @title Define and Test GPT Agent

# Make sure 'get_weather' function from Step 1 is defined in your environment.
# Make sure 'call_agent_async' is defined from earlier.

# --- Agent using GPT-4o ---
weather_agent_gpt = None # Initialize to None
runner_gpt = None      # Initialize runner to None

try:
    weather_agent_gpt = Agent(
        name="weather_agent_gpt",
        # Key change: Wrap the LiteLLM model identifier
        model=LiteLlm(model=MODEL_GPT_4O),
        description="Provides weather information (using GPT-4o).",
        instruction="You are a helpful weather assistant powered by GPT-4o. "
                    "Use the 'get_weather' tool for city weather requests. "
                    "Clearly present successful reports or polite error messages based on the tool's output status.",
        tools=[get_weather], # Re-use the same tool
    )
    print(f"Agent '{weather_agent_gpt.name}' created using model '{MODEL_GPT_4O}'.")

    # InMemorySessionService is simple, non-persistent storage for this tutorial.
    session_service_gpt = InMemorySessionService() # Create a dedicated service

    # Define constants for identifying the interaction context
    APP_NAME_GPT = "weather_tutorial_app_gpt" # Unique app name for this test
    USER_ID_GPT = "user_1_gpt"
    SESSION_ID_GPT = "session_001_gpt" # Using a fixed ID for simplicity

    # Create the specific session where the conversation will happen
    session_gpt = await session_service_gpt.create_session(
        app_name=APP_NAME_GPT,
        user_id=USER_ID_GPT,
        session_id=SESSION_ID_GPT
    )
    print(f"Session created: App='{APP_NAME_GPT}', User='{USER_ID_GPT}', Session='{SESSION_ID_GPT}'")

    # Create a runner specific to this agent and its session service
    runner_gpt = Runner(
        agent=weather_agent_gpt,
        app_name=APP_NAME_GPT,       # Use the specific app name
        session_service=session_service_gpt # Use the specific session service
        )
    print(f"Runner created for agent '{runner_gpt.agent.name}'.")

    # --- Test the GPT Agent ---
    print("\n--- Testing GPT Agent ---")
    # Ensure call_agent_async uses the correct runner, user_id, session_id
    await call_agent_async(query = "What's the weather in Tokyo?",
                           runner=runner_gpt,
                           user_id=USER_ID_GPT,
                           session_id=SESSION_ID_GPT)
    # --- OR ---

    # Uncomment the following lines if running as a standard Python script (.py file):
    # import asyncio
    # if __name__ == "__main__":
    #     try:
    #         asyncio.run(call_agent_async(query = "What's the weather in Tokyo?",
    #                      runner=runner_gpt,
    #                       user_id=USER_ID_GPT,
    #                       session_id=SESSION_ID_GPT)
    #     except Exception as e:
    #         print(f"An error occurred: {e}")

except Exception as e:
    print(f"❌ Could not create or run GPT agent '{MODEL_GPT_4O}'. Check API Key and model name. Error: {e}")

```

接下來，我們將對 Anthropic 的 Claude Sonnet 進行相同的操作。


```python
# @title Define and Test Claude Agent

# Make sure 'get_weather' function from Step 1 is defined in your environment.
# Make sure 'call_agent_async' is defined from earlier.

# --- Agent using Claude Sonnet ---
weather_agent_claude = None # Initialize to None
runner_claude = None      # Initialize runner to None

try:
    weather_agent_claude = Agent(
        name="weather_agent_claude",
        # Key change: Wrap the LiteLLM model identifier
        model=LiteLlm(model=MODEL_CLAUDE_SONNET),
        description="Provides weather information (using Claude Sonnet).",
        instruction="You are a helpful weather assistant powered by Claude Sonnet. "
                    "Use the 'get_weather' tool for city weather requests. "
                    "Analyze the tool's dictionary output ('status', 'report'/'error_message'). "
                    "Clearly present successful reports or polite error messages.",
        tools=[get_weather], # Re-use the same tool
    )
    print(f"Agent '{weather_agent_claude.name}' created using model '{MODEL_CLAUDE_SONNET}'.")

    # InMemorySessionService is simple, non-persistent storage for this tutorial.
    session_service_claude = InMemorySessionService() # Create a dedicated service

    # Define constants for identifying the interaction context
    APP_NAME_CLAUDE = "weather_tutorial_app_claude" # Unique app name
    USER_ID_CLAUDE = "user_1_claude"
    SESSION_ID_CLAUDE = "session_001_claude" # Using a fixed ID for simplicity

    # Create the specific session where the conversation will happen
    session_claude = await session_service_claude.create_session(
        app_name=APP_NAME_CLAUDE,
        user_id=USER_ID_CLAUDE,
        session_id=SESSION_ID_CLAUDE
    )
    print(f"Session created: App='{APP_NAME_CLAUDE}', User='{USER_ID_CLAUDE}', Session='{SESSION_ID_CLAUDE}'")

    # Create a runner specific to this agent and its session service
    runner_claude = Runner(
        agent=weather_agent_claude,
        app_name=APP_NAME_CLAUDE,       # Use the specific app name
        session_service=session_service_claude # Use the specific session service
        )
    print(f"Runner created for agent '{runner_claude.agent.name}'.")

    # --- Test the Claude Agent ---
    print("\n--- Testing Claude Agent ---")
    # Ensure call_agent_async uses the correct runner, user_id, session_id
    await call_agent_async(query = "Weather in London please.",
                           runner=runner_claude,
                           user_id=USER_ID_CLAUDE,
                           session_id=SESSION_ID_CLAUDE)

    # --- OR ---

    # Uncomment the following lines if running as a standard Python script (.py file):
    # import asyncio
    # if __name__ == "__main__":
    #     try:
    #         asyncio.run(call_agent_async(query = "Weather in London please.",
    #                      runner=runner_claude,
    #                       user_id=USER_ID_CLAUDE,
    #                       session_id=SESSION_ID_CLAUDE)
    #     except Exception as e:
    #         print(f"An error occurred: {e}")


except Exception as e:
    print(f"❌ Could not create or run Claude agent '{MODEL_CLAUDE_SONNET}'. Check API Key and model name. Error: {e}")
```

請仔細觀察兩個程式碼區塊的輸出結果。你應該會看到：

1.  每個 agent（`weather_agent_gpt`、`weather_agent_claude`）都成功建立（若 API 金鑰有效）。
2.  每個 agent 都設置了專屬的 session 與 runner。
3.  每個 agent 在處理查詢時，都能正確判斷需要使用 `get_weather` 工具（你會看到 `--- Tool: get_weather called... ---` 的日誌）。
4.  *底層工具邏輯* 完全相同，始終回傳我們的模擬資料。
5.  不過，每個 agent 所產生的**最終文字回應**在措辭、語氣或格式上可能會略有不同。這是因為指令提示（instruction prompt）是由不同的大型語言模型 (LLM)（GPT-4o 與 Claude Sonnet）來解讀與執行。

這個步驟展示了 Agent Development Kit (ADK) 結合 LiteLLM 所帶來的強大彈性。你可以輕鬆地用不同的 LLM 來實驗與部署 agent，同時保持核心應用邏輯（工具、agent 基本結構）的一致性。

在下一個步驟中，我們將不再只用單一 agent，而是建立一個小型團隊，讓 agent 之間可以互相委派任務！

---

## 步驟 3：建立 Agent 團隊 —— 問候與道別的委派

在步驟 1 和 2 中，我們建立並實驗了一個專注於天氣查詢的單一 agent。雖然這對特定任務很有效，但實際應用通常需要處理更多元的使用者互動。我們*可以*不斷為單一天氣 agent 增加更多工具與複雜指令，但這很快就會變得難以管理且效率低落。

更健全的做法是建立一個**Agent 團隊**。這包含：

1. 建立多個**專業化 agent**，每個都針對特定能力設計（例如：一個負責天氣、一個負責問候、一個負責計算）。
2. 指定一個**根 agent**（或稱 orchestrator），負責接收最初的使用者請求。
3. 讓根 agent 能夠根據使用者意圖，**自動委派**請求給最合適的專業子 agent。

**為什麼要建立 Agent 團隊？**

* **模組化：** 更容易開發、測試與維護個別 agent。
* **專業化：** 每個 agent 都能針對其專屬任務（指令、模型選擇）進行最佳化。
* **可擴展性：** 只需新增 agent 即可簡單擴充新功能。
* **效率：** 對於簡單任務（如問候），可以使用更簡單或成本較低的模型。

**在這個步驟中，我們將：**

1. 定義處理問候（`say_hello`）與道別（`say_goodbye`）的簡單工具。
2. 建立兩個新的專業子 agent：`greeting_agent` 與 `farewell_agent`。
3. 更新我們的主要天氣 agent（`weather_agent_v2`），讓它作為**根 agent**。
4. 為根 agent 配置其子 agent，啟用**自動委派**功能。
5. 透過向根 agent 發送不同類型的請求，測試委派流程。

---

**1\. 為子 Agent 定義工具**

首先，讓我們建立將作為新專業 agent 工具的簡單 Python 函式。請記得，清楚的 docstring 對於將要使用這些工具的 agent 十分重要。


```python
# @title Define Tools for Greeting and Farewell Agents
from typing import Optional # Make sure to import Optional

# Ensure 'get_weather' from Step 1 is available if running this step independently.
# def get_weather(city: str) -> dict: ... (from Step 1)

def say_hello(name: Optional[str] = None) -> str:
    """Provides a simple greeting. If a name is provided, it will be used.

    Args:
        name (str, optional): The name of the person to greet. Defaults to a generic greeting if not provided.

    Returns:
        str: A friendly greeting message.
    """
    if name:
        greeting = f"Hello, {name}!"
        print(f"--- Tool: say_hello called with name: {name} ---")
    else:
        greeting = "Hello there!" # Default greeting if name is None or not explicitly passed
        print(f"--- Tool: say_hello called without a specific name (name_arg_value: {name}) ---")
    return greeting

def say_goodbye() -> str:
    """Provides a simple farewell message to conclude the conversation."""
    print(f"--- Tool: say_goodbye called ---")
    return "Goodbye! Have a great day."

print("Greeting and Farewell tools defined.")

# Optional self-test
print(say_hello("Alice"))
print(say_hello()) # Test with no argument (should use default "Hello there!")
print(say_hello(name=None)) # Test with name explicitly as None (should use default "Hello there!")
```

---

**2\. 定義子代理（Greeting & Farewell）**

現在，為我們的專家建立 `Agent` 實例。請注意他們高度聚焦的 `instruction`，以及最重要的，他們明確的 `description`。`description` 是*根代理*用來決定*何時*將任務委派給這些子代理的主要資訊。

**最佳實踐：** 子代理的 `description` 欄位應準確且簡明地總結其特定能力。這對於實現有效的自動委派至關重要。

**最佳實踐：** 子代理的 `instruction` 欄位應針對其有限的範疇量身打造，明確告訴他們該做什麼，以及*不該*做什麼（例如：「你的*唯一*任務是……」）。


```python
# @title Define Greeting and Farewell Sub-Agents

# If you want to use models other than Gemini, Ensure LiteLlm is imported and API keys are set (from Step 0/2)
# from google.adk.models.lite_llm import LiteLlm
# MODEL_GPT_4O, MODEL_CLAUDE_SONNET etc. should be defined
# Or else, continue to use: model = MODEL_GEMINI_2_0_FLASH

# --- Greeting Agent ---
greeting_agent = None
try:
    greeting_agent = Agent(
        # Using a potentially different/cheaper model for a simple task
        model = MODEL_GEMINI_2_0_FLASH,
        # model=LiteLlm(model=MODEL_GPT_4O), # If you would like to experiment with other models
        name="greeting_agent",
        instruction="You are the Greeting Agent. Your ONLY task is to provide a friendly greeting to the user. "
                    "Use the 'say_hello' tool to generate the greeting. "
                    "If the user provides their name, make sure to pass it to the tool. "
                    "Do not engage in any other conversation or tasks.",
        description="Handles simple greetings and hellos using the 'say_hello' tool.", # Crucial for delegation
        tools=[say_hello],
    )
    print(f"✅ Agent '{greeting_agent.name}' created using model '{greeting_agent.model}'.")
except Exception as e:
    print(f"❌ Could not create Greeting agent. Check API Key ({greeting_agent.model}). Error: {e}")

# --- Farewell Agent ---
farewell_agent = None
try:
    farewell_agent = Agent(
        # Can use the same or a different model
        model = MODEL_GEMINI_2_0_FLASH,
        # model=LiteLlm(model=MODEL_GPT_4O), # If you would like to experiment with other models
        name="farewell_agent",
        instruction="You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message. "
                    "Use the 'say_goodbye' tool when the user indicates they are leaving or ending the conversation "
                    "(e.g., using words like 'bye', 'goodbye', 'thanks bye', 'see you'). "
                    "Do not perform any other actions.",
        description="Handles simple farewells and goodbyes using the 'say_goodbye' tool.", # Crucial for delegation
        tools=[say_goodbye],
    )
    print(f"✅ Agent '{farewell_agent.name}' created using model '{farewell_agent.model}'.")
except Exception as e:
    print(f"❌ Could not create Farewell agent. Check API Key ({farewell_agent.model}). Error: {e}")
```

---

**3\. 定義 Root Agent（Weather Agent v2）及其子代理**

現在，我們要升級`weather_agent`。主要變更如下：

* 新增`sub_agents`參數：我們傳入一個包含剛剛建立的`greeting_agent`和`farewell_agent`實例的清單。
* 更新`instruction`：我們明確告訴 root agent 關於其子代理的資訊，以及應該在何時將任務委派給它們。

**關鍵概念：自動委派（Auto Flow）**  
透過提供`sub_agents`清單，Agent Development Kit (ADK) 支援自動委派。當 root agent 收到使用者查詢時，其大型語言模型 (LLM) 不僅會考慮自身的指令與工具，還會參考每個子代理的`description`。如果 LLM 判斷某個查詢更符合某個子代理所描述的能力（例如：「處理簡單問候語」），它會自動產生一個特殊的內部動作，*將控制權轉移*給該子代理處理該回合。子代理會使用自己的模型、指令和工具來處理該查詢。

**最佳實踐：**  
請確保 root agent 的指令能夠明確引導其委派決策。請在指令中提及子代理的名稱，並描述應該在什麼情況下進行委派。


```python
# @title Define the Root Agent with Sub-Agents

# Ensure sub-agents were created successfully before defining the root agent.
# Also ensure the original 'get_weather' tool is defined.
root_agent = None
runner_root = None # Initialize runner

if greeting_agent and farewell_agent and 'get_weather' in globals():
    # Let's use a capable Gemini model for the root agent to handle orchestration
    root_agent_model = MODEL_GEMINI_2_0_FLASH

    weather_agent_team = Agent(
        name="weather_agent_v2", # Give it a new version name
        model=root_agent_model,
        description="The main coordinator agent. Handles weather requests and delegates greetings/farewells to specialists.",
        instruction="You are the main Weather Agent coordinating a team. Your primary responsibility is to provide weather information. "
                    "Use the 'get_weather' tool ONLY for specific weather requests (e.g., 'weather in London'). "
                    "You have specialized sub-agents: "
                    "1. 'greeting_agent': Handles simple greetings like 'Hi', 'Hello'. Delegate to it for these. "
                    "2. 'farewell_agent': Handles simple farewells like 'Bye', 'See you'. Delegate to it for these. "
                    "Analyze the user's query. If it's a greeting, delegate to 'greeting_agent'. If it's a farewell, delegate to 'farewell_agent'. "
                    "If it's a weather request, handle it yourself using 'get_weather'. "
                    "For anything else, respond appropriately or state you cannot handle it.",
        tools=[get_weather], # Root agent still needs the weather tool for its core task
        # Key change: Link the sub-agents here!
        sub_agents=[greeting_agent, farewell_agent]
    )
    print(f"✅ Root Agent '{weather_agent_team.name}' created using model '{root_agent_model}' with sub-agents: {[sa.name for sa in weather_agent_team.sub_agents]}")

else:
    print("❌ Cannot create root agent because one or more sub-agents failed to initialize or 'get_weather' tool is missing.")
    if not greeting_agent: print(" - Greeting Agent is missing.")
    if not farewell_agent: print(" - Farewell Agent is missing.")
    if 'get_weather' not in globals(): print(" - get_weather function is missing.")


```

---

**4\. 與 Agent 團隊互動**

現在我們已經定義好根 agent（`weather_agent_team`——*注意：請確保此變數名稱與前一個程式碼區塊中定義的名稱一致，很可能是 `# @title Define the Root Agent with Sub-Agents`，也許命名為 `root_agent`*）以及其專門的子 agent，接下來讓我們來測試委派（delegation）機制。

以下程式碼區塊將會：

1.  定義一個 `async` 函式 `run_team_conversation`。
2.  在這個函式內，建立一個*全新且專用*的 `InMemorySessionService` 以及一個特定的 session（`session_001_agent_team`），僅用於這次測試。這樣可以將對話歷史隔離，便於測試團隊互動的動態。
3.  建立一個 `Runner`（`runner_agent_team`），並設定為使用我們的 `weather_agent_team`（根 agent）以及專用的 session 服務。
4.  使用我們更新後的 `call_agent_async` 函式，向 `runner_agent_team` 發送不同類型的查詢（問候、天氣查詢、道別）。在這個測試中，我們會明確傳入 runner、使用者 ID 以及 session ID。
5.  立即執行 `run_team_conversation` 函式。

預期流程如下：

1.  "Hello there!" 查詢會傳送給 `runner_agent_team`。
2.  根 agent（`weather_agent_team`）收到查詢後，根據其指令以及 `greeting_agent` 的描述，將任務委派出去。
3.  `greeting_agent` 處理該查詢，呼叫其 `say_hello` 工具，並產生回應。
4.  "What is the weather in New York?" 查詢*不會*被委派，而是由根 agent 直接使用其 `get_weather` 工具處理。
5.  "Thanks, bye!" 查詢則會被委派給 `farewell_agent`，並由其 `say_goodbye` 工具處理。




```python
# @title Interact with the Agent Team
import asyncio # Ensure asyncio is imported

# Ensure the root agent (e.g., 'weather_agent_team' or 'root_agent' from the previous cell) is defined.
# Ensure the call_agent_async function is defined.

# Check if the root agent variable exists before defining the conversation function
root_agent_var_name = 'root_agent' # Default name from Step 3 guide
if 'weather_agent_team' in globals(): # Check if user used this name instead
    root_agent_var_name = 'weather_agent_team'
elif 'root_agent' not in globals():
    print("⚠️ Root agent ('root_agent' or 'weather_agent_team') not found. Cannot define run_team_conversation.")
    # Assign a dummy value to prevent NameError later if the code block runs anyway
    root_agent = None # Or set a flag to prevent execution

# Only define and run if the root agent exists
if root_agent_var_name in globals() and globals()[root_agent_var_name]:
    # Define the main async function for the conversation logic.
    # The 'await' keywords INSIDE this function are necessary for async operations.
    async def run_team_conversation():
        print("\n--- Testing Agent Team Delegation ---")
        session_service = InMemorySessionService()
        APP_NAME = "weather_tutorial_agent_team"
        USER_ID = "user_1_agent_team"
        SESSION_ID = "session_001_agent_team"
        session = await session_service.create_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
        )
        print(f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'")

        actual_root_agent = globals()[root_agent_var_name]
        runner_agent_team = Runner( # Or use InMemoryRunner
            agent=actual_root_agent,
            app_name=APP_NAME,
            session_service=session_service
        )
        print(f"Runner created for agent '{actual_root_agent.name}'.")

        # --- Interactions using await (correct within async def) ---
        await call_agent_async(query = "Hello there!",
                               runner=runner_agent_team,
                               user_id=USER_ID,
                               session_id=SESSION_ID)
        await call_agent_async(query = "What is the weather in New York?",
                               runner=runner_agent_team,
                               user_id=USER_ID,
                               session_id=SESSION_ID)
        await call_agent_async(query = "Thanks, bye!",
                               runner=runner_agent_team,
                               user_id=USER_ID,
                               session_id=SESSION_ID)

    # --- Execute the `run_team_conversation` async function ---
    # Choose ONE of the methods below based on your environment.
    # Note: This may require API keys for the models used!

    # METHOD 1: Direct await (Default for Notebooks/Async REPLs)
    # If your environment supports top-level await (like Colab/Jupyter notebooks),
    # it means an event loop is already running, so you can directly await the function.
    print("Attempting execution using 'await' (default for notebooks)...")
    await run_team_conversation()

    # METHOD 2: asyncio.run (For Standard Python Scripts [.py])
    # If running this code as a standard Python script from your terminal,
    # the script context is synchronous. `asyncio.run()` is needed to
    # create and manage an event loop to execute your async function.
    # To use this method:
    # 1. Comment out the `await run_team_conversation()` line above.
    # 2. Uncomment the following block:
    """
    import asyncio
    if __name__ == "__main__": # Ensures this runs only when script is executed directly
        print("Executing using 'asyncio.run()' (for standard Python scripts)...")
        try:
            # This creates an event loop, runs your async function, and closes the loop.
            asyncio.run(run_team_conversation())
        except Exception as e:
            print(f"An error occurred: {e}")
    """

else:
    # This message prints if the root agent variable wasn't found earlier
    print("\n⚠️ Skipping agent team conversation execution as the root agent was not successfully defined in a previous step.")
```

---

請仔細觀察輸出日誌，特別是`--- Tool: ... called ---`訊息。你應該會看到：

*   對於 "Hello there!"，呼叫了`say_hello`工具（表示由`greeting_agent`處理）。
*   對於 "What is the weather in New York?"，呼叫了`get_weather`工具（表示由 root agent 處理）。
*   對於 "Thanks, bye!"，呼叫了`say_goodbye`工具（表示由`farewell_agent`處理）。

這證實了**自動委派**的成功！root agent 依據其指令以及其`sub_agents`的`description`，正確地將使用者請求路由給團隊中合適的專家 agent。

你現在已經用多個協作 agent 結構化了你的應用程式。這種模組化設計是建構更複雜且更強大 agent 系統的基礎。在下一步中，我們將讓 agent 具備在多輪對話中記住資訊的能力，透過 session state（會話狀態）來實現。

## 步驟 4：使用 Session State 增加記憶與個人化

到目前為止，我們的 agent 團隊可以透過委派處理不同任務，但每次互動都會重新開始——agent 在同一個 session 內不會記住過去的對話或使用者偏好。為了打造更精緻且具上下文感知的體驗，agent 需要**記憶**。Agent Development Kit (ADK) 透過**Session State（會話狀態）**來實現這一點。

**什麼是 Session State？**

* 它是一個與特定使用者 session 綁定的 Python 字典（`session.state`）（由`APP_NAME`、`USER_ID`、`SESSION_ID`標識）。
* 它可以在同一 session 內*多輪對話間*持續保存資訊。
* agent 和工具（Tool）都可以讀寫這個狀態，讓他們能記住細節、調整行為，以及個人化回應。

**Agent 如何與 State 互動：**

1. **`ToolContext`（主要方法）：** 工具可以接受一個`ToolContext`物件（如果宣告為最後一個參數，ADK 會自動提供）。這個物件可透過`tool_context.state`直接存取 session state，讓工具在執行*過程中*讀取偏好或儲存結果。
2. **`output_key`（自動儲存 agent 回應）：** `Agent`可以設定`output_key="your_key"`。此時 ADK 會自動將 agent 當前輪的最終文字回應儲存到`session.state["your_key"]`。

**在這一步，我們將透過以下方式強化 Weather Bot 團隊：**

1. 使用一個**新的**`InMemorySessionService`，單獨展示 state 的運作。
2. 以使用者偏好的`temperature_unit`初始化 session state。
3. 建立一個能感知 state 的 weather tool（`get_weather_stateful`），透過`ToolContext`讀取偏好並調整輸出格式（攝氏／華氏）。
4. 更新 root agent，使其使用這個有狀態的工具，並設定`output_key`，自動將最終天氣報告儲存到 session state。
5. 執行一段對話，觀察初始 state 如何影響工具、手動變更 state 如何改變後續行為，以及`output_key`如何持久化 agent 回應。

---

**1\. 初始化新的 Session Service 與 State**

為了清楚展示 state 管理且不受前面步驟影響，我們將實例化一個新的`InMemorySessionService`。同時建立一個 session，並以使用者偏好的溫度單位作為初始 state。


```python
# @title 1. Initialize New Session Service and State

# Import necessary session components
from google.adk.sessions import InMemorySessionService

# Create a NEW session service instance for this state demonstration
session_service_stateful = InMemorySessionService()
print("✅ New InMemorySessionService created for state demonstration.")

# Define a NEW session ID for this part of the tutorial
SESSION_ID_STATEFUL = "session_state_demo_001"
USER_ID_STATEFUL = "user_state_demo"

# Define initial state data - user prefers Celsius initially
initial_state = {
    "user_preference_temperature_unit": "Celsius"
}

# Create the session, providing the initial state
session_stateful = await session_service_stateful.create_session(
    app_name=APP_NAME, # Use the consistent app name
    user_id=USER_ID_STATEFUL,
    session_id=SESSION_ID_STATEFUL,
    state=initial_state # <<< Initialize state during creation
)
print(f"✅ Session '{SESSION_ID_STATEFUL}' created for user '{USER_ID_STATEFUL}'.")

# Verify the initial state was set correctly
retrieved_session = await session_service_stateful.get_session(app_name=APP_NAME,
                                                         user_id=USER_ID_STATEFUL,
                                                         session_id = SESSION_ID_STATEFUL)
print("\n--- Initial Session State ---")
if retrieved_session:
    print(retrieved_session.state)
else:
    print("Error: Could not retrieve session.")
```

---

**2\. 建立具備狀態感知的天氣工具（`get_weather_stateful`）**

現在，我們要建立新版的天氣工具。其主要特色是接受`tool_context: ToolContext`，這讓它能夠存取`tool_context.state`。它會讀取`user_preference_temperature_unit`，並根據其內容格式化溫度。

* **重點概念：`ToolContext`** 這個物件是讓你的工具邏輯能與工作階段的上下文互動的橋樑，包括讀取與寫入狀態變數。如果你的工具函式將它定義為最後一個參數，Agent Development Kit (ADK) 會自動注入它。

* **最佳實踐：** 當從狀態中讀取資料時，請使用`dictionary.get('key', default_value)`來處理鍵尚未存在的情況，確保你的工具不會因此當機。


```python
from google.adk.tools.tool_context import ToolContext

def get_weather_stateful(city: str, tool_context: ToolContext) -> dict:
    """Retrieves weather, converts temp unit based on session state."""
    print(f"--- Tool: get_weather_stateful called for {city} ---")

    # --- Read preference from state ---
    preferred_unit = tool_context.state.get("user_preference_temperature_unit", "Celsius") # Default to Celsius
    print(f"--- Tool: Reading state 'user_preference_temperature_unit': {preferred_unit} ---")

    city_normalized = city.lower().replace(" ", "")

    # Mock weather data (always stored in Celsius internally)
    mock_weather_db = {
        "newyork": {"temp_c": 25, "condition": "sunny"},
        "london": {"temp_c": 15, "condition": "cloudy"},
        "tokyo": {"temp_c": 18, "condition": "light rain"},
    }

    if city_normalized in mock_weather_db:
        data = mock_weather_db[city_normalized]
        temp_c = data["temp_c"]
        condition = data["condition"]

        # Format temperature based on state preference
        if preferred_unit == "Fahrenheit":
            temp_value = (temp_c * 9/5) + 32 # Calculate Fahrenheit
            temp_unit = "°F"
        else: # Default to Celsius
            temp_value = temp_c
            temp_unit = "°C"

        report = f"The weather in {city.capitalize()} is {condition} with a temperature of {temp_value:.0f}{temp_unit}."
        result = {"status": "success", "report": report}
        print(f"--- Tool: Generated report in {preferred_unit}. Result: {result} ---")

        # Example of writing back to state (optional for this tool)
        tool_context.state["last_city_checked_stateful"] = city
        print(f"--- Tool: Updated state 'last_city_checked_stateful': {city} ---")

        return result
    else:
        # Handle city not found
        error_msg = f"Sorry, I don't have weather information for '{city}'."
        print(f"--- Tool: City '{city}' not found. ---")
        return {"status": "error", "error_message": error_msg}

print("✅ State-aware 'get_weather_stateful' tool defined.")

```

---

**3\. 重新定義子代理並更新根代理**

為了確保這個步驟是自給自足且能正確建構，我們首先會將 `greeting_agent` 和 `farewell_agent` 完全按照步驟 3 的方式重新定義。接著，我們會定義新的根代理（`weather_agent_v4_stateful`）：

* 它會使用新的 `get_weather_stateful` 工具。  
* 它會包含 greeting 和 farewell 子代理，以便進行委派。  
* **最重要的是**，它會設定 `output_key="last_weather_report"`，自動將最終的天氣回應儲存到 session 狀態中。


```python
# @title 3. Redefine Sub-Agents and Update Root Agent with output_key

# Ensure necessary imports: Agent, LiteLlm, Runner
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
# Ensure tools 'say_hello', 'say_goodbye' are defined (from Step 3)
# Ensure model constants MODEL_GPT_4O, MODEL_GEMINI_2_0_FLASH etc. are defined

# --- Redefine Greeting Agent (from Step 3) ---
greeting_agent = None
try:
    greeting_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="greeting_agent",
        instruction="You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description="Handles simple greetings and hellos using the 'say_hello' tool.",
        tools=[say_hello],
    )
    print(f"✅ Agent '{greeting_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Greeting agent. Error: {e}")

# --- Redefine Farewell Agent (from Step 3) ---
farewell_agent = None
try:
    farewell_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="farewell_agent",
        instruction="You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description="Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools=[say_goodbye],
    )
    print(f"✅ Agent '{farewell_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Farewell agent. Error: {e}")

# --- Define the Updated Root Agent ---
root_agent_stateful = None
runner_root_stateful = None # Initialize runner

# Check prerequisites before creating the root agent
if greeting_agent and farewell_agent and 'get_weather_stateful' in globals():

    root_agent_model = MODEL_GEMINI_2_0_FLASH # Choose orchestration model

    root_agent_stateful = Agent(
        name="weather_agent_v4_stateful", # New version name
        model=root_agent_model,
        description="Main agent: Provides weather (state-aware unit), delegates greetings/farewells, saves report to state.",
        instruction="You are the main Weather Agent. Your job is to provide weather using 'get_weather_stateful'. "
                    "The tool will format the temperature based on user preference stored in state. "
                    "Delegate simple greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                    "Handle only weather requests, greetings, and farewells.",
        tools=[get_weather_stateful], # Use the state-aware tool
        sub_agents=[greeting_agent, farewell_agent], # Include sub-agents
        output_key="last_weather_report" # <<< Auto-save agent's final weather response
    )
    print(f"✅ Root Agent '{root_agent_stateful.name}' created using stateful tool and output_key.")

    # --- Create Runner for this Root Agent & NEW Session Service ---
    runner_root_stateful = Runner(
        agent=root_agent_stateful,
        app_name=APP_NAME,
        session_service=session_service_stateful # Use the NEW stateful session service
    )
    print(f"✅ Runner created for stateful root agent '{runner_root_stateful.agent.name}' using stateful session service.")

else:
    print("❌ Cannot create stateful root agent. Prerequisites missing.")
    if not greeting_agent: print(" - greeting_agent definition missing.")
    if not farewell_agent: print(" - farewell_agent definition missing.")
    if 'get_weather_stateful' not in globals(): print(" - get_weather_stateful tool missing.")

```

---

**4\. 互動與測試狀態流程**

現在，讓我們執行一段對話，來測試狀態互動，這裡會使用`runner_root_stateful`（與我們的有狀態 agent 及`session_service_stateful`相關聯）。我們將使用前面定義的`call_agent_async`函式，並確保傳入正確的 runner、使用者 ID（`USER_ID_STATEFUL`）以及 session ID（`SESSION_ID_STATEFUL`）。

對話流程如下：

1.  **查詢天氣（倫敦）：** `get_weather_stateful`工具應該會從第一節初始化的 session 狀態中讀取初始的「Celsius」偏好設定。根 agent 的最終回應（攝氏天氣報告）應透過`output_key`設定儲存到`state['last_weather_report']`。
2.  **手動更新狀態：** 我們將*直接修改*儲存在`InMemorySessionService`實例（`session_service_stateful`）中的狀態。
    *   **為什麼要直接修改？** `session_service.get_session()`方法會回傳 session 的*複本*。修改這個複本不會影響後續 agent 執行時所用的狀態。針對這個`InMemorySessionService`測試情境，我們會存取內部的`sessions`字典，將實際儲存的`user_preference_temperature_unit`狀態值改為「Fahrenheit」。*注意：在實際應用中，狀態變更通常是由工具或 agent 邏輯回傳`EventActions(state_delta=...)`來觸發，而不是直接手動修改。*
3.  **再次查詢天氣（紐約）：** `get_weather_stateful`工具現在應該會從狀態中讀取已更新的「Fahrenheit」偏好，並相應轉換溫度。由於`output_key`，根 agent 的*新*回應（華氏天氣）會覆蓋先前儲存在`state['last_weather_report']`的值。
4.  **向 agent 打招呼：** 驗證委派給`greeting_agent`的功能在有狀態操作下依然正常。這次互動將成為這個特定流程中由`output_key`儲存的*最後*一個回應。
5.  **檢查最終狀態：** 對話結束後，我們會再取出一次 session（取得複本），並列印其狀態，以確認`user_preference_temperature_unit`確實為「Fahrenheit」，觀察由`output_key`儲存的最終值（這次會是打招呼的內容），以及由工具寫入的`last_city_checked_stateful`值。



```python
# @title 4. Interact to Test State Flow and output_key
import asyncio # Ensure asyncio is imported

# Ensure the stateful runner (runner_root_stateful) is available from the previous cell
# Ensure call_agent_async, USER_ID_STATEFUL, SESSION_ID_STATEFUL, APP_NAME are defined

if 'runner_root_stateful' in globals() and runner_root_stateful:
    # Define the main async function for the stateful conversation logic.
    # The 'await' keywords INSIDE this function are necessary for async operations.
    async def run_stateful_conversation():
        print("\n--- Testing State: Temp Unit Conversion & output_key ---")

        # 1. Check weather (Uses initial state: Celsius)
        print("--- Turn 1: Requesting weather in London (expect Celsius) ---")
        await call_agent_async(query= "What's the weather in London?",
                               runner=runner_root_stateful,
                               user_id=USER_ID_STATEFUL,
                               session_id=SESSION_ID_STATEFUL
                              )

        # 2. Manually update state preference to Fahrenheit - DIRECTLY MODIFY STORAGE
        print("\n--- Manually Updating State: Setting unit to Fahrenheit ---")
        try:
            # Access the internal storage directly - THIS IS SPECIFIC TO InMemorySessionService for testing
            # NOTE: In production with persistent services (Database, VertexAI), you would
            # typically update state via agent actions or specific service APIs if available,
            # not by direct manipulation of internal storage.
            stored_session = session_service_stateful.sessions[APP_NAME][USER_ID_STATEFUL][SESSION_ID_STATEFUL]
            stored_session.state["user_preference_temperature_unit"] = "Fahrenheit"
            # Optional: You might want to update the timestamp as well if any logic depends on it
            # import time
            # stored_session.last_update_time = time.time()
            print(f"--- Stored session state updated. Current 'user_preference_temperature_unit': {stored_session.state.get('user_preference_temperature_unit', 'Not Set')} ---") # Added .get for safety
        except KeyError:
            print(f"--- Error: Could not retrieve session '{SESSION_ID_STATEFUL}' from internal storage for user '{USER_ID_STATEFUL}' in app '{APP_NAME}' to update state. Check IDs and if session was created. ---")
        except Exception as e:
             print(f"--- Error updating internal session state: {e} ---")

        # 3. Check weather again (Tool should now use Fahrenheit)
        # This will also update 'last_weather_report' via output_key
        print("\n--- Turn 2: Requesting weather in New York (expect Fahrenheit) ---")
        await call_agent_async(query= "Tell me the weather in New York.",
                               runner=runner_root_stateful,
                               user_id=USER_ID_STATEFUL,
                               session_id=SESSION_ID_STATEFUL
                              )

        # 4. Test basic delegation (should still work)
        # This will update 'last_weather_report' again, overwriting the NY weather report
        print("\n--- Turn 3: Sending a greeting ---")
        await call_agent_async(query= "Hi!",
                               runner=runner_root_stateful,
                               user_id=USER_ID_STATEFUL,
                               session_id=SESSION_ID_STATEFUL
                              )

    # --- Execute the `run_stateful_conversation` async function ---
    # Choose ONE of the methods below based on your environment.

    # METHOD 1: Direct await (Default for Notebooks/Async REPLs)
    # If your environment supports top-level await (like Colab/Jupyter notebooks),
    # it means an event loop is already running, so you can directly await the function.
    print("Attempting execution using 'await' (default for notebooks)...")
    await run_stateful_conversation()

    # METHOD 2: asyncio.run (For Standard Python Scripts [.py])
    # If running this code as a standard Python script from your terminal,
    # the script context is synchronous. `asyncio.run()` is needed to
    # create and manage an event loop to execute your async function.
    # To use this method:
    # 1. Comment out the `await run_stateful_conversation()` line above.
    # 2. Uncomment the following block:
    """
    import asyncio
    if __name__ == "__main__": # Ensures this runs only when script is executed directly
        print("Executing using 'asyncio.run()' (for standard Python scripts)...")
        try:
            # This creates an event loop, runs your async function, and closes the loop.
            asyncio.run(run_stateful_conversation())
        except Exception as e:
            print(f"An error occurred: {e}")
    """

    # --- Inspect final session state after the conversation ---
    # This block runs after either execution method completes.
    print("\n--- Inspecting Final Session State ---")
    final_session = await session_service_stateful.get_session(app_name=APP_NAME,
                                                         user_id= USER_ID_STATEFUL,
                                                         session_id=SESSION_ID_STATEFUL)
    if final_session:
        # Use .get() for safer access to potentially missing keys
        print(f"Final Preference: {final_session.state.get('user_preference_temperature_unit', 'Not Set')}")
        print(f"Final Last Weather Report (from output_key): {final_session.state.get('last_weather_report', 'Not Set')}")
        print(f"Final Last City Checked (by tool): {final_session.state.get('last_city_checked_stateful', 'Not Set')}")
        # Print full state for detailed view
        # print(f"Full State Dict: {final_session.state}") # For detailed view
    else:
        print("\n❌ Error: Could not retrieve final session state.")

else:
    print("\n⚠️ Skipping state test conversation. Stateful root agent runner ('runner_root_stateful') is not available.")
```

---

透過檢查對話流程與最終的 session 狀態輸出，你可以確認以下幾點：

*   **狀態讀取：** 天氣工具（`get_weather_stateful`）正確地從狀態中讀取了 `user_preference_temperature_unit`，最初對倫敦使用了「Celsius」。
*   **狀態更新：** 直接修改成功地將儲存的偏好更改為「Fahrenheit」。
*   **狀態讀取（已更新）：** 工具隨後在查詢紐約天氣時讀取到「Fahrenheit」，並進行了轉換。
*   **工具狀態寫入：** 工具成功地透過 `tool_context.state`，將 `last_city_checked_stateful`（第二次查詢天氣後的「New York」）寫入狀態。
*   **委派：** 即使在狀態被修改後，對 `greeting_agent` 的「Hi!」委派仍能正確運作。
*   **`output_key`：** `output_key="last_weather_report"` 成功地將 root agent 每一輪 *最終* 的回應儲存下來，只要是 root agent 最終回應的輪次都會被覆寫。在這個流程中，最後的回應是問候語（"Hello, there!"），因此該內容覆寫了狀態鍵中的天氣報告。
*   **最終狀態：** 最後的檢查確認偏好設定已持續為「Fahrenheit」。

你現在已經成功整合 session 狀態，透過 `ToolContext` 來個人化 agent 行為，並手動操作狀態以測試 `InMemorySessionService`，同時觀察到 `output_key` 如何提供一個簡單機制，將 agent 的最後回應儲存到狀態中。這些關於狀態管理的基礎知識，將有助於我們在下一步利用 callback 實作安全防護措施。

---

## 步驟 5：加入安全防護 \- 使用 `before_model_callback` 進行輸入防護

我們的 agent 團隊越來越強大，能夠記住偏好並有效運用工具。然而，在實際應用情境中，我們經常需要在潛在有問題的請求進入核心大型語言模型 (LLM) *之前*，先行設置安全機制來控管 agent 的行為。

Agent Development Kit (ADK) 提供了 **Callback**（回呼函式）——允許你在 agent 執行生命週期的特定階段插入自訂邏輯。`before_model_callback` 對於輸入安全特別有用。

**什麼是 `before_model_callback`？**

* 這是一個你自行定義的 Python 函式，ADK 會在 agent 準備將彙整好的請求（包含對話歷史、指令與最新使用者訊息）送往底層 LLM 前 *立即* 執行。
* **用途：** 檢查請求內容，必要時加以修改，或根據預設規則完全阻擋請求。

**常見應用情境：**

* **輸入驗證／過濾：** 檢查使用者輸入是否符合條件，或是否包含禁止內容（如個資或特定關鍵字）。
* **安全防護（Guardrails）：** 防止有害、離題或違反政策的請求被送往 LLM 處理。
* **動態提示詞修改：** 在送出 LLM 請求前，將即時資訊（例如 session 狀態）加入請求上下文。

**運作方式：**

1. 定義一個接受 `callback_context: CallbackContext` 與 `llm_request: LlmRequest` 的函式。

    * `callback_context`：提供 agent 資訊、session 狀態（`callback_context.state`）等存取權限。
    * `llm_request`：包含預計送往 LLM 的完整 payload（`contents`、`config`）。

2. 在函式內部：

    * **檢查：** 檢視 `llm_request.contents`（特別是最後一則使用者訊息）。
    * **修改（請謹慎）：** 你 *可以* 修改 `llm_request` 的部分內容。
    * **阻擋（安全防護）：** 回傳 `LlmResponse` 物件。ADK 會立即將此回應返回，*跳過* 本輪的 LLM 呼叫。
    * **允許：** 回傳 `None`。ADK 會以（可能已被修改的）請求繼續呼叫 LLM。

**本步驟將會：**

1. 定義一個 `before_model_callback` 函式（`block_keyword_guardrail`），檢查使用者輸入是否包含特定關鍵字（"BLOCK"）。
2. 更新我們的有狀態 root agent（步驟 4 的 `weather_agent_v4_stateful`），使其使用這個 callback。
3. 建立一個新的 runner，並將其與這個更新後的 agent 綁定，但仍使用 *相同的有狀態 session 服務* 以維持狀態連續性。
4. 測試安全防護，分別傳送一般請求與包含關鍵字的請求。

---

**1\. 定義安全防護 Callback 函式**

這個函式會檢查 `llm_request` 內容中的最後一則使用者訊息。如果發現有「BLOCK」（不分大小寫），就會組建並回傳 `LlmResponse` 以阻擋流程；否則則回傳 `None`。  


```python
# @title 1. Define the before_model_callback Guardrail

# Ensure necessary imports are available
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types # For creating response content
from typing import Optional

def block_keyword_guardrail(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """
    Inspects the latest user message for 'BLOCK'. If found, blocks the LLM call
    and returns a predefined LlmResponse. Otherwise, returns None to proceed.
    """
    agent_name = callback_context.agent_name # Get the name of the agent whose model call is being intercepted
    print(f"--- Callback: block_keyword_guardrail running for agent: {agent_name} ---")

    # Extract the text from the latest user message in the request history
    last_user_message_text = ""
    if llm_request.contents:
        # Find the most recent message with role 'user'
        for content in reversed(llm_request.contents):
            if content.role == 'user' and content.parts:
                # Assuming text is in the first part for simplicity
                if content.parts[0].text:
                    last_user_message_text = content.parts[0].text
                    break # Found the last user message text

    print(f"--- Callback: Inspecting last user message: '{last_user_message_text[:100]}...' ---") # Log first 100 chars

    # --- Guardrail Logic ---
    keyword_to_block = "BLOCK"
    if keyword_to_block in last_user_message_text.upper(): # Case-insensitive check
        print(f"--- Callback: Found '{keyword_to_block}'. Blocking LLM call! ---")
        # Optionally, set a flag in state to record the block event
        callback_context.state["guardrail_block_keyword_triggered"] = True
        print(f"--- Callback: Set state 'guardrail_block_keyword_triggered': True ---")

        # Construct and return an LlmResponse to stop the flow and send this back instead
        return LlmResponse(
            content=types.Content(
                role="model", # Mimic a response from the agent's perspective
                parts=[types.Part(text=f"I cannot process this request because it contains the blocked keyword '{keyword_to_block}'.")],
            )
            # Note: You could also set an error_message field here if needed
        )
    else:
        # Keyword not found, allow the request to proceed to the LLM
        print(f"--- Callback: Keyword not found. Allowing LLM call for {agent_name}. ---")
        return None # Returning None signals ADK to continue normally

print("✅ block_keyword_guardrail function defined.")

```

---

**2\. 更新 Root Agent 以使用 Callback**

我們重新定義 root agent，新增 `before_model_callback` 參數，並將其指向我們新建立的 guardrail 函式。為了清楚起見，我們會給它一個新的版本名稱。

*重要提示：* 如果子代理（`greeting_agent`、`farewell_agent`）以及有狀態工具（`get_weather_stateful`）尚未在前面的步驟中定義，則需要在此情境下重新定義，確保 root agent 的定義能夠存取到所有相關元件。


```python
# @title 2. Update Root Agent with before_model_callback


# --- Redefine Sub-Agents (Ensures they exist in this context) ---
greeting_agent = None
try:
    # Use a defined model constant
    greeting_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="greeting_agent", # Keep original name for consistency
        instruction="You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description="Handles simple greetings and hellos using the 'say_hello' tool.",
        tools=[say_hello],
    )
    print(f"✅ Sub-Agent '{greeting_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Greeting agent. Check Model/API Key ({greeting_agent.model}). Error: {e}")

farewell_agent = None
try:
    # Use a defined model constant
    farewell_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="farewell_agent", # Keep original name
        instruction="You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description="Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools=[say_goodbye],
    )
    print(f"✅ Sub-Agent '{farewell_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Farewell agent. Check Model/API Key ({farewell_agent.model}). Error: {e}")


# --- Define the Root Agent with the Callback ---
root_agent_model_guardrail = None
runner_root_model_guardrail = None

# Check all components before proceeding
if greeting_agent and farewell_agent and 'get_weather_stateful' in globals() and 'block_keyword_guardrail' in globals():

    # Use a defined model constant
    root_agent_model = MODEL_GEMINI_2_0_FLASH

    root_agent_model_guardrail = Agent(
        name="weather_agent_v5_model_guardrail", # New version name for clarity
        model=root_agent_model,
        description="Main agent: Handles weather, delegates greetings/farewells, includes input keyword guardrail.",
        instruction="You are the main Weather Agent. Provide weather using 'get_weather_stateful'. "
                    "Delegate simple greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                    "Handle only weather requests, greetings, and farewells.",
        tools=[get_weather_stateful],
        sub_agents=[greeting_agent, farewell_agent], # Reference the redefined sub-agents
        output_key="last_weather_report", # Keep output_key from Step 4
        before_model_callback=block_keyword_guardrail # <<< Assign the guardrail callback
    )
    print(f"✅ Root Agent '{root_agent_model_guardrail.name}' created with before_model_callback.")

    # --- Create Runner for this Agent, Using SAME Stateful Session Service ---
    # Ensure session_service_stateful exists from Step 4
    if 'session_service_stateful' in globals():
        runner_root_model_guardrail = Runner(
            agent=root_agent_model_guardrail,
            app_name=APP_NAME, # Use consistent APP_NAME
            session_service=session_service_stateful # <<< Use the service from Step 4
        )
        print(f"✅ Runner created for guardrail agent '{runner_root_model_guardrail.agent.name}', using stateful session service.")
    else:
        print("❌ Cannot create runner. 'session_service_stateful' from Step 4 is missing.")

else:
    print("❌ Cannot create root agent with model guardrail. One or more prerequisites are missing or failed initialization:")
    if not greeting_agent: print("   - Greeting Agent")
    if not farewell_agent: print("   - Farewell Agent")
    if 'get_weather_stateful' not in globals(): print("   - 'get_weather_stateful' tool")
    if 'block_keyword_guardrail' not in globals(): print("   - 'block_keyword_guardrail' callback")
```

---

**3\. 互動測試 Guardrail**

讓我們來測試 guardrail 的行為。我們將使用*相同的 session*（`SESSION_ID_STATEFUL`）如步驟 4，以展示狀態在這些變更之間會持續保留。

1. 發送一個正常的天氣查詢請求（應該會通過 guardrail 並執行）。
2. 發送一個包含 "BLOCK" 的請求（應該會被 callback 攔截）。
3. 發送一個問候語（應該會通過 root agent 的 guardrail，被委派，並正常執行）。


```python
# @title 3. Interact to Test the Model Input Guardrail
import asyncio # Ensure asyncio is imported

# Ensure the runner for the guardrail agent is available
if 'runner_root_model_guardrail' in globals() and runner_root_model_guardrail:
    # Define the main async function for the guardrail test conversation.
    # The 'await' keywords INSIDE this function are necessary for async operations.
    async def run_guardrail_test_conversation():
        print("\n--- Testing Model Input Guardrail ---")

        # Use the runner for the agent with the callback and the existing stateful session ID
        # Define a helper lambda for cleaner interaction calls
        interaction_func = lambda query: call_agent_async(query,
                                                         runner_root_model_guardrail,
                                                         USER_ID_STATEFUL, # Use existing user ID
                                                         SESSION_ID_STATEFUL # Use existing session ID
                                                        )
        # 1. Normal request (Callback allows, should use Fahrenheit from previous state change)
        print("--- Turn 1: Requesting weather in London (expect allowed, Fahrenheit) ---")
        await interaction_func("What is the weather in London?")

        # 2. Request containing the blocked keyword (Callback intercepts)
        print("\n--- Turn 2: Requesting with blocked keyword (expect blocked) ---")
        await interaction_func("BLOCK the request for weather in Tokyo") # Callback should catch "BLOCK"

        # 3. Normal greeting (Callback allows root agent, delegation happens)
        print("\n--- Turn 3: Sending a greeting (expect allowed) ---")
        await interaction_func("Hello again")

    # --- Execute the `run_guardrail_test_conversation` async function ---
    # Choose ONE of the methods below based on your environment.

    # METHOD 1: Direct await (Default for Notebooks/Async REPLs)
    # If your environment supports top-level await (like Colab/Jupyter notebooks),
    # it means an event loop is already running, so you can directly await the function.
    print("Attempting execution using 'await' (default for notebooks)...")
    await run_guardrail_test_conversation()

    # METHOD 2: asyncio.run (For Standard Python Scripts [.py])
    # If running this code as a standard Python script from your terminal,
    # the script context is synchronous. `asyncio.run()` is needed to
    # create and manage an event loop to execute your async function.
    # To use this method:
    # 1. Comment out the `await run_guardrail_test_conversation()` line above.
    # 2. Uncomment the following block:
    """
    import asyncio
    if __name__ == "__main__": # Ensures this runs only when script is executed directly
        print("Executing using 'asyncio.run()' (for standard Python scripts)...")
        try:
            # This creates an event loop, runs your async function, and closes the loop.
            asyncio.run(run_guardrail_test_conversation())
        except Exception as e:
            print(f"An error occurred: {e}")
    """

    # --- Inspect final session state after the conversation ---
    # This block runs after either execution method completes.
    # Optional: Check state for the trigger flag set by the callback
    print("\n--- Inspecting Final Session State (After Guardrail Test) ---")
    # Use the session service instance associated with this stateful session
    final_session = await session_service_stateful.get_session(app_name=APP_NAME,
                                                         user_id=USER_ID_STATEFUL,
                                                         session_id=SESSION_ID_STATEFUL)
    if final_session:
        # Use .get() for safer access
        print(f"Guardrail Triggered Flag: {final_session.state.get('guardrail_block_keyword_triggered', 'Not Set (or False)')}")
        print(f"Last Weather Report: {final_session.state.get('last_weather_report', 'Not Set')}") # Should be London weather if successful
        print(f"Temperature Unit: {final_session.state.get('user_preference_temperature_unit', 'Not Set')}") # Should be Fahrenheit
        # print(f"Full State Dict: {final_session.state}") # For detailed view
    else:
        print("\n❌ Error: Could not retrieve final session state.")

else:
    print("\n⚠️ Skipping model guardrail test. Runner ('runner_root_model_guardrail') is not available.")
```

---

觀察執行流程：

1. **倫敦天氣：** 回呼函式針對 `weather_agent_v5_model_guardrail` 執行，檢查訊息，印出「未找到關鍵字。允許 LLM 呼叫。」並回傳 `None`。代理人（agent）繼續執行，呼叫 `get_weather_stateful` 工具（此工具會使用第 4 步狀態變更中的「Fahrenheit」偏好設定），並回傳天氣資訊。此回應會透過 `output_key` 更新 `last_weather_report`。  
2. **BLOCK 請求：** 回呼函式再次針對 `weather_agent_v5_model_guardrail` 執行，檢查訊息，發現「BLOCK」，印出「阻擋 LLM 呼叫！」，設置狀態旗標，並回傳預先定義的 `LlmResponse`。此回合代理人的底層大型語言模型 (LLM) *完全不會被呼叫*。使用者會看到回呼函式的阻擋訊息。  
3. **再次問候：** 回呼函式針對 `weather_agent_v5_model_guardrail` 執行，允許該請求。根代理人（root agent）接著委派給 `greeting_agent`。*注意：定義在根代理人上的 `before_model_callback` 並不會自動套用到子代理人（sub-agents）。* `greeting_agent` 會正常執行，呼叫其 `say_hello` 工具並回傳問候語。

你已成功實作了一層輸入安全防護！`before_model_callback` 提供了一個強大的機制，能在昂貴或潛在風險的 LLM 呼叫發生*之前*，強制執行規則並控制代理人行為。接下來，我們將套用類似概念，為工具本身的使用加上防護欄（guardrails）。

## 步驟 6：新增安全性 \- 工具參數防護欄（`before_tool_callback`）

在步驟 5 中，我們新增了一個防護欄，能在使用者輸入*到達* LLM 之前進行檢查並有可能阻擋。現在，我們要在 LLM 決定要使用某個工具、但*實際執行該工具之前*，再加一層控制。這對於驗證 LLM 想要傳遞給工具的*參數*非常有用。

Agent Development Kit (ADK) 為此目的提供了 `before_tool_callback`。

**什麼是 `before_tool_callback`？**

* 它是一個 Python 函式，在 LLM 請求使用特定工具並決定好參數後、該工具函式實際執行*之前*被執行。  
* **用途：** 驗證工具參數、根據特定輸入阻止工具執行、動態修改參數，或強制執行資源使用政策。

**常見應用情境：**

* **參數驗證：** 檢查 LLM 提供的參數是否有效、是否在允許範圍內，或是否符合預期格式。  
* **資源保護：** 防止工具被傳入可能高成本、存取受限資料，或可能造成不良副作用的輸入（例如：針對特定參數阻擋 API 呼叫）。  
* **動態參數修改：** 在工具執行前，根據會話狀態或其他情境資訊調整參數。

**運作方式：**

1. 定義一個接受 `tool: BaseTool`、`args: Dict[str, Any]` 和 `tool_context: ToolContext` 的函式。  

    * `tool`：即將被呼叫的工具物件（可檢查 `tool.name`）。  
    * `args`：LLM 為該工具產生的參數字典。  
    * `tool_context`：可存取會話狀態（`tool_context.state`）、代理人資訊等。  

2. 在函式內部：  

    * **檢查：** 檢查 `tool.name` 以及 `args` 字典。  
    * **修改：** 可*直接*變更 `args` 字典中的值。如果你回傳 `None`，工具將以這些修改過的參數執行。  
    * **阻擋/覆寫（防護欄）：** 回傳一個**字典**。Agent Development Kit (ADK) 會將這個字典視為工具呼叫的*結果*，完全*跳過*原本的工具函式執行。此字典理想上應符合該工具預期的回傳格式。  
    * **允許：** 回傳 `None`。ADK 會以（可能已修改的）參數執行實際的工具函式。

**在本步驟中，我們將：**

1. 定義一個 `before_tool_callback` 函式（`block_paris_tool_guardrail`），專門檢查是否有以城市「Paris」呼叫 `get_weather_stateful` 工具。  
2. 如果偵測到「Paris」，回呼函式將阻擋該工具並回傳自訂錯誤字典。  
3. 更新我們的根代理人（`weather_agent_v6_tool_guardrail`），同時包含 `before_model_callback` 以及這個新的 `before_tool_callback`。  
4. 為此代理人建立新的 runner，並使用相同的有狀態會話服務。  
5. 測試流程，請求允許城市與被阻擋城市（「Paris」）的天氣。

---

**1\. 定義工具防護欄回呼函式**

此函式針對 `get_weather_stateful` 工具。它會檢查 `city` 參數。如果是「Paris」，則回傳一個類似該工具錯誤回應的錯誤字典。否則，回傳 `None` 以允許工具執行。


```python
# @title 1. Define the before_tool_callback Guardrail

# Ensure necessary imports are available
from google.adk.tools.base_tool import BaseTool
from google.adk.tools.tool_context import ToolContext
from typing import Optional, Dict, Any # For type hints

def block_paris_tool_guardrail(
    tool: BaseTool, args: Dict[str, Any], tool_context: ToolContext
) -> Optional[Dict]:
    """
    Checks if 'get_weather_stateful' is called for 'Paris'.
    If so, blocks the tool execution and returns a specific error dictionary.
    Otherwise, allows the tool call to proceed by returning None.
    """
    tool_name = tool.name
    agent_name = tool_context.agent_name # Agent attempting the tool call
    print(f"--- Callback: block_paris_tool_guardrail running for tool '{tool_name}' in agent '{agent_name}' ---")
    print(f"--- Callback: Inspecting args: {args} ---")

    # --- Guardrail Logic ---
    target_tool_name = "get_weather_stateful" # Match the function name used by FunctionTool
    blocked_city = "paris"

    # Check if it's the correct tool and the city argument matches the blocked city
    if tool_name == target_tool_name:
        city_argument = args.get("city", "") # Safely get the 'city' argument
        if city_argument and city_argument.lower() == blocked_city:
            print(f"--- Callback: Detected blocked city '{city_argument}'. Blocking tool execution! ---")
            # Optionally update state
            tool_context.state["guardrail_tool_block_triggered"] = True
            print(f"--- Callback: Set state 'guardrail_tool_block_triggered': True ---")

            # Return a dictionary matching the tool's expected output format for errors
            # This dictionary becomes the tool's result, skipping the actual tool run.
            return {
                "status": "error",
                "error_message": f"Policy restriction: Weather checks for '{city_argument.capitalize()}' are currently disabled by a tool guardrail."
            }
        else:
             print(f"--- Callback: City '{city_argument}' is allowed for tool '{tool_name}'. ---")
    else:
        print(f"--- Callback: Tool '{tool_name}' is not the target tool. Allowing. ---")


    # If the checks above didn't return a dictionary, allow the tool to execute
    print(f"--- Callback: Allowing tool '{tool_name}' to proceed. ---")
    return None # Returning None allows the actual tool function to run

print("✅ block_paris_tool_guardrail function defined.")


```

---

**2\. 更新 Root Agent 以同時使用兩個 Callback**

我們再次重新定義 root agent（`weather_agent_v6_tool_guardrail`），這次在步驟 5 的基礎上，新增了 `before_tool_callback` 參數，並與 `before_model_callback` 一起使用。

*自我包含執行注意事項：* 與步驟 5 類似，請確保在定義此 agent 之前，所有必要的前置項目（子 agent、工具、`before_model_callback`）都已經在執行環境中定義或可用。


```python
# @title 2. Update Root Agent with BOTH Callbacks (Self-Contained)

# --- Ensure Prerequisites are Defined ---
# (Include or ensure execution of definitions for: Agent, LiteLlm, Runner, ToolContext,
#  MODEL constants, say_hello, say_goodbye, greeting_agent, farewell_agent,
#  get_weather_stateful, block_keyword_guardrail, block_paris_tool_guardrail)

# --- Redefine Sub-Agents (Ensures they exist in this context) ---
greeting_agent = None
try:
    # Use a defined model constant
    greeting_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="greeting_agent", # Keep original name for consistency
        instruction="You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description="Handles simple greetings and hellos using the 'say_hello' tool.",
        tools=[say_hello],
    )
    print(f"✅ Sub-Agent '{greeting_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Greeting agent. Check Model/API Key ({greeting_agent.model}). Error: {e}")

farewell_agent = None
try:
    # Use a defined model constant
    farewell_agent = Agent(
        model=MODEL_GEMINI_2_0_FLASH,
        name="farewell_agent", # Keep original name
        instruction="You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description="Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools=[say_goodbye],
    )
    print(f"✅ Sub-Agent '{farewell_agent.name}' redefined.")
except Exception as e:
    print(f"❌ Could not redefine Farewell agent. Check Model/API Key ({farewell_agent.model}). Error: {e}")

# --- Define the Root Agent with Both Callbacks ---
root_agent_tool_guardrail = None
runner_root_tool_guardrail = None

if ('greeting_agent' in globals() and greeting_agent and
    'farewell_agent' in globals() and farewell_agent and
    'get_weather_stateful' in globals() and
    'block_keyword_guardrail' in globals() and
    'block_paris_tool_guardrail' in globals()):

    root_agent_model = MODEL_GEMINI_2_0_FLASH

    root_agent_tool_guardrail = Agent(
        name="weather_agent_v6_tool_guardrail", # New version name
        model=root_agent_model,
        description="Main agent: Handles weather, delegates, includes input AND tool guardrails.",
        instruction="You are the main Weather Agent. Provide weather using 'get_weather_stateful'. "
                    "Delegate greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                    "Handle only weather, greetings, and farewells.",
        tools=[get_weather_stateful],
        sub_agents=[greeting_agent, farewell_agent],
        output_key="last_weather_report",
        before_model_callback=block_keyword_guardrail, # Keep model guardrail
        before_tool_callback=block_paris_tool_guardrail # <<< Add tool guardrail
    )
    print(f"✅ Root Agent '{root_agent_tool_guardrail.name}' created with BOTH callbacks.")

    # --- Create Runner, Using SAME Stateful Session Service ---
    if 'session_service_stateful' in globals():
        runner_root_tool_guardrail = Runner(
            agent=root_agent_tool_guardrail,
            app_name=APP_NAME,
            session_service=session_service_stateful # <<< Use the service from Step 4/5
        )
        print(f"✅ Runner created for tool guardrail agent '{runner_root_tool_guardrail.agent.name}', using stateful session service.")
    else:
        print("❌ Cannot create runner. 'session_service_stateful' from Step 4/5 is missing.")

else:
    print("❌ Cannot create root agent with tool guardrail. Prerequisites missing.")


```

---

**3\. 互動測試工具防護欄（Tool Guardrail）**

讓我們再次使用前述步驟中的同一個有狀態工作階段（`SESSION_ID_STATEFUL`），來測試互動流程。

1. 查詢「New York」的天氣：通過兩個回呼函式，工具執行（使用狀態中的華氏溫度偏好）。
2. 查詢「Paris」的天氣：通過`before_model_callback`。大型語言模型 (LLM) 決定呼叫`get_weather_stateful(city='Paris')`。`before_tool_callback`攔截並阻擋該工具，回傳錯誤字典。Agent 轉發此錯誤。
3. 查詢「London」的天氣：通過兩個回呼函式，工具正常執行。


```python
# @title 3. Interact to Test the Tool Argument Guardrail
import asyncio # Ensure asyncio is imported

# Ensure the runner for the tool guardrail agent is available
if 'runner_root_tool_guardrail' in globals() and runner_root_tool_guardrail:
    # Define the main async function for the tool guardrail test conversation.
    # The 'await' keywords INSIDE this function are necessary for async operations.
    async def run_tool_guardrail_test():
        print("\n--- Testing Tool Argument Guardrail ('Paris' blocked) ---")

        # Use the runner for the agent with both callbacks and the existing stateful session
        # Define a helper lambda for cleaner interaction calls
        interaction_func = lambda query: call_agent_async(query,
                                                         runner_root_tool_guardrail,
                                                         USER_ID_STATEFUL, # Use existing user ID
                                                         SESSION_ID_STATEFUL # Use existing session ID
                                                        )
        # 1. Allowed city (Should pass both callbacks, use Fahrenheit state)
        print("--- Turn 1: Requesting weather in New York (expect allowed) ---")
        await interaction_func("What's the weather in New York?")

        # 2. Blocked city (Should pass model callback, but be blocked by tool callback)
        print("\n--- Turn 2: Requesting weather in Paris (expect blocked by tool guardrail) ---")
        await interaction_func("How about Paris?") # Tool callback should intercept this

        # 3. Another allowed city (Should work normally again)
        print("\n--- Turn 3: Requesting weather in London (expect allowed) ---")
        await interaction_func("Tell me the weather in London.")

    # --- Execute the `run_tool_guardrail_test` async function ---
    # Choose ONE of the methods below based on your environment.

    # METHOD 1: Direct await (Default for Notebooks/Async REPLs)
    # If your environment supports top-level await (like Colab/Jupyter notebooks),
    # it means an event loop is already running, so you can directly await the function.
    print("Attempting execution using 'await' (default for notebooks)...")
    await run_tool_guardrail_test()

    # METHOD 2: asyncio.run (For Standard Python Scripts [.py])
    # If running this code as a standard Python script from your terminal,
    # the script context is synchronous. `asyncio.run()` is needed to
    # create and manage an event loop to execute your async function.
    # To use this method:
    # 1. Comment out the `await run_tool_guardrail_test()` line above.
    # 2. Uncomment the following block:
    """
    import asyncio
    if __name__ == "__main__": # Ensures this runs only when script is executed directly
        print("Executing using 'asyncio.run()' (for standard Python scripts)...")
        try:
            # This creates an event loop, runs your async function, and closes the loop.
            asyncio.run(run_tool_guardrail_test())
        except Exception as e:
            print(f"An error occurred: {e}")
    """

    # --- Inspect final session state after the conversation ---
    # This block runs after either execution method completes.
    # Optional: Check state for the tool block trigger flag
    print("\n--- Inspecting Final Session State (After Tool Guardrail Test) ---")
    # Use the session service instance associated with this stateful session
    final_session = await session_service_stateful.get_session(app_name=APP_NAME,
                                                         user_id=USER_ID_STATEFUL,
                                                         session_id= SESSION_ID_STATEFUL)
    if final_session:
        # Use .get() for safer access
        print(f"Tool Guardrail Triggered Flag: {final_session.state.get('guardrail_tool_block_triggered', 'Not Set (or False)')}")
        print(f"Last Weather Report: {final_session.state.get('last_weather_report', 'Not Set')}") # Should be London weather if successful
        print(f"Temperature Unit: {final_session.state.get('user_preference_temperature_unit', 'Not Set')}") # Should be Fahrenheit
        # print(f"Full State Dict: {final_session.state}") # For detailed view
    else:
        print("\n❌ Error: Could not retrieve final session state.")

else:
    print("\n⚠️ Skipping tool guardrail test. Runner ('runner_root_tool_guardrail') is not available.")
```

---

分析輸出結果：

1. **New York：**`before_model_callback` 允許該請求。大型語言模型 (LLM) 請求 `get_weather_stateful`。`before_tool_callback` 執行，檢查參數 (`{'city': 'New York'}`)，發現不是 "Paris"，輸出 "Allowing tool..."，並回傳 `None`。實際的 `get_weather_stateful` 函式執行，從狀態中讀取 "Fahrenheit"，並回傳天氣報告。代理人轉發這個結果，並透過 `output_key` 儲存。
2. **Paris：**`before_model_callback` 允許該請求。大型語言模型 (LLM) 請求 `get_weather_stateful(city='Paris')`。`before_tool_callback` 執行，檢查參數，偵測到 "Paris"，輸出 "Blocking tool execution!"，設置狀態旗標，並回傳錯誤字典 `{'status': 'error', 'error_message': 'Policy restriction...'}`。實際的 `get_weather_stateful` 函式**從未被執行**。代理人收到錯誤字典（*就像它是工具的輸出*），並根據該錯誤訊息生成回應。
3. **London：** 行為與 New York 相同，通過兩個 callback 並成功執行工具。新的 London 天氣報告會覆蓋狀態中的 `last_weather_report`。

你現在已經新增了一層關鍵的安全防護，不僅控制*什麼*可以傳遞給大型語言模型 (LLM)，也控制代理人工具如何根據 LLM 生成的特定參數被使用。像 `before_model_callback` 和 `before_tool_callback` 這樣的 callback 對於打造健壯、安全且符合政策規範的代理人應用至關重要。

---

## 結論：你的代理人團隊已經準備就緒！

恭喜！你已經成功從構建一個基礎的天氣代理人，進階到利用 Agent Development Kit (ADK) 打造一個先進的多代理人團隊。

**讓我們回顧一下你完成了哪些內容：**

*   你從一個**基本代理人**開始，並配備了一個單一工具（`get_weather`）。
*   你利用 LiteLLM 探索了 ADK 的**多模型彈性**，讓相同核心邏輯可在不同大型語言模型 (LLM) 上運行，如 Gemini、GPT-4o 和 Claude。
*   你實踐了**模組化**，建立了專門的子代理人（`greeting_agent`、`farewell_agent`），並啟用從根代理人自動委派。
*   你讓代理人擁有**記憶**，利用**Session State**（會話狀態）記住使用者偏好（`temperature_unit`）與過往互動（`output_key`）。
*   你透過 `before_model_callback`（阻擋特定輸入關鍵字）與 `before_tool_callback`（根據參數如城市 "Paris" 阻擋工具執行）實作了關鍵的**安全防護措施**。

透過構建這個漸進式的 Weather Bot 團隊，你已經親身體驗了開發複雜智慧應用所需的 ADK 核心概念。

**重點整理：**

*   **代理人與工具 (Agents & Tools)：** 定義能力與推理的基本組件。清楚的指令與 docstring 極為重要。
*   **Runner 與 Session Service：** 負責協調代理人執行與維護對話上下文的引擎與記憶管理系統。
*   **委派 (Delegation)：** 設計多代理人團隊可帶來專業分工、模組化，以及更佳的複雜任務管理。代理人 `description` 是自動流程的關鍵。
*   **Session State（`ToolContext`、`output_key`）：** 建立具備情境感知、個人化、多輪對話代理人的關鍵。
*   **Callback（`before_model`、`before_tool`）：** 在關鍵操作（如 LLM 呼叫或工具執行）*之前*，實作安全、驗證、政策執行與動態修改的強大鉤子。
*   **彈性 (Flexibility, `LiteLlm`)：** ADK 讓你能根據需求選擇最合適的 LLM，兼顧效能、成本與功能。

**接下來可以做什麼？**

你的 Weather Bot 團隊是一個很棒的起點。以下是一些進一步探索 ADK 並增強應用的想法：

1.  **串接真實天氣 API：** 將 `get_weather` 工具中的 `mock_weather_db` 替換成呼叫真實天氣 API（如 OpenWeatherMap、WeatherAPI）。
2.  **更複雜的狀態管理：** 在 session state 中儲存更多使用者偏好（例如：偏好地點、通知設定）或對話摘要。
3.  **優化委派邏輯：** 嘗試不同的根代理人指令或子代理人描述，微調委派邏輯。你能否新增一個 "forecast" 代理人？
4.  **進階 Callback：**
    *   使用 `after_model_callback` 在 LLM 產生回應*之後*重新格式化或淨化回應內容。
    *   使用 `after_tool_callback` 處理或記錄工具回傳的結果。
    *   實作 `before_agent_callback` 或 `after_agent_callback` 來進行代理人層級的進入／離開邏輯。
5.  **錯誤處理：** 改善代理人處理工具錯誤或非預期 API 回應的方式。也許可以在工具內加入重試邏輯。
6.  **持久化 Session 儲存：** 探索替代 `InMemorySessionService` 的方式，將 session state 持久化儲存（例如使用 Firestore 或 Cloud SQL 等資料庫——需自訂實作或等待未來 ADK 整合）。
7.  **串流介面 (Streaming UI)：** 將你的代理人團隊與網頁框架（如 ADK Streaming Quickstart 範例中的 FastAPI）整合，打造即時聊天介面。

Agent Development Kit (ADK) 提供了構建先進 LLM 應用的堅實基礎。只要熟練本教學涵蓋的概念——工具、狀態、委派與 callback——你就能勝任日益複雜的代理人系統開發。

祝你開發順利！
