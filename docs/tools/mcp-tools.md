# Model Context Protocol 工具

本指南將帶你了解兩種將 Model Context Protocol (MCP) 與 Agent Development Kit (ADK) 整合的方法。

## 什麼是 Model Context Protocol (MCP)？

Model Context Protocol (MCP) 是一項開放標準，旨在標準化大型語言模型 (Large Language Model, LLM)（如 Gemini 和 Claude）與外部應用程式、資料來源及工具之間的通訊方式。你可以將它想像成一種通用的連接機制，簡化 LLM 取得上下文、執行動作，以及與各種系統互動的流程。

MCP 採用 client-server 架構，定義了**資料**（資源）、**互動式範本**（prompts）以及**可執行函式**（tools）如何由**MCP server** 提供，並由**MCP client**（可能是 LLM 主機應用程式或 AI agent）消費。

本指南涵蓋兩種主要的整合模式：

1. **在 ADK 中使用現有的 MCP server：** ADK agent 作為 MCP client，利用外部 MCP server 所提供的工具。
2. **透過 MCP server 對外公開 ADK 工具：** 建立一個 MCP server，包裝 ADK 工具，讓任何 MCP client 都能存取。

## 先決條件

在開始之前，請確保你已完成以下設定：

* **設定 ADK：** 請依照快速開始中的標準 ADK [設定說明](../get-started/quickstart.md/#venv-install) 進行。
* **安裝/更新 Python/Java：** MCP 需要 Python 3.9 或以上版本，或 Java 17 或以上版本。
* **安裝 Node.js 與 npx：** **（僅限 Python）** 許多社群 MCP server 以 Node.js 套件形式發佈，並透過 `npx` 執行。如果尚未安裝，請安裝 Node.js（其中包含 npx）。詳細資訊請參閱 [https://nodejs.org/en](https://nodejs.org/en)。
* **確認安裝：** **（僅限 Python）** 請在啟用的虛擬環境中確認 `adk` 和 `npx` 已加入 PATH：

```shell
# Both commands should print the path to the executables.
which adk
which npx
```

## 1. 在 `adk web` 中使用 MCP 伺服器與 ADK agents（ADK 作為 MCP client）

本節說明如何將外部 MCP（Model Context Protocol）伺服器的工具整合到你的 Agent Development Kit (ADK) agent 中。當你的 ADK agent 需要使用現有服務所提供、並且有 MCP 介面的功能時，這是**最常見**的整合模式。你將看到如何直接將 `MCPToolset` 類別加入 agent 的 `tools` 清單中，讓 agent 能無縫連接 MCP 伺服器、發現其工具，並讓這些工具可供 agent 使用。這些範例主要聚焦於 `adk web` 開發環境中的互動。

### `MCPToolset` 類別

`MCPToolset` 類別是 ADK 整合 MCP 伺服器工具的主要機制。當你在 agent 的 `tools` 清單中加入 `MCPToolset` 實例時，會自動處理與指定 MCP 伺服器的互動。其運作方式如下：

1.  **連線管理：** 初始化時，`MCPToolset` 會建立並管理與 MCP 伺服器的連線。這可以是本機伺服器程序（使用 `StdioConnectionParams` 透過標準輸入/輸出進行通訊），也可以是遠端伺服器（使用 `SseConnectionParams` 進行 Server-Sent Events (SSE)）。工具組也會在 agent 或應用程式終止時，優雅地關閉這個連線。
2.  **工具發現與轉換：** 連線後，`MCPToolset` 會查詢 MCP 伺服器可用的工具（透過 `list_tools` MCP 方法），並將這些發現到的 MCP 工具 schema 轉換為 ADK 相容的 `BaseTool` 實例。
3.  **對 agent 暴露工具：** 這些轉換後的工具會像原生 ADK 工具一樣，提供給你的 `LlmAgent` 使用。
4.  **工具呼叫代理：** 當你的 `LlmAgent` 決定使用其中一個工具時，`MCPToolset` 會透明地代理呼叫（使用 `call_tool` MCP 方法）到 MCP 伺服器，傳送必要參數，並將伺服器回應返回給 agent。
5.  **篩選（可選）：** 你可以在建立 `MCPToolset` 時，透過 `tool_filter` 參數，選擇只暴露 MCP 伺服器上的特定工具子集給 agent，而非全部工具。

以下範例展示如何在 `adk web` 開發環境中使用 `MCPToolset`。如果你需要更細緻地控制 MCP 連線生命週期，或未使用 `adk web`，請參考本頁稍後的「在 `adk web` 之外於自訂 agent 中使用 MCP 工具」章節。

### 範例 1：檔案系統 MCP 伺服器

此 Python 範例展示如何連接到提供檔案系統操作的本機 MCP 伺服器。

#### 步驟 1：使用 `MCPToolset` 定義你的 agent

建立一個 `agent.py` 檔案（例如放在 `./adk_agent_samples/mcp_agent/agent.py` 目錄下）。`MCPToolset` 會直接在你的 `LlmAgent` 的 `tools` 清單中被實例化。

*   **重要：** 請將 `args` 清單中的 `"/path/to/your/folder"` 替換為 MCP 伺服器可存取的本機實際資料夾的**絕對路徑**。
*   **重要：** 請將 `.env` 檔案放在 `./adk_agent_samples` 目錄的上層目錄。

```python
# ./adk_agent_samples/mcp_agent/agent.py
import os # Required for path operations
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# It's good practice to define paths dynamically if possible,
# or ensure the user understands the need for an ABSOLUTE path.
# For this example, we'll construct a path relative to this file,
# assuming '/path/to/your/folder' is in the same directory as agent.py.
# REPLACE THIS with an actual absolute path if needed for your setup.
TARGET_FOLDER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "/path/to/your/folder")
# Ensure TARGET_FOLDER_PATH is an absolute path for the MCP server.
# If you created ./adk_agent_samples/mcp_agent/your_folder,

root_agent = LlmAgent(
    model='gemini-2.0-flash',
    name='filesystem_assistant_agent',
    instruction='Help the user manage their files. You can list files, read files, etc.',
    tools=[
        MCPToolset(
            connection_params=StdioConnectionParams(
                server_params = StdioServerParameters(
                    command='npx',
                    args=[
                        "-y",  # Argument for npx to auto-confirm install
                        "@modelcontextprotocol/server-filesystem",
                        # IMPORTANT: This MUST be an ABSOLUTE path to a folder the
                        # npx process can access.
                        # Replace with a valid absolute path on your system.
                        # For example: "/Users/youruser/accessible_mcp_files"
                        # or use a dynamically constructed absolute path:
                        os.path.abspath(TARGET_FOLDER_PATH),
                    ],
                ),
            ),
            # Optional: Filter which tools from the MCP server are exposed
            # tool_filter=['list_directory', 'read_file']
        )
    ],
)
```


#### 步驟 2：建立 `__init__.py` 檔案

請確保在與 `agent.py` 相同的目錄下有一個 `__init__.py`，以便讓 Agent Development Kit (ADK) 能夠將其識別為可發現的 Python 套件。

```python
# ./adk_agent_samples/mcp_agent/__init__.py
from . import agent
```

#### 步驟 3：執行 `adk web` 並互動

請在終端機中切換到 `mcp_agent` 的上層目錄（例如 `adk_agent_samples`），然後執行：

```shell
cd ./adk_agent_samples # Or your equivalent parent directory
adk web
```

!!!info "Windows 使用者注意"

    When hitting the `_make_subprocess_transport NotImplementedError`, consider using `adk web --no-reload` instead.


當 Google Agent Development Kit (ADK) Web UI 在你的瀏覽器中載入後：

1.  從 agent 下拉選單中選擇 `filesystem_assistant_agent`。
2.  嘗試以下提示語：
    *   「列出目前目錄中的檔案。」
    *   「你可以讀取名為 sample.txt 的檔案嗎？」（假設你已在 `TARGET_FOLDER_PATH` 中建立該檔案）。
    *   「`another_file.md` 的內容是什麼？」

你應該會看到 agent 與 MCP 檔案系統伺服器互動，並且伺服器的回應（檔案清單、檔案內容）會透過 agent 傳遞回來。`adk web` 主控台（你執行指令的終端機）也可能會顯示來自 `npx` 程序的日誌（如果有輸出到 stderr）。

<img src="../../assets/adk-tool-mcp-filesystem-adk-web-demo.png" alt="MCP with ADK Web - FileSystem Example">

若要在 Java 中定義一個初始化 `MCPToolset` 的 agent，請參考以下範例：

```java
package agents;

import com.google.adk.JsonBaseModel;
import com.google.adk.agents.LlmAgent;
import com.google.adk.agents.RunConfig;
import com.google.adk.runner.InMemoryRunner;
import com.google.adk.tools.mcp.McpTool;
import com.google.adk.tools.mcp.McpToolset;
import com.google.adk.tools.mcp.McpToolset.McpToolsAndToolsetResult;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import io.modelcontextprotocol.client.transport.ServerParameters;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public class McpAgentCreator {

    /**
     * Initializes an McpToolset, retrieves tools from an MCP server using stdio,
     * creates an LlmAgent with these tools, sends a prompt to the agent,
     * and ensures the toolset is closed.
     * @param args Command line arguments (not used).
     */
    public static void main(String[] args) {
        //Note: you may have permissions issues if the folder is outside home
        String yourFolderPath = "~/path/to/folder";

        ServerParameters connectionParams = ServerParameters.builder("npx")
                .args(List.of(
                        "-y",
                        "@modelcontextprotocol/server-filesystem",
                        yourFolderPath
                ))
                .build();

        try {
            CompletableFuture<McpToolsAndToolsetResult> futureResult =
                    McpToolset.fromServer(connectionParams, JsonBaseModel.getMapper());

            McpToolsAndToolsetResult result = futureResult.join();

            try (McpToolset toolset = result.getToolset()) {
                List<McpTool> tools = result.getTools();

                LlmAgent agent = LlmAgent.builder()
                        .model("gemini-2.0-flash")
                        .name("enterprise_assistant")
                        .description("An agent to help users access their file systems")
                        .instruction(
                                "Help user accessing their file systems. You can list files in a directory."
                        )
                        .tools(tools)
                        .build();

                System.out.println("Agent created: " + agent.name());

                InMemoryRunner runner = new InMemoryRunner(agent);
                String userId = "user123";
                String sessionId = "1234";
                String promptText = "Which files are in this directory - " + yourFolderPath + "?";

                // Explicitly create the session first
                try {
                    // appName for InMemoryRunner defaults to agent.name() if not specified in constructor
                    runner.sessionService().createSession(runner.appName(), userId, null, sessionId).blockingGet();
                    System.out.println("Session created: " + sessionId + " for user: " + userId);
                } catch (Exception sessionCreationException) {
                    System.err.println("Failed to create session: " + sessionCreationException.getMessage());
                    sessionCreationException.printStackTrace();
                    return;
                }

                Content promptContent = Content.fromParts(Part.fromText(promptText));

                System.out.println("\nSending prompt: \"" + promptText + "\" to agent...\n");

                runner.runAsync(userId, sessionId, promptContent, RunConfig.builder().build())
                        .blockingForEach(event -> {
                            System.out.println("Event received: " + event.toJson());
                        });
            }
        } catch (Exception e) {
            System.err.println("An error occurred: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

假設有一個資料夾，裡面包含三個名為 `first`、`second` 和 `third` 的檔案，成功的回應 (successful response) 會如下所示：

```shell
Event received: {"id":"163a449e-691a-48a2-9e38-8cadb6d1f136","invocationId":"e-c2458c56-e57a-45b2-97de-ae7292e505ef","author":"enterprise_assistant","content":{"parts":[{"functionCall":{"id":"adk-388b4ac2-d40e-4f6a-bda6-f051110c6498","args":{"path":"~/home-test"},"name":"list_directory"}}],"role":"model"},"actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"timestamp":1747377543788}

Event received: {"id":"8728380b-bfad-4d14-8421-fa98d09364f1","invocationId":"e-c2458c56-e57a-45b2-97de-ae7292e505ef","author":"enterprise_assistant","content":{"parts":[{"functionResponse":{"id":"adk-388b4ac2-d40e-4f6a-bda6-f051110c6498","name":"list_directory","response":{"text_output":[{"text":"[FILE] first\n[FILE] second\n[FILE] third"}]}}}],"role":"user"},"actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"timestamp":1747377544679}

Event received: {"id":"8fe7e594-3e47-4254-8b57-9106ad8463cb","invocationId":"e-c2458c56-e57a-45b2-97de-ae7292e505ef","author":"enterprise_assistant","content":{"parts":[{"text":"There are three files in the directory: first, second, and third."}],"role":"model"},"actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"timestamp":1747377544689}
```



### 範例 2：Google Maps MCP 伺服器

本範例說明如何連線至 Google Maps MCP 伺服器。

#### 步驟 1：取得 API 金鑰並啟用 API

1.  **Google Maps API 金鑰：** 請依照 [Use API keys](https://developers.google.com/maps/documentation/javascript/get-api-key#create-api-keys) 的說明取得 Google Maps API 金鑰。
2.  **啟用 API：** 請確認你的 Google Cloud 專案已啟用下列 API：
    *   Directions API
    *   Routes API
    相關操作請參考 [Getting started with Google Maps Platform](https://developers.google.com/maps/get-started#enable-api-sdk) 文件說明。

#### 步驟 2：使用 `MCPToolset` 定義你的 Google Maps agent

請修改你的 `agent.py` 檔案（例如在 `./adk_agent_samples/mcp_agent/agent.py` 中）。將 `YOUR_GOOGLE_MAPS_API_KEY` 替換為你實際取得的 API 金鑰。

```python
# ./adk_agent_samples/mcp_agent/agent.py
import os
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# Retrieve the API key from an environment variable or directly insert it.
# Using an environment variable is generally safer.
# Ensure this environment variable is set in the terminal where you run 'adk web'.
# Example: export GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_KEY"
google_maps_api_key = os.environ.get("GOOGLE_MAPS_API_KEY")

if not google_maps_api_key:
    # Fallback or direct assignment for testing - NOT RECOMMENDED FOR PRODUCTION
    google_maps_api_key = "YOUR_GOOGLE_MAPS_API_KEY_HERE" # Replace if not using env var
    if google_maps_api_key == "YOUR_GOOGLE_MAPS_API_KEY_HERE":
        print("WARNING: GOOGLE_MAPS_API_KEY is not set. Please set it as an environment variable or in the script.")
        # You might want to raise an error or exit if the key is crucial and not found.

root_agent = LlmAgent(
    model='gemini-2.0-flash',
    name='maps_assistant_agent',
    instruction='Help the user with mapping, directions, and finding places using Google Maps tools.',
    tools=[
        MCPToolset(
            connection_params=StdioConnectionParams(
                server_params = StdioServerParameters(
                    command='npx',
                    args=[
                        "-y",
                        "@modelcontextprotocol/server-google-maps",
                    ],
                    # Pass the API key as an environment variable to the npx process
                    # This is how the MCP server for Google Maps expects the key.
                    env={
                        "GOOGLE_MAPS_API_KEY": google_maps_api_key
                    }
                ),
            ),
            # You can filter for specific Maps tools if needed:
            # tool_filter=['get_directions', 'find_place_by_id']
        )
    ],
)
```

#### 步驟 3：確認 `__init__.py` 是否存在

如果你已在範例 1 中建立過，則可以跳過此步驟。否則，請確認你在 `./adk_agent_samples/mcp_agent/` 資料夾中有一個 `__init__.py`：

```python
# ./adk_agent_samples/mcp_agent/__init__.py
from . import agent
```

#### 步驟 4：執行 `adk web` 並互動

1.  **設定環境變數（建議）：**  
    在執行 `adk web` 之前，建議先在終端機中將你的 Google Maps API 金鑰設定為環境變數：
    ```shell
    export GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_GOOGLE_MAPS_API_KEY"
    ```
    將 `YOUR_ACTUAL_GOOGLE_MAPS_API_KEY` 替換為你的金鑰。

2.  **執行 `adk web`**：
    請切換到 `mcp_agent` 的父目錄（例如：`adk_agent_samples`），然後執行：
    ```shell
    cd ./adk_agent_samples # Or your equivalent parent directory
    adk web
    ```

3.  **在 UI 中互動**：
    *   選擇`maps_assistant_agent`。
    *   嘗試以下提示：
        *   「從 GooglePlex 到 SFO 的路線。」
        *   「尋找 Golden Gate Park 附近的咖啡店。」
        *   「從法國巴黎到德國柏林的路線是什麼？」

你應該會看到 agent 使用 Google Maps MCP 工具來提供路線或位置相關資訊。

<img src="../../assets/adk-tool-mcp-maps-adk-web-demo.png" alt="MCP with ADK Web - Google Maps Example">

若是 Java，請參考以下範例來定義一個初始化`MCPToolset`的 agent：

```java
package agents;

import com.google.adk.JsonBaseModel;
import com.google.adk.agents.LlmAgent;
import com.google.adk.agents.RunConfig;
import com.google.adk.runner.InMemoryRunner;
import com.google.adk.tools.mcp.McpTool;
import com.google.adk.tools.mcp.McpToolset;
import com.google.adk.tools.mcp.McpToolset.McpToolsAndToolsetResult;


import com.google.genai.types.Content;
import com.google.genai.types.Part;

import io.modelcontextprotocol.client.transport.ServerParameters;

import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import java.util.Arrays;

public class MapsAgentCreator {

    /**
     * Initializes an McpToolset for Google Maps, retrieves tools,
     * creates an LlmAgent, sends a map-related prompt, and closes the toolset.
     * @param args Command line arguments (not used).
     */
    public static void main(String[] args) {
        // TODO: Replace with your actual Google Maps API key, on a project with the Places API enabled.
        String googleMapsApiKey = "YOUR_GOOGLE_MAPS_API_KEY";

        Map<String, String> envVariables = new HashMap<>();
        envVariables.put("GOOGLE_MAPS_API_KEY", googleMapsApiKey);

        ServerParameters connectionParams = ServerParameters.builder("npx")
                .args(List.of(
                        "-y",
                        "@modelcontextprotocol/server-google-maps"
                ))
                .env(Collections.unmodifiableMap(envVariables))
                .build();

        try {
            CompletableFuture<McpToolsAndToolsetResult> futureResult =
                    McpToolset.fromServer(connectionParams, JsonBaseModel.getMapper());

            McpToolsAndToolsetResult result = futureResult.join();

            try (McpToolset toolset = result.getToolset()) {
                List<McpTool> tools = result.getTools();

                LlmAgent agent = LlmAgent.builder()
                        .model("gemini-2.0-flash")
                        .name("maps_assistant")
                        .description("Maps assistant")
                        .instruction("Help user with mapping and directions using available tools.")
                        .tools(tools)
                        .build();

                System.out.println("Agent created: " + agent.name());

                InMemoryRunner runner = new InMemoryRunner(agent);
                String userId = "maps-user-" + System.currentTimeMillis();
                String sessionId = "maps-session-" + System.currentTimeMillis();

                String promptText = "Please give me directions to the nearest pharmacy to Madison Square Garden.";

                try {
                    runner.sessionService().createSession(runner.appName(), userId, null, sessionId).blockingGet();
                    System.out.println("Session created: " + sessionId + " for user: " + userId);
                } catch (Exception sessionCreationException) {
                    System.err.println("Failed to create session: " + sessionCreationException.getMessage());
                    sessionCreationException.printStackTrace();
                    return;
                }

                Content promptContent = Content.fromParts(Part.fromText(promptText))

                System.out.println("\nSending prompt: \"" + promptText + "\" to agent...\n");

                runner.runAsync(userId, sessionId, promptContent, RunConfig.builder().build())
                        .blockingForEach(event -> {
                            System.out.println("Event received: " + event.toJson());
                        });
            }
        } catch (Exception e) {
            System.err.println("An error occurred: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

成功的回應 (successful response) 會如下所示：
```shell
Event received: {"id":"1a4deb46-c496-4158-bd41-72702c773368","invocationId":"e-48994aa0-531c-47be-8c57-65215c3e0319","author":"maps_assistant","content":{"parts":[{"text":"OK. I see a few options. The closest one is CVS Pharmacy at 5 Pennsylvania Plaza, New York, NY 10001, United States. Would you like directions?\n"}],"role":"model"},"actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"timestamp":1747380026642}
```

## 2. 使用 ADK 工具建構 MCP 伺服器（MCP 伺服器對外提供 ADK）

此模式可讓你將現有的 Agent Development Kit (ADK) 工具包裝起來，並使其可供任何標準 MCP 用戶端應用程式存取。本節範例將透過自訂建構的 MCP 伺服器，對外提供 ADK `load_web_page` 工具。

### 步驟總覽

你將使用 `mcp` 函式庫建立一個標準的 Python MCP 伺服器應用程式。在這個伺服器中，你將：

1.  實例化你想對外提供的 ADK 工具（例如 `FunctionTool(load_web_page)`）。
2.  實作 MCP 伺服器的 `@app.list_tools()` handler，來廣播這些 ADK 工具。這會用到 `google.adk.tools.mcp_tool.conversion_utils` 的 `adk_to_mcp_tool_type` 工具，將 ADK 工具定義轉換為 MCP 的 schema。
3.  實作 MCP 伺服器的 `@app.call_tool()` handler。此 handler 將會：
    *   接收來自 MCP 用戶端的工具呼叫 (tool calls) 請求。
    *   判斷請求是否針對你包裝的 ADK 工具。
    *   執行 ADK 工具的 `.run_async()` 方法。
    *   將 ADK 工具的結果格式化為符合 MCP 標準的回應（例如 `mcp.types.TextContent`）。

### 先決條件

請在與你的 ADK 安裝相同的 Python 環境中安裝 MCP 伺服器函式庫：

```shell
pip install mcp
```

### 步驟 1：建立 MCP 伺服器腳本

建立一個新的 Python 檔案作為你的 MCP 伺服器，例如 `my_adk_mcp_server.py`。

### 步驟 2：實作伺服器邏輯

將以下程式碼加入 `my_adk_mcp_server.py`。此腳本會建立一個 MCP 伺服器，並對外提供 Agent Development Kit (ADK) `load_web_page` 工具。

```python
# my_adk_mcp_server.py
import asyncio
import json
import os
from dotenv import load_dotenv

# MCP Server Imports
from mcp import types as mcp_types # Use alias to avoid conflict
from mcp.server.lowlevel import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio # For running as a stdio server

# ADK Tool Imports
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.load_web_page import load_web_page # Example ADK tool
# ADK <-> MCP Conversion Utility
from google.adk.tools.mcp_tool.conversion_utils import adk_to_mcp_tool_type

# --- Load Environment Variables (If ADK tools need them, e.g., API keys) ---
load_dotenv() # Create a .env file in the same directory if needed

# --- Prepare the ADK Tool ---
# Instantiate the ADK tool you want to expose.
# This tool will be wrapped and called by the MCP server.
print("Initializing ADK load_web_page tool...")
adk_tool_to_expose = FunctionTool(load_web_page)
print(f"ADK tool '{adk_tool_to_expose.name}' initialized and ready to be exposed via MCP.")
# --- End ADK Tool Prep ---

# --- MCP Server Setup ---
print("Creating MCP Server instance...")
# Create a named MCP Server instance using the mcp.server library
app = Server("adk-tool-exposing-mcp-server")

# Implement the MCP server's handler to list available tools
@app.list_tools()
async def list_mcp_tools() -> list[mcp_types.Tool]:
    """MCP handler to list tools this server exposes."""
    print("MCP Server: Received list_tools request.")
    # Convert the ADK tool's definition to the MCP Tool schema format
    mcp_tool_schema = adk_to_mcp_tool_type(adk_tool_to_expose)
    print(f"MCP Server: Advertising tool: {mcp_tool_schema.name}")
    return [mcp_tool_schema]

# Implement the MCP server's handler to execute a tool call
@app.call_tool()
async def call_mcp_tool(
    name: str, arguments: dict
) -> list[mcp_types.Content]: # MCP uses mcp_types.Content
    """MCP handler to execute a tool call requested by an MCP client."""
    print(f"MCP Server: Received call_tool request for '{name}' with args: {arguments}")

    # Check if the requested tool name matches our wrapped ADK tool
    if name == adk_tool_to_expose.name:
        try:
            # Execute the ADK tool's run_async method.
            # Note: tool_context is None here because this MCP server is
            # running the ADK tool outside of a full ADK Runner invocation.
            # If the ADK tool requires ToolContext features (like state or auth),
            # this direct invocation might need more sophisticated handling.
            adk_tool_response = await adk_tool_to_expose.run_async(
                args=arguments,
                tool_context=None,
            )
            print(f"MCP Server: ADK tool '{name}' executed. Response: {adk_tool_response}")

            # Format the ADK tool's response (often a dict) into an MCP-compliant format.
            # Here, we serialize the response dictionary as a JSON string within TextContent.
            # Adjust formatting based on the ADK tool's output and client needs.
            response_text = json.dumps(adk_tool_response, indent=2)
            # MCP expects a list of mcp_types.Content parts
            return [mcp_types.TextContent(type="text", text=response_text)]

        except Exception as e:
            print(f"MCP Server: Error executing ADK tool '{name}': {e}")
            # Return an error message in MCP format
            error_text = json.dumps({"error": f"Failed to execute tool '{name}': {str(e)}"})
            return [mcp_types.TextContent(type="text", text=error_text)]
    else:
        # Handle calls to unknown tools
        print(f"MCP Server: Tool '{name}' not found/exposed by this server.")
        error_text = json.dumps({"error": f"Tool '{name}' not implemented by this server."})
        return [mcp_types.TextContent(type="text", text=error_text)]

# --- MCP Server Runner ---
async def run_mcp_stdio_server():
    """Runs the MCP server, listening for connections over standard input/output."""
    # Use the stdio_server context manager from the mcp.server.stdio library
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        print("MCP Stdio Server: Starting handshake with client...")
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name=app.name, # Use the server name defined above
                server_version="0.1.0",
                capabilities=app.get_capabilities(
                    # Define server capabilities - consult MCP docs for options
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )
        print("MCP Stdio Server: Run loop finished or client disconnected.")

if __name__ == "__main__":
    print("Launching MCP Server to expose ADK tools via stdio...")
    try:
        asyncio.run(run_mcp_stdio_server())
    except KeyboardInterrupt:
        print("\nMCP Server (stdio) stopped by user.")
    except Exception as e:
        print(f"MCP Server (stdio) encountered an error: {e}")
    finally:
        print("MCP Server (stdio) process exiting.")
# --- End MCP Server ---
```

### 步驟 3：使用 Agent Development Kit (ADK) agent 測試你的自訂 MCP 伺服器

現在，建立一個 Agent Development Kit (ADK) agent，作為你剛剛建置的 MCP 伺服器的 client。這個 ADK agent 會使用 `MCPToolset` 來連接你的 `my_adk_mcp_server.py` 腳本。

建立一個 `agent.py`（例如，在 `./adk_agent_samples/mcp_client_agent/agent.py` 中）：

```python
# ./adk_agent_samples/mcp_client_agent/agent.py
import os
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# IMPORTANT: Replace this with the ABSOLUTE path to your my_adk_mcp_server.py script
PATH_TO_YOUR_MCP_SERVER_SCRIPT = "/path/to/your/my_adk_mcp_server.py" # <<< REPLACE

if PATH_TO_YOUR_MCP_SERVER_SCRIPT == "/path/to/your/my_adk_mcp_server.py":
    print("WARNING: PATH_TO_YOUR_MCP_SERVER_SCRIPT is not set. Please update it in agent.py.")
    # Optionally, raise an error if the path is critical

root_agent = LlmAgent(
    model='gemini-2.0-flash',
    name='web_reader_mcp_client_agent',
    instruction="Use the 'load_web_page' tool to fetch content from a URL provided by the user.",
    tools=[
        MCPToolset(
            connection_params=StdioConnectionParams(
                server_params = StdioServerParameters(
                    command='python3', # Command to run your MCP server script
                    args=[PATH_TO_YOUR_MCP_SERVER_SCRIPT], # Argument is the path to the script
                )
            )
            # tool_filter=['load_web_page'] # Optional: ensure only specific tools are loaded
        )
    ],
)
```

而且在同一個目錄下有一個 `__init__.py`：
```python
# ./adk_agent_samples/mcp_client_agent/__init__.py
from . import agent
```

**執行測試步驟如下：**

1.  **啟動你的自訂 MCP 伺服器（可選，方便分開觀察）：**
    你可以在一個終端機中直接執行 `my_adk_mcp_server.py`，以查看其日誌：
    ```shell
    python3 /path/to/your/my_adk_mcp_server.py
    ```
    它會顯示「Launching MCP Server...」並進入等待狀態。Agent Development Kit (ADK) agent（透過 `adk web` 執行）之後會連線到此程序，如果 `StdioConnectionParams` 中的 `command` 已設定為執行它。
    *（或者，`MCPToolset` 在 agent 初始化時會自動以子程序方式啟動此伺服器腳本）。*

2.  **為 client agent 執行 `adk web`：**
    請切換到 `mcp_client_agent` 的上層目錄（例如 `adk_agent_samples`），然後執行：
    ```shell
    cd ./adk_agent_samples # Or your equivalent parent directory
    adk web
    ```

3.  **在 Agent Development Kit (ADK) Web UI 互動：**
    *   選擇`web_reader_mcp_client_agent`。
    *   嘗試輸入提示詞，例如：「從 https://example.com" 載入內容」

ADK agent（`web_reader_mcp_client_agent`）將會使用`MCPToolset`來啟動並連接到你的`my_adk_mcp_server.py`。你的 MCP server 會收到`call_tool`請求，執行 ADK `load_web_page` tool，並回傳結果。ADK agent 隨後會轉發這些資訊。你應該能在 ADK Web UI（及其終端機）中看到日誌，若你是分開執行，也有可能會在`my_adk_mcp_server.py`終端機中看到日誌。

這個範例展示了如何將 ADK tools 封裝在 MCP server 之中，讓它們能被更廣泛的、符合 MCP 標準的 client 存取，而不僅僅是 ADK agent。

請參考[文件說明](https://modelcontextprotocol.io/quickstart/server#core-mcp-concepts)，嘗試搭配 Claude Desktop 使用。

## 在你自己的 Agent（非`adk web`）中使用 MCP Tools

如果你符合以下條件，本節內容適用於你：

* 你正在使用 ADK 開發自己的 agent
* 而且，你**沒有**使用`adk web`，
* 並且，你是透過自己的 UI 來對外提供 agent

由於 MCP Tools 的規格是以非同步方式，從遠端或其他程序運行的 MCP Server 取得，因此使用 MCP Tools 的設定方式與一般 tools 不同。

以下範例是從上方「範例 1：檔案系統 MCP Server」修改而來。主要差異如下：

1. 你的 tool 和 agent 需要以非同步方式建立
2. 你需要正確管理 exit stack，確保當與 MCP Server 的連線關閉時，agent 和 tools 能夠正確銷毀

```python
# agent.py (modify get_tools_async and other parts as needed)
# ./adk_agent_samples/mcp_agent/agent.py
import os
import asyncio
from dotenv import load_dotenv
from google.genai import types
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService # Optional
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# Load environment variables from .env file in the parent directory
# Place this near the top, before using env vars like API keys
load_dotenv('../.env')

# Ensure TARGET_FOLDER_PATH is an absolute path for the MCP server.
TARGET_FOLDER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "/path/to/your/folder")

# --- Step 1: Agent Definition ---
async def get_agent_async():
  """Creates an ADK Agent equipped with tools from the MCP Server."""
  toolset = MCPToolset(
      # Use StdioConnectionParams for local process communication
      connection_params=StdioConnectionParams(
          server_params = StdioServerParameters(
            command='npx', # Command to run the server
            args=["-y",    # Arguments for the command
                "@modelcontextprotocol/server-filesystem",
                TARGET_FOLDER_PATH],
          ),
      ),
      tool_filter=['read_file', 'list_directory'] # Optional: filter specific tools
      # For remote servers, you would use SseConnectionParams instead:
      # connection_params=SseConnectionParams(url="http://remote-server:port/path", headers={...})
  )

  # Use in an agent
  root_agent = LlmAgent(
      model='gemini-2.0-flash', # Adjust model name if needed based on availability
      name='enterprise_assistant',
      instruction='Help user accessing their file systems',
      tools=[toolset], # Provide the MCP tools to the ADK agent
  )
  return root_agent, toolset

# --- Step 2: Main Execution Logic ---
async def async_main():
  session_service = InMemorySessionService()
  # Artifact service might not be needed for this example
  artifacts_service = InMemoryArtifactService()

  session = await session_service.create_session(
      state={}, app_name='mcp_filesystem_app', user_id='user_fs'
  )

  # TODO: Change the query to be relevant to YOUR specified folder.
  # e.g., "list files in the 'documents' subfolder" or "read the file 'notes.txt'"
  query = "list files in the tests folder"
  print(f"User Query: '{query}'")
  content = types.Content(role='user', parts=[types.Part(text=query)])

  root_agent, toolset = await get_agent_async()

  runner = Runner(
      app_name='mcp_filesystem_app',
      agent=root_agent,
      artifact_service=artifacts_service, # Optional
      session_service=session_service,
  )

  print("Running agent...")
  events_async = runner.run_async(
      session_id=session.id, user_id=session.user_id, new_message=content
  )

  async for event in events_async:
    print(f"Event received: {event}")

  # Cleanup is handled automatically by the agent framework
  # But you can also manually close if needed:
  print("Closing MCP server connection...")
  await toolset.close()
  print("Cleanup complete.")

if __name__ == '__main__':
  try:
    asyncio.run(async_main())
  except Exception as e:
    print(f"An error occurred: {e}")
```


## 主要注意事項

在使用 MCP 與 Agent Development Kit (ADK) 時，請留意以下幾點：

* **協定 vs. 函式庫：**MCP 是一種協定規範，定義了通訊規則；ADK 則是用於構建 agent 的 Python 函式庫／框架。MCPToolset 透過在 ADK 框架內實作 MCP 協定的 client 端，將兩者連結起來。相對地，若要在 Python 中建立 MCP server，則需使用 model-context-protocol 函式庫。

* **ADK 工具 vs. MCP 工具：**

    * ADK 工具（如 BaseTool、FunctionTool、AgentTool 等）是設計給 ADK 的 LlmAgent 與 Runner 直接使用的 Python 物件。
    * MCP 工具則是 MCP Server 根據協定 schema 所暴露的能力。MCPToolset 會讓這些能力在 LlmAgent 看起來像是 ADK 工具。
    * Langchain/CrewAI 工具則是在這些函式庫中的特定實作，通常是簡單的函式或類別，並不具備 MCP 的 server／協定結構。ADK 提供了包裝器（如 LangchainTool、CrewaiTool）以支援部分互通。

* **非同步特性：**ADK 與 MCP 的 Python 函式庫都大量依賴 asyncio Python 函式庫。工具實作與 server handler 通常都應該是 async 函式。

* **有狀態的 session（MCP）：**MCP 建立了 client 與 server 實例之間有狀態、持久的連線。這與一般無狀態的 REST API 不同。

    * **部署：**這種有狀態性在擴展與部署時會帶來挑戰，特別是當遠端 server 需要處理大量使用者時。MCP 的原始設計通常假設 client 與 server 位於同一地點。管理這些持久連線時，基礎設施需特別考量（如負載平衡、session affinity）。
    * **ADK MCPToolset：**負責管理這些連線的生命週期。範例中展示的 exit\_stack 模式對於確保 ADK agent 結束時能正確終止連線（甚至 server process）至關重要。

## 使用 MCP 工具部署 Agent

當你要將使用 MCP 工具的 ADK agent 部署到 Cloud Run、GKE 或 Vertex AI Agent Engine 等生產環境時，必須考慮 MCP 連線在容器化與分散式環境中的運作方式。

### 關鍵部署要求：同步定義 agent

**⚠️ 重要：**在部署含 MCP 工具的 agent 時，必須在你的 `agent.py` 檔案中**同步**定義 agent 與其 MCPToolset。雖然 `adk web` 支援非同步建立 agent，但在部署環境下必須同步初始化。

```python
# ✅ CORRECT: Synchronous agent definition for deployment
import os
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.mcp_tool import StdioConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from mcp import StdioServerParameters

_allowed_path = os.path.dirname(os.path.abspath(__file__))

root_agent = LlmAgent(
    model='gemini-2.0-flash',
    name='enterprise_assistant',
    instruction=f'Help user accessing their file systems. Allowed directory: {_allowed_path}',
    tools=[
        MCPToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command='npx',
                    args=['-y', '@modelcontextprotocol/server-filesystem', _allowed_path],
                ),
                timeout=5,  # Configure appropriate timeouts
            ),
            # Filter tools for security in production
            tool_filter=[
                'read_file', 'read_multiple_files', 'list_directory',
                'directory_tree', 'search_files', 'get_file_info',
                'list_allowed_directories',
            ],
        )
    ],
)
```

```python
# ❌ WRONG: Asynchronous patterns don't work in deployment
async def get_agent():  # This won't work for deployment
    toolset = await create_mcp_toolset_async()
    return LlmAgent(tools=[toolset])
```

### 快速部署指令

#### Vertex AI Agent Engine
```bash
uv run adk deploy agent_engine \
  --project=<your-gcp-project-id> \
  --region=<your-gcp-region> \
  --staging_bucket="gs://<your-gcs-bucket>" \
  --display_name="My MCP Agent" \
  ./path/to/your/agent_directory
```

#### Cloud Run
```bash
uv run adk deploy cloud_run \
  --project=<your-gcp-project-id> \
  --region=<your-gcp-region> \
  --service_name=<your-service-name> \
  ./path/to/your/agent_directory
```

### 部署模式

#### 模式 1：自包含 Stdio MCP 伺服器

對於可以被封裝為 npm 套件或 Python 模組的 MCP 伺服器（例如 `@modelcontextprotocol/server-filesystem`），你可以直接將它們包含在你的 agent 容器中：

**容器需求：**
```dockerfile
# Example for npm-based MCP servers
FROM python:3.13-slim

# Install Node.js and npm for MCP servers
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Install your Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy your agent code
COPY . .

# Your agent can now use StdioConnectionParams with 'npx' commands
CMD ["python", "main.py"]
```

**Agent 設定：**
```python
# This works in containers because npx and the MCP server run in the same environment
MCPToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-filesystem", "/app/data"],
        ),
    ),
)
```

#### 模式 2：遠端 MCP 伺服器（可串流 HTTP）

針對需要擴展性的正式部署，建議將 MCP 伺服器作為獨立服務部署，並透過可串流 HTTP 連接：

**MCP 伺服器部署（Cloud Run）：**
```python
# deploy_mcp_server.py - Separate Cloud Run service using Streamable HTTP
import contextlib
import logging
from collections.abc import AsyncIterator
from typing import Any

import anyio
import click
import mcp.types as types
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.types import Receive, Scope, Send

logger = logging.getLogger(__name__)

def create_mcp_server():
    """Create and configure the MCP server."""
    app = Server("adk-mcp-streamable-server")

    @app.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[types.ContentBlock]:
        """Handle tool calls from MCP clients."""
        # Example tool implementation - replace with your actual ADK tools
        if name == "example_tool":
            result = arguments.get("input", "No input provided")
            return [
                types.TextContent(
                    type="text",
                    text=f"Processed: {result}"
                )
            ]
        else:
            raise ValueError(f"Unknown tool: {name}")

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        """List available tools."""
        return [
            types.Tool(
                name="example_tool",
                description="Example tool for demonstration",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "input": {
                            "type": "string",
                            "description": "Input text to process"
                        }
                    },
                    "required": ["input"]
                }
            )
        ]

    return app

def main(port: int = 8080, json_response: bool = False):
    """Main server function."""
    logging.basicConfig(level=logging.INFO)
    
    app = create_mcp_server()
    
    # Create session manager with stateless mode for scalability
    session_manager = StreamableHTTPSessionManager(
        app=app,
        event_store=None,
        json_response=json_response,
        stateless=True,  # Important for Cloud Run scalability
    )

    async def handle_streamable_http(scope: Scope, receive: Receive, send: Send) -> None:
        await session_manager.handle_request(scope, receive, send)

    @contextlib.asynccontextmanager
    async def lifespan(app: Starlette) -> AsyncIterator[None]:
        """Manage session manager lifecycle."""
        async with session_manager.run():
            logger.info("MCP Streamable HTTP server started!")
            try:
                yield
            finally:
                logger.info("MCP server shutting down...")

    # Create ASGI application
    starlette_app = Starlette(
        debug=False,  # Set to False for production
        routes=[
            Mount("/mcp", app=handle_streamable_http),
        ],
        lifespan=lifespan,
    )

    import uvicorn
    uvicorn.run(starlette_app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
```

**遠端 MCP 的 Agent 設定：**
```python
# Your ADK agent connects to the remote MCP service via Streamable HTTP
MCPToolset(
    connection_params=StreamableHTTPConnectionParams(
        url="https://your-mcp-server-url.run.app/mcp",
        headers={"Authorization": "Bearer your-auth-token"}
    ),
)
```

#### Pattern 3: Sidecar MCP Servers (GKE)

在 Kubernetes 環境中，你可以將 MCP 伺服器部署為 sidecar container（側車容器）：

```yaml
# deployment.yaml - GKE with MCP sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adk-agent-with-mcp
spec:
  template:
    spec:
      containers:
      # Main ADK agent container
      - name: adk-agent
        image: your-adk-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: MCP_SERVER_URL
          value: "http://localhost:8081"
      
      # MCP server sidecar
      - name: mcp-server
        image: your-mcp-server:latest
        ports:
        - containerPort: 8081
```

### 連線管理考量

#### Stdio 連線
- **優點：** 設定簡單、程序隔離、在容器中運作良好
- **缺點：** 程序額外負擔，不適合大規模部署
- **適用於：** 開發階段、單一租戶部署、簡易 MCP 伺服器

#### SSE/HTTP 連線  
- **優點：** 基於網路、可擴展、可同時處理多個用戶端
- **缺點：** 需要網路基礎設施、認證較為複雜
- **適用於：** 生產環境部署、多租戶系統、外部 MCP 服務

### 生產環境部署檢查清單

當使用 MCP 工具將 agent 部署到生產環境時：

**✅ 連線生命週期**
- 使用 exit_stack 模式確保 MCP 連線能正確清理
- 為連線建立與請求設定適當的逾時時間
- 實作重試邏輯以處理暫時性連線失敗

**✅ 資源管理**
- 監控 stdio MCP 伺服器的記憶體使用量（每個連線都會產生一個程序）
- 為 MCP 伺服器程序設定適當的 CPU/記憶體限制
- 遠端 MCP 伺服器可考慮使用連線池

**✅ 安全性**
- 遠端 MCP 連線請使用認證標頭（authentication headers）
- 限制 Agent Development Kit (ADK) agent 與 MCP 伺服器之間的網路存取
- **使用 `tool_filter` 過濾 MCP 工具，以限制暴露的功能**
- 驗證 MCP 工具輸入，防止注入攻擊
- 為檔案系統 MCP 伺服器使用限制性檔案路徑（例如：`os.path.dirname(os.path.abspath(__file__))`）
- 生產環境可考慮僅允許唯讀工具過濾器

**✅ 監控與可觀測性**
- 記錄 MCP 連線建立與關閉事件
- 監控 MCP 工具執行時間與成功率
- 為 MCP 連線失敗設置警報

**✅ 可擴展性**
- 大量部署時，建議優先使用遠端 MCP 伺服器而非 stdio
- 若使用有狀態（stateful）MCP 伺服器，請設定 session affinity
- 考慮 MCP 伺服器的連線上限並實作斷路器（circuit breaker）

### 特定環境設定

#### Cloud Run
```python
# Cloud Run environment variables for MCP configuration
import os

# Detect Cloud Run environment
if os.getenv('K_SERVICE'):
    # Use remote MCP servers in Cloud Run
    mcp_connection = SseConnectionParams(
        url=os.getenv('MCP_SERVER_URL'),
        headers={'Authorization': f"Bearer {os.getenv('MCP_AUTH_TOKEN')}"}
    )
else:
    # Use stdio for local development
    mcp_connection = StdioConnectionParams(
        server_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
        )
    )

MCPToolset(connection_params=mcp_connection)
```

#### GKE
```python
# GKE-specific MCP configuration
# Use service discovery for MCP servers within the cluster
MCPToolset(
    connection_params=SseConnectionParams(
        url="http://mcp-service.default.svc.cluster.local:8080/sse"
    ),
)
```

#### Vertex AI Agent Engine
```python
# Agent Engine managed deployment
# Prefer lightweight, self-contained MCP servers or external services
MCPToolset(
    connection_params=SseConnectionParams(
        url="https://your-managed-mcp-service.googleapis.com/sse",
        headers={'Authorization': 'Bearer $(gcloud auth print-access-token)'}
    ),
)
```

### 疑難排解部署問題

**常見的 MCP 部署問題：**

1. **Stdio 程序啟動失敗**
   ```python
   # Debug stdio connection issues
   MCPToolset(
       connection_params=StdioConnectionParams(
           server_params=StdioServerParameters(
               command='npx',
               args=["-y", "@modelcontextprotocol/server-filesystem", "/app/data"],
               # Add environment debugging
               env={'DEBUG': '1'}
           ),
       ),
   )
   ```

2. **網路連線問題**
   ```python
   # Test remote MCP connectivity
   import aiohttp
   
   async def test_mcp_connection():
       async with aiohttp.ClientSession() as session:
           async with session.get('https://your-mcp-server.com/health') as resp:
               print(f"MCP Server Health: {resp.status}")
   ```

3. **資源耗盡**
   - 使用 stdio MCP 伺服器時，請監控 container 記憶體使用狀況
   - 在 Kubernetes 部署中設定適當的限制
   - 對於資源密集型操作，建議使用遠端 MCP 伺服器

## 進一步資源

* [Model Context Protocol 文件說明](https://modelcontextprotocol.io/ )
* [MCP 規格](https://modelcontextprotocol.io/specification/)
* [MCP Python SDK 與範例](https://github.com/modelcontextprotocol/)