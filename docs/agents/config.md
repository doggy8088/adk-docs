# 使用 Agent Config 建立代理（agent）

Agent Development Kit (ADK) 的 Agent Config 功能，讓你可以在不撰寫程式碼的情況下建立 ADK 工作流程。Agent Config 採用 YAML 格式的文字檔，並包含對代理（agent）的簡要描述，使幾乎任何人都能組裝並執行 ADK 代理（agent）。以下是一個基本 Agent Config 定義的簡單範例：

```
name: assistant_agent
model: gemini-2.5-flash
description: A helper agent that can answer users' questions.
instruction: You are an agent to help answer users' various questions.
```

你可以使用 Agent Config 檔案來建立更複雜的 agent，這些 agent 可以整合 Functions、Tools、Sub-Agents 等功能。本頁將說明如何利用 Agent Config 功能來建立並執行 Agent Development Kit (ADK) 工作流程。如需 Agent Config 格式所支援的語法與設定詳細資訊，請參閱
[Agent Config syntax reference](/adk-docs/api-reference/agentconfig/)。

!!! example "實驗性功能"
    Agent Config 功能目前為實驗性，且有一些
    [已知限制](#known-limitations)。歡迎提供您的
    [意見回饋](https://github.com/google/adk-python/issues/new?template=feature_request.md&labels=agent%20config)！

## 開始使用

本節將說明如何使用 ADK 及 Agent Config 功能來設定並開始建立 agent，包括安裝設定、建立 agent 以及執行您的 agent。

### 安裝設定

你需要安裝 Google Agent Development Kit (ADK) 函式庫，並提供像是 Gemini API 這類生成式 AI 模型的存取金鑰。本節將說明在你能使用 Agent Config 檔案執行 agent 前，必須安裝與設定的項目。

!!! note
    Agent Config 功能目前僅支援 Gemini 模型。關於其他功能限制，請參閱
    [Known limitations](#known-limitations)。

要設定 ADK 以搭配 Agent Config 使用，請依下列步驟操作：

1.  依照
    [Installation](/adk-docs/get-started/installation/#python)
    指南安裝 ADK Python 函式庫。*目前僅支援 Python。* 詳細資訊請參閱
    [Known limitations](?tab=t.0#heading=h.xefmlyt7zh0i)。
1.  在終端機執行以下指令，確認 ADK 已安裝：

        adk --version

    此指令會顯示你已安裝的 ADK 版本。

!!! Tip
    如果 `adk` 指令無法執行，且第 2 步未顯示版本，請確保你的 Python 虛擬環境已啟用。在 macOS 或 Linux 終端機輸入 `source .venv/bin/activate`。如需其他平台的指令，請參閱
    [Installation](/adk-docs/get-started/installation/#python)
    頁面。

### 建立 agent

你可以使用 `adk create` 指令搭配 Agent Config 來建立 agent 的專案檔案，然後編輯它自動產生的 `root_agent.yaml` 檔案。

建立可用於 Agent Config 的 ADK 專案步驟如下：

1.  在終端機視窗執行以下指令，建立以 config 為基礎的 agent：

        adk create --type=config my_agent

    此指令會產生一個 `my_agent/` 資料夾，內含
    `root_agent.yaml` 檔案和 `.env` 檔案。

1.  在 `my_agent/.env` 檔案中，設定 agent 存取生成式 AI 模型及其他服務所需的環境變數：

    1.  若要透過 Google API 存取 Gemini 模型，在檔案中新增一行，填入你的 API 金鑰：

            GOOGLE_GENAI_USE_VERTEXAI=0
            GOOGLE_API_KEY=<your-Google-Gemini-API-key>

        你可以從 Google AI Studio 的
        [API Keys](https://aistudio.google.com/app/apikey) 頁面取得 API 金鑰。

    1.  若要透過 Google Cloud 存取 Gemini 模型，在檔案中新增以下內容：

            GOOGLE_GENAI_USE_VERTEXAI=1
            GOOGLE_CLOUD_PROJECT=<your_gcp_project>
            GOOGLE_CLOUD_LOCATION=us-central1

        關於如何建立 Cloud Project，請參閱 Google Cloud 文件
        [Creating and managing projects](https://cloud.google.com/resource-manager/docs/creating-managing-projects)。

1.  使用文字編輯器編輯 Agent Config 檔案
    `my_agent/root_agent.yaml`，如下所示：

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
name: assistant_agent
model: gemini-2.5-flash
description: A helper agent that can answer users' questions.
instruction: You are an agent to help answer users' various questions.
```

你可以參考 Agent Development Kit (ADK) 的
[samples repository](https://github.com/search?q=repo%3Agoogle%2Fadk-python+path%3A%2F%5Econtributing%5C%2Fsamples%5C%2F%2F+.yaml&type=code)
或
[Agent Config syntax](/adk-docs/api-reference/agentconfig/)
參考文件，來瞭解更多`root_agent.yaml` agent 設定檔的其他設定選項。

### 執行 agent

完成編輯 Agent Config 後，你可以透過網頁 UI、命令列終端機執行，或 API server 模式來啟動你的 agent。

要執行你以 Agent Config 定義的 agent，請依下列步驟操作：

1.  在終端機中，切換到包含`root_agent.yaml`檔案的`my_agent/`目錄。
1.  輸入以下其中一個指令來執行你的 agent：
    -   `adk web` - 啟動 agent 的網頁 UI 介面。
    -   `adk run` - 在終端機中執行 agent，不啟用使用者介面。
    -   `adk api_server` - 以服務模式執行 agent，讓其他應用程式可以使用。

如需更多有關執行 agent 方式的資訊，請參閱
[快速開始](/adk-docs/get-started/quickstart/#run-your-agent)
中的 *Run Your Agent* 主題。
如需 ADK 命令列介面 (CLI) 相關選項的詳細說明，請參閱
[ADK CLI 參考](/adk-docs/api-reference/cli/)。

## 設定檔範例

本節提供 Agent Config 設定檔的範例，協助你開始建立 agent。如需更多完整的範例，請參考 ADK
[samples repository](https://github.com/search?q=repo%3Agoogle%2Fadk-python+path%3A%2F%5Econtributing%5C%2Fsamples%5C%2F%2F+root_agent.yaml&type=code)。

### 內建工具範例

以下範例使用 ADK 內建工具函式，透過 Google 搜尋功能為 agent 提供服務。此 agent 會自動使用搜尋工具來回應使用者請求。

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
name: search_agent
model: gemini-2.0-flash
description: 'an agent whose job it is to perform Google search queries and answer questions about the results.'
instruction: You are an agent whose job is to perform Google search queries and answer questions about the results.
tools:
  - name: google_search
```

如需更多細節，請參閱
[ADK sample repository](https://github.com/google/adk-python/blob/main/contributing/samples/tool_builtin_config/root_agent.yaml) 中此範例的完整程式碼。

### 自訂工具範例

以下範例使用一個以 Python 程式碼實作的自訂工具，並在 config 檔案的 `tools:` 區段中列出。agent 會使用這個工具來檢查使用者提供的數字清單是否為質數。

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
agent_class: LlmAgent
model: gemini-2.5-flash
name: prime_agent
description: Handles checking if numbers are prime.
instruction: |
  You are responsible for checking whether numbers are prime.
  When asked to check primes, you must call the check_prime tool with a list of integers.
  Never attempt to determine prime numbers manually.
  Return the prime number results to the root agent.
tools:
  - name: ma_llm.check_prime
```

如需更多細節，請參閱
[ADK 範例程式庫](https://github.com/google/adk-python/blob/main/contributing/samples/multi_agent_llm_config/prime_agent.yaml) 中此範例的完整程式碼。

### 子代理（sub-agents）範例

以下範例展示了一個在設定檔的 `sub_agents:` 區段中定義了兩個子代理（sub-agents），以及在 `tools:` 區段中定義了一個範例工具（tool）的 agent。這個 agent 會判斷使用者的需求，並委派給其中一個子代理來處理請求。子代理是透過 Agent Config YAML 檔案來定義的。

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
agent_class: LlmAgent
model: gemini-2.5-flash
name: root_agent
description: Learning assistant that provides tutoring in code and math.
instruction: |
  You are a learning assistant that helps students with coding and math questions.

  You delegate coding questions to the code_tutor_agent and math questions to the math_tutor_agent.

  Follow these steps:
  1. If the user asks about programming or coding, delegate to the code_tutor_agent.
  2. If the user asks about math concepts or problems, delegate to the math_tutor_agent.
  3. Always provide clear explanations and encourage learning.
sub_agents:
  - config_path: code_tutor_agent.yaml
  - config_path: math_tutor_agent.yaml
```

如需更多細節，請參閱
[ADK 範例程式庫](https://github.com/google/adk-python/blob/main/contributing/samples/multi_agent_basic_config/root_agent.yaml)
中的完整範例程式碼。

## 部署 Agent Config

你可以使用
[Cloud Run](/adk-docs/deploy/cloud-run/)
和
[Agent Engine](/adk-docs/deploy/agent-engine/)
來部署 Agent Config 代理（agent），其流程與程式碼型代理（agent）相同。關於如何準備與部署基於 Agent Config 的代理（agent），請參閱
[Cloud Run](/adk-docs/deploy/cloud-run/)
和
[Agent Engine](/adk-docs/deploy/agent-engine/)
的部署指南。

## 已知限制 {#known-limitations}

Agent Config 功能目前為實驗性質，並包含以下限制：

-   **模型支援：** 目前僅支援 Gemini 模型。與第三方模型的整合尚在進行中。
-   **程式語言：** Agent Config 功能目前僅支援 Python 程式碼，用於工具（tools）及其他需要程式碼的功能。
-   **ADK 工具支援：** Agent Config 功能支援下列 ADK 工具，但*並非所有工具皆完全支援*：
    -   `google_search`
    -   `load_artifacts`
    -   `url_context`
    -   `exit_loop`
    -   `preload_memory`
    -   `get_user_choice`
    -   `enterprise_web_search`
    -   `load_web_page`：需提供完整路徑才能存取網頁。
-   **代理（agent）類型支援：** `LangGraphAgent` 與 `A2aAgent` 類型目前尚未支援。
    -   `AgentTool`
    -   `LongRunningFunctionTool`
    -   `VertexAiSearchTool`
    -   `MCPToolset`
    -   `CrewaiTool`
    -   `LangchainTool`
    -   `ExampleTool`

## 下一步

如需使用 Agent Development Kit (ADK) Agent Config 的應用靈感，請參閱 ADK
[adk-samples](https://github.com/search?q=repo:google/adk-python+path:/%5Econtributing%5C/samples%5C//+root_agent.yaml&type=code)
程式庫中的 yaml 格式代理（agent）定義。關於 Agent Config 格式所支援的語法與設定，請參閱
[Agent Config 語法參考](/adk-docs/api-reference/agentconfig/)。
