# 第三方工具

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將上線。"}

Agent Development Kit (ADK) 設計上**高度可擴充，讓你能無縫整合來自其他 AI Agent 框架**（如 CrewAI 和 LangChain）的工具。這種互通性非常關鍵，因為它能加速開發流程，並讓你重複利用現有工具。

## 1. 使用 LangChain 工具

Agent Development Kit (ADK) 提供 `LangchainTool` 包裝器，讓你可以將 LangChain 生態系統中的工具整合到你的 agent 中。

### 範例：使用 LangChain 的 Tavily 工具進行網路搜尋

[Tavily](https://tavily.com/) 提供一個搜尋 API，能根據即時搜尋結果回傳答案，適合 AI agent 等應用程式使用。

1. 請依照 [ADK 安裝與設定](../get-started/installation.md) 指南操作。

2. **安裝相依套件：**請確認你已安裝所需的 LangChain 套件。例如，若要使用 Tavily 搜尋工具，請安裝其專屬的相依套件：

    ```bash
    pip install langchain_community tavily-python
    ```

3. 取得 [Tavily](https://tavily.com/) API KEY，並將其匯出為環境變數。

    ```bash
    export TAVILY_API_KEY=<REPLACE_WITH_API_KEY>
    ```

4. **匯入：** 從 Agent Development Kit (ADK) 匯入 `LangchainTool` 包裝器，以及你想使用的特定 `LangChain` 工具（例如 `TavilySearchResults`）。

    ```py
    from google.adk.tools.langchain_tool import LangchainTool
    from langchain_community.tools import TavilySearchResults
    ```

5. **實例化與包裝：** 建立你的 LangChain 工具實例，並將其傳遞給 `LangchainTool` 的建構子。

    ```py
    # Instantiate the LangChain tool
    tavily_tool_instance = TavilySearchResults(
        max_results=5,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=True,
        include_images=True,
    )

    # Wrap it with LangchainTool for ADK
    adk_tavily_tool = LangchainTool(tool=tavily_tool_instance)
    ```

6. **新增至 agent：** 在定義時，將包裝過的 `LangchainTool` 實例加入你的 agent 的 `tools` 清單中。

    ```py
    from google.adk import Agent

    # Define the ADK agent, including the wrapped tool
    my_agent = Agent(
        name="langchain_tool_agent",
        model="gemini-2.0-flash",
        description="Agent to answer questions using TavilySearch.",
        instruction="I can answer your questions by searching the internet. Just ask me anything!",
        tools=[adk_tavily_tool] # Add the wrapped tool here
    )
    ```

### 完整範例：Tavily 搜尋

以下是結合上述步驟，使用 LangChain Tavily 搜尋工具來建立並執行 agent 的完整程式碼。

```py
--8<-- "examples/python/snippets/tools/third-party/langchain_tavily_search.py"
```

## 2. 使用 CrewAI 工具

Agent Development Kit (ADK) 提供了 `CrewaiTool` 包裝器，可用於整合 CrewAI 函式庫中的 tools。

### 範例：使用 CrewAI 的 Serper API 進行網頁搜尋

[Serper API](https://serper.dev/) 提供以程式化方式存取 Google Search 結果的能力。這讓應用程式（如 AI agent）能即時執行 Google Search（包含新聞、圖片等），並取得結構化資料，而無需直接爬取網頁內容。

1. 請依照 [ADK 安裝與設定](../get-started/installation.md) 指南操作。

2. **安裝相依套件：** 安裝所需的 CrewAI tools 套件。例如，若要使用 SerperDevTool：

    ```bash
    pip install crewai-tools
    ```

3. 取得 [Serper API KEY](https://serper.dev/)，並將其設為環境變數。

    ```bash
    export SERPER_API_KEY=<REPLACE_WITH_API_KEY>
    ```

4. **匯入：** 從 Agent Development Kit (ADK) 匯入 `CrewaiTool`，以及所需的 CrewAI 工具（例如 `SerperDevTool`）。

    ```py
    from google.adk.tools.crewai_tool import CrewaiTool
    from crewai_tools import SerperDevTool
    ```

5. **實例化與包裝：** 建立 CrewAI 工具的實例，並將其傳遞給 `CrewaiTool` 建構子。**重點是，您必須為 ADK 包裝器提供名稱與描述**，因為這些資訊會被 Agent Development Kit (ADK) 的底層模型用來判斷何時應該使用該工具。

    ```py
    # Instantiate the CrewAI tool
    serper_tool_instance = SerperDevTool(
        n_results=10,
        save_file=False,
        search_type="news",
    )

    # Wrap it with CrewaiTool for ADK, providing name and description
    adk_serper_tool = CrewaiTool(
        name="InternetNewsSearch",
        description="Searches the internet specifically for recent news articles using Serper.",
        tool=serper_tool_instance
    )
    ```

6. **加入 Agent：** 將包裝過的 `CrewaiTool` 實例加入你的 Agent 的 `tools` 清單中。

    ```py
    from google.adk import Agent
 
    # Define the ADK agent
    my_agent = Agent(
        name="crewai_search_agent",
        model="gemini-2.0-flash",
        description="Agent to find recent news using the Serper search tool.",
        instruction="I can find the latest news for you. What topic are you interested in?",
        tools=[adk_serper_tool] # Add the wrapped tool here
    )
    ```

### 完整範例：Serper API

以下是結合上述步驟，使用 CrewAI Serper API 搜尋工具來建立並執行 agent 的完整程式碼。

```py
--8<-- "examples/python/snippets/tools/third-party/crewai_serper_search.py"
```
