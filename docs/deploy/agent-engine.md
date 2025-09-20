# 部署至 Vertex AI Agent Engine

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="Vertex AI Agent Engine 目前僅支援 Python。"}

[Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview)
是一項由 Google Cloud 完全託管的服務，可讓開發人員在生產環境中部署、管理及擴展 AI 代理（agent）。Agent Engine 處理生產環境中代理（agent）的基礎設施擴展，讓你能專注於打造智慧且具影響力的應用程式。本指南提供兩種部署說明：當你需要快速部署 Agent Development Kit (ADK)（ADK）專案時，可參考加速部署指引；若你希望更細緻地管理代理（agent）部署流程，則可依照標準的逐步說明操作。

## 加速部署

本節說明如何使用
[Agent Starter Pack](https://github.com/GoogleCloudPlatform/agent-starter-pack)
（ASP）與 ADK 命令列介面 (CLI) 工具進行部署。此方法會利用 ASP 工具將專案範本套用至你的現有專案，新增部署所需的檔案，並將你的代理（agent）專案準備好進行部署。這些指引將說明如何使用 ASP 在 Google Cloud 專案中配置部署 ADK 專案所需的服務，步驟如下：

-   [先決條件](#prerequisites-ad)：設定 Google Cloud 帳戶、專案，並安裝必要軟體。
-   [準備你的 ADK 專案](#prepare-ad)：修改現有 ADK 專案檔案，為部署做好準備。
-   [連接至你的 Google Cloud 專案](#connect-ad)：
    將開發環境連接至 Google Cloud 及你的 Google Cloud 專案。
-   [部署你的 ADK 專案](#deploy-ad)：在 Google Cloud 專案中配置所需服務，並上傳你的 ADK 專案程式碼。

如需測試已部署代理（agent）的相關資訊，請參閱 [測試已部署代理](#test-deployment)。
如需更多關於 Agent Starter Pack 及其命令列工具的資訊，請參閱
[CLI 參考文件](https://googlecloudplatform.github.io/agent-starter-pack/cli/enhance.html)
及
[開發指南](https://googlecloudplatform.github.io/agent-starter-pack/guide/development-guide.html)。

### 先決條件 {#prerequisites-ad}

你需要以下資源已設定好，才能使用此部署路徑：

-   **Google Cloud 帳戶**，需具備管理員權限以：
-   **Google Cloud 專案**：一個啟用
    [計費功能](https://cloud.google.com/billing/docs/how-to/modify-project)
    的全新 Google Cloud 專案。關於建立專案的資訊，請參閱
    [建立與管理專案](https://cloud.google.com/resource-manager/docs/creating-managing-projects)。
-   **Python 環境**：Python 版本需介於 3.9 至 3.13 之間。
-   **UV 工具**：用於管理 Python 開發環境及執行 ASP 工具。安裝詳情請見
    [安裝 UV](https://docs.astral.sh/uv/getting-started/installation/)。
-   **Google Cloud CLI 工具**：gcloud 命令列介面。安裝詳情請見
    [Google Cloud Command Line Interface](https://cloud.google.com/sdk/docs/install)。
-   **Make 工具**：建置自動化工具。大多數 Unix 系統皆已內建，安裝詳情請參閱
    [Make 工具](https://www.gnu.org/software/make/) 文件。
-   **Terraform**：用於在 Google Cloud 上部署基礎設施與服務。安裝詳情請見
    [安裝 Terraform](https://developer.hashicorp.com/terraform/downloads)。

### 準備你的 ADK 專案 {#prepare-ad}

當你將 ADK 專案部署至 Agent Engine 時，需額外新增一些檔案以支援部署作業。以下 ASP 指令會先備份你的專案，然後將部署所需檔案新增至你的專案中。

這些指引假設你已有一個現有的 ADK 專案，並正準備將其修改以進行部署。如果你尚未有 ADK 專案，或希望使用測試專案，請參考 Python
[快速開始](/adk-docs/get-started/quickstart/)
指南，該指南會建立一個
[multi_tool_agent](https://github.com/google/adk-docs/tree/main/examples/python/snippets/get-started/multi_tool_agent)
專案。以下說明將以 `multi_tool_agent` 專案作為範例。

將你的 ADK 專案準備好部署至 Agent Engine：

1.  在開發環境的終端機視窗中，切換至專案的根目錄，例如：

    ```shell
    cd multi_tool_agent/
    ```

1.  執行 ASP `enhance` 指令，將部署所需的檔案加入您的專案中。

    ```shell
    uvx agent-starter-pack enhance --adk -d agent_engine
    ```

1.  請依照 ASP 工具的指示操作。一般來說，所有問題都可以接受預設答案。不過，針對 **GCP region**（GCP 區域）選項，請務必選擇 [Agent Engine 支援的區域](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview#supported-regions) 之一。

當你順利完成這個流程後，工具會顯示以下訊息：

```
> Success! Your agent project is ready.
```

!!! tip "注意"
    在執行 ASP 工具時，可能會顯示連線到 Google Cloud 的提醒，但此階段*不需要*連線。

如需了解 ASP 對您的 Agent Development Kit (ADK) 專案所做的變更，請參閱
[Changes to your ADK project](#adk-asp-changes)。

### 連線至您的 Google Cloud 專案 {#connect-ad}

在部署您的 Agent Development Kit (ADK) 專案之前，您必須先連線至 Google Cloud 以及您的專案。在登入您的 Google Cloud 帳戶後，請確認您的部署目標專案已顯示於帳戶中，並且已設定為目前的專案。

要連線至 Google Cloud 並列出您的專案，請執行下列步驟：

1.  在開發環境的終端機視窗中，登入您的 Google Cloud 帳戶：

    ```shell
    gcloud auth application-default login
    ```

1.  Set your target project using the Google Cloud Project ID:


1.  使用 Google Cloud 專案 ID 設定您的目標專案：

    ```shell
    gcloud config set project your-project-id-xxxxx
    ```

1.  Verify your Google Cloud target project is set:


1.  請確認您已設定好目標的 Google Cloud 專案：

    ```shell
    gcloud config get-value project
    ```

當你已成功連接至 Google Cloud 並設定好你的 Google Cloud 專案 ID 之後，就可以將你的 Agent Development Kit (ADK) 專案檔案部署到 Agent Engine 上。

### 部署你的 ADK 專案 {#deploy-ad}

使用 ASP 工具時，部署會分為多個階段。第一階段，你需要執行 `make` 指令，來配置在 Agent Engine 上執行 ADK 工作流程所需的服務。第二階段，則會將你的專案程式碼上傳到 Agent Engine 服務，並執行該 agent 專案。

!!! warning "重要"
    *在執行以下步驟前，請務必確認你的 Google Cloud 目標部署專案已設定為***目前專案***。* `make backend` 指令在部署時會使用你目前設定的 Google Cloud 專案。如何設定與檢查目前專案，請參考 [Connect to your Google Cloud project](#connect-ad)。

要將你的 ADK 專案部署到 Google Cloud 專案中的 Agent Engine，請依照下列步驟操作：

1.  在開發環境的終端機視窗中，切換到你的專案根目錄，例如：
    `cd multi_tool_agent/`
2.  執行以下 ASP make 指令，來配置開發環境（包含日誌、服務帳戶、儲存空間，以及 Vertex AI API）：

    ```shell
    make setup-dev-env
    ```

1.  將更新後的本機專案程式碼部署到 Google Cloud 開發環境，請執行以下 ASP make 指令：

    ```shell
    make backend
    ```

當這個流程順利完成後，你應該就能與運行於 Google Cloud Agent Engine 的 agent 互動。關於測試已部署 agent 的詳細資訊，請參閱下一節。

當這個流程順利完成後，你應該就能與運行於 Google Cloud Agent Engine 的 agent 互動。關於測試已部署 agent 的詳細資訊，請參閱
[測試已部署 agent](#test-deployment)。

### 你的 ADK 專案的變更 {#adk-asp-changes}

ASP 工具會為你的專案新增更多檔案以進行部署。以下步驟會在修改前備份你現有的專案檔案。本指南以
[multi_tool_agent](https://github.com/google/adk-docs/tree/main/examples/python/snippets/get-started/multi_tool_agent)
專案作為參考範例。原始專案一開始具有以下檔案結構：

```
multi_tool_agent/
├─ __init__.py
├─ agent.py
└─ .env
```

執行 ASP enhance 指令以新增 Agent Engine 部署資訊後，新的結構如下：

```
multi-tool-agent/
├─ app/                 # Core application code
│   ├─ agent.py         # Main agent logic
│   ├─ agent_engine_app.py # Agent Engine application logic
│   └─ utils/           # Utility functions and helpers
├─ .cloudbuild/         # CI/CD pipeline configurations for Google Cloud Build
├─ deployment/          # Infrastructure and deployment scripts
├─ notebooks/           # Jupyter notebooks for prototyping and evaluation
├─ tests/               # Unit, integration, and load tests
├─ Makefile             # Makefile for common commands
├─ GEMINI.md            # AI-assisted development guide
└─ pyproject.toml       # Project dependencies and configuration
```

如需更多資訊，請參閱已更新的 ADK 專案資料夾中的 README.md 檔案。
關於如何使用 Agent Starter Pack，請參閱
[Development guide](https://googlecloudplatform.github.io/agent-starter-pack/guide/development-guide.html)。

## 標準部署

本節將逐步說明如何部署至 Agent Engine。
如果您希望細緻管理部署設定，或是要修改現有的 Agent Engine 部署，請依照下列指引操作。

### 先決條件

本說明假設您已經定義了一個 Agent Development Kit (ADK) 專案。如果尚未建立 ADK 專案，請參閱
[Define your agent](#define-your-agent) 中建立測試專案的說明。

在開始部署程序前，請確認您已備妥以下項目：

1.  **Google Cloud 專案**：一個已啟用 [Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com) 的 Google Cloud 專案。

2.  **已驗證的 gcloud 命令列介面 (CLI)**：您需要已通過 Google Cloud 驗證。請在終端機中執行以下指令：
    ```shell
    gcloud auth application-default login
    ```

3.  **Google Cloud Storage (GCS) Bucket**：Agent Engine 需要一個 Google Cloud Storage (GCS) bucket 來暫存您的 agent 程式碼與相依套件，以便部署。如果您尚未擁有 bucket，請依照[這裡](https://cloud.google.com/storage/docs/creating-buckets)的指示建立。

4.  **Python 環境**：需要 Python 版本介於 3.9 至 3.13 之間。

5.  **安裝 Vertex AI SDK**

    Agent Engine 是 Vertex AI SDK for Python 的一部分。如需更多資訊，您可以參考 [Agent Engine 快速開始文件](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/quickstart)。

    ```shell
    pip install google-cloud-aiplatform[adk,agent_engines]>=1.111
    ```

### 定義你的 agent {#define-your-agent}

這些說明假設你已經有一個現有的 Agent Development Kit (ADK)（ADK）專案，並且正在進行部署相關的修改。如果你還沒有 ADK 專案，或想要使用測試專案，請先完成 Python [快速開始](/adk-docs/get-started/quickstart/) 指南，該指南會建立一個 [multi_tool_agent](https://github.com/google/adk-docs/tree/main/examples/python/snippets/get-started/multi_tool_agent) 專案。以下說明將以 `multi_tool_agent` 專案作為範例。

### 初始化 Vertex AI

接下來，初始化 Vertex AI SDK。這會告訴 SDK 要使用哪個 Google Cloud 專案與區域，以及部署時檔案要暫存在哪裡。

!!! tip "給 IDE 使用者"
    你可以將這段初始化程式碼，與後續步驟 3 到 6 的部署邏輯，一起放在獨立的 `deploy.py` 腳本中。

```python title="deploy.py"
import vertexai
from agent import root_agent # modify this if your agent is not in agent.py

# TODO: Fill in these values for your project
PROJECT_ID = "your-gcp-project-id"
LOCATION = "us-central1"  # For other options, see https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview#supported-regions
STAGING_BUCKET = "gs://your-gcs-bucket-name"

# Initialize the Vertex AI SDK
vertexai.init(
    project=PROJECT_ID,
    location=LOCATION,
    staging_bucket=STAGING_BUCKET,
)
```

### 為部署準備 agent

為了讓你的 agent 能夠相容於 Agent Engine，你需要將其包裝在 `AdkApp` 物件中。

```python title="deploy.py"
from vertexai import agent_engines

# Wrap the agent in an AdkApp object
app = agent_engines.AdkApp(
    agent=root_agent,
    enable_tracing=True,
)
```

!!!info
    當 AdkApp 部署到 Agent Engine 時，會自動使用 `VertexAiSessionService` 來管理持久化的 session 狀態。這可在無需額外設定的情況下，提供多輪對話記憶功能。若於本機測試，應用程式則預設使用暫存的記憶體型 session 服務。

### 本機測試 agent（選用）

在部署前，你可以先在本機測試 agent 的行為。

`async_stream_query` 方法會回傳一串代表 agent 執行追蹤紀錄的事件流。

```python title="deploy.py"
# Create a local session to maintain conversation history
session = await app.async_create_session(user_id="u_123")
print(session)
```

`create_session`（本機）預期輸出：

```console
Session(id='c6a33dae-26ef-410c-9135-b434a528291f', app_name='default-app-name', user_id='u_123', state={}, events=[], last_update_time=1743440392.8689594)
```

傳送查詢給 agent。請將以下程式碼複製貼上到你的 "deploy.py" Python 腳本或筆記本中。

```py title="deploy.py"
events = []
async for event in app.async_stream_query(
    user_id="u_123",
    session_id=session.id,
    message="whats the weather in new york",
):
    events.append(event)

# The full event stream shows the agent's thought process
print("--- Full Event Stream ---")
for event in events:
    print(event)

# For quick tests, you can extract just the final text response
final_text_responses = [
    e for e in events
    if e.get("content", {}).get("parts", [{}])[0].get("text")
    and not e.get("content", {}).get("parts", [{}])[0].get("function_call")
]
if final_text_responses:
    print("\n--- Final Response ---")
    print(final_text_responses[0]["content"]["parts"][0]["text"])
```

#### 理解輸出結果

當你執行上述程式碼時，會看到幾種類型的事件：

*   **Tool Call Event**：模型請求呼叫某個工具（例如：`get_weather`）。
*   **Tool Response Event**：系統將工具呼叫的結果回傳給模型。
*   **Model Response Event**：agent 處理完工具結果後，產生的最終文字回應。

`async_stream_query`（本機）預期輸出如下：

```console
{'parts': [{'function_call': {'id': 'af-a33fedb0-29e6-4d0c-9eb3-00c402969395', 'args': {'city': 'new york'}, 'name': 'get_weather'}}], 'role': 'model'}
{'parts': [{'function_response': {'id': 'af-a33fedb0-29e6-4d0c-9eb3-00c402969395', 'name': 'get_weather', 'response': {'status': 'success', 'report': 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}}}], 'role': 'user'}
{'parts': [{'text': 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}], 'role': 'model'}
```

### 部署到 Agent Engine

當你對 agent 在本機的行為感到滿意後，就可以進行部署。你可以使用 Python SDK 或 `adk` 命令列工具來完成這個操作。

此流程會將你的程式碼打包，建置成容器，並部署到受管的 Agent Engine 服務。這個過程可能需要數分鐘。

=== "ADK CLI"

    You can deploy from your terminal using the `adk deploy` command line tool.
    The following example deploy command uses the `multi_tool_agent` sample
    code as the project to be deployed:

    ```shell
    adk deploy agent_engine \
        --project=my-cloud-project-xxxxx \
        --region=us-central1 \
        --staging_bucket=gs://my-cloud-project-staging-bucket-name \
        --display_name="My Agent Name" \
        /multi_tool_agent
    ```

    Find the names of your available storage buckets in the
    [Cloud Storage Bucket](https://pantheon.corp.google.com/storage/browser)
    section of your deployment project in the Google Cloud Console.
    For more details on using the `adk deploy` command, see the 
    [ADK CLI reference](/adk-docs/api-reference/cli/cli.html#adk-deploy).

    !!! tip
        Make sure your main ADK agent definition (`root_agent`) is 
        discoverable when deploying your ADK project.

=== "Python"

    This code block initiates the deployment from a Python script or notebook.

    ```python title="deploy.py"
    from vertexai import agent_engines

    remote_app = agent_engines.create(
        agent_engine=app,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]"   
        ]
    )

    print(f"Deployment finished!")
    print(f"Resource Name: {remote_app.resource_name}")
    # Resource Name: "projects/{PROJECT_NUMBER}/locations/{LOCATION}/reasoningEngines/{RESOURCE_ID}"
    #       Note: The PROJECT_NUMBER is different than the PROJECT_ID.
    ```

#### 監控與驗證

*   你可以在 Google Cloud Console 的 [Agent Engine UI](https://console.cloud.google.com/vertex-ai/agents/agent-engines) 監控部署狀態。
*   `remote_app.resource_name` 是你已部署 agent 的唯一識別碼。你將需要此識別碼來與 agent 互動。你也可以從 ADK 命令列介面 (CLI) 指令回傳的結果中取得這個識別碼。
*   如需更多細節，請參閱 Agent Engine 文件：[部署 agent](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/deploy) 及 [管理已部署的 agent](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/manage/overview)。

## 測試已部署的 agent {#test-deployment}

當你完成將 agent 部署到 Agent Engine 後，你可以透過 Google Cloud Console
檢視已部署的 agent，並可使用 REST 呼叫或 Python 的 Vertex AI SDK 與 agent 互動。

要在 Cloud Console 中檢視已部署的 agent：

-   前往 Google Cloud Console 的 Agent Engine 頁面：
    [https://console.cloud.google.com/vertex-ai/agents/agent-engines](https://console.cloud.google.com/vertex-ai/agents/agent-engines)

此頁面會列出目前所選 Google Cloud 專案中所有已部署的 agent。如果你沒有看到你的 agent，請確認你已在 Google Cloud Console 選擇正確的目標專案。如需選擇現有 Google Cloud 專案的更多資訊，請參閱
[建立與管理專案](https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects)。

### 查找 Google Cloud 專案資訊

你需要專案的位址與資源識別資訊（`PROJECT_ID`、`LOCATION`、`RESOURCE_ID`）才能測試你的部署。你可以使用 Cloud Console 或 `gcloud` 命令列工具來查找這些資訊。

使用 Google Cloud Console 查找專案資訊：

1.  在 Google Cloud Console 中，前往 Agent Engine 頁面：
    [https://console.cloud.google.com/vertex-ai/agents/agent-engines](https://console.cloud.google.com/vertex-ai/agents/agent-engines)

1.  在頁面頂端，選擇 **API URLs**，然後複製你已部署 agent 的 **Query URL** 字串，格式如下：

        https://$(LOCATION_ID)-aiplatform.googleapis.com/v1/projects/$(PROJECT_ID)/locations/$(LOCATION_ID)/reasoningEngines/$(RESOURCE_ID):query

使用 `gloud` 查找專案資訊：

1.  在你的開發環境中，請確保你已驗證 Google Cloud 身份，並執行下列指令以列出你的專案：

    ```shell
    gcloud projects list
    ```

1.  取得用於部署的 Project ID，然後執行以下指令以獲取更多詳細資訊：

    ```shell
    gcloud asset search-all-resources \
        --scope=projects/$(PROJECT_ID) \
        --asset-types='aiplatform.googleapis.com/ReasoningEngine' \
        --format="table(name,assetType,location,reasoning_engine_id)"
    ```

### 使用 REST 呼叫進行測試

與你在 Agent Engine 上部署的 agent 互動，一個簡單的方法是使用 `curl` 工具進行 REST 呼叫。本節將說明如何檢查你與 agent 的連線，以及如何測試部署後 agent 的請求處理。

#### 檢查與 agent 的連線

你可以利用 Cloud Console 中 Agent Engine 區段提供的 **查詢 URL**（Query URL），來檢查你與執行中 agent 的連線。這個檢查不會執行部署的 agent，而是回傳有關 agent 的資訊。

若要發送 REST 呼叫並從部署的 agent 獲得回應：

-   在開發環境的終端機視窗中，建立請求並執行：

    ```shell
    curl -X GET \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        "https://$(LOCATION)-aiplatform.googleapis.com/v1/projects/$(PROJECT_ID)/locations/$(LOCATION)/reasoningEngines"
    ```

如果您的部署成功，這個請求會回應一個有效請求的清單以及預期的資料格式。

!!! tip "agent 連線存取權"
    此連線測試要求呼叫的使用者必須擁有已部署 agent 的有效存取權杖。當您從其他環境進行測試時，請確保呼叫的使用者有權連線至您 Google Cloud 專案中的 agent。

#### 發送 agent 請求

當您從 agent 專案取得回應時，必須先建立一個 session，取得 Session ID，然後使用該 Session ID 發送您的請求。此流程說明如下。

若要透過 REST 測試與已部署 agent 的互動：

1.  在您的開發環境終端機視窗中，依照下列範本建立請求以建立一個 session：

    ```shell
    curl \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json" \
        https://$(LOCATION)-aiplatform.googleapis.com/v1/projects/$(PROJECT_ID)/locations/$(LOCATION)/reasoningEngines/$(RESOURCE_ID):query \
        -d '{"class_method": "async_create_session", "input": {"user_id": "u_123"},}'
    ```

1.  在前一個指令的回應中，從 **id** 欄位擷取所建立的 **Session ID**：

    ```json
    {
        "output": {
            "userId": "u_123",
            "lastUpdateTime": 1757690426.337745,
            "state": {},
            "id": "4857885913439920384", # Session ID
            "appName": "9888888855577777776",
            "events": []
        }
    }
    ```

1.  在您的開發環境的終端機視窗中，請使用以下範本以及前一步建立的 Session ID，來組建請求並傳送訊息給您的 agent：

    ```shell
    curl \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    https://$(LOCATION)-aiplatform.googleapis.com/v1/projects/$(PROJECT_ID)/locations/$(LOCATION)/reasoningEngines/$(RESOURCE_ID):streamQuery?alt=sse -d '{
    "class_method": "async_stream_query",
    "input": {
        "user_id": "u_123",
        "session_id": "4857885913439920384",
        "message": "Hey whats the weather in new york today?",
    }
    }'
    ```

此請求應該會從你部署的 agent 程式碼產生一個 JSON 格式的回應。關於如何透過 REST 呼叫與部署於 Agent Engine 的 Agent Development Kit (ADK)（ADK）agent 互動的更多資訊，請參閱 Agent Engine 文件中的
[Manage deployed agents](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/manage/overview#console)
以及
[Use a Agent Development Kit agent](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/use/adk)。

### 使用 Python 進行測試

你可以使用 Python 程式碼，對部署於 Agent Engine 的 agent 進行更進階且可重複的測試。以下說明如何與部署的 agent 建立 session，並傳送請求給 agent 處理。

#### 建立遠端 session

使用 `remote_app` 物件來建立與已部署遠端 agent 的連線：

```py
# If you are in a new script or used the ADK CLI to deploy, you can connect like this:
# remote_app = agent_engines.get("your-agent-resource-name")
remote_session = await remote_app.async_create_session(user_id="u_456")
print(remote_session)
```

`create_session`（remote）的預期輸出：

```console
{'events': [],
'user_id': 'u_456',
'state': {},
'id': '7543472750996750336',
'app_name': '7917477678498709504',
'last_update_time': 1743683353.030133}
```

`id` 的值是 session ID，而 `app_name` 則是在 Agent Engine 上已部署 agent 的 resource ID。

#### 向你的遠端 agent 發送查詢

```py
async for event in remote_app.async_stream_query(
    user_id="u_456",
    session_id=remote_session["id"],
    message="whats the weather in new york",
):
    print(event)
```

`async_stream_query`（remote）的預期輸出：

```console
{'parts': [{'function_call': {'id': 'af-f1906423-a531-4ecf-a1ef-723b05e85321', 'args': {'city': 'new york'}, 'name': 'get_weather'}}], 'role': 'model'}
{'parts': [{'function_response': {'id': 'af-f1906423-a531-4ecf-a1ef-723b05e85321', 'name': 'get_weather', 'response': {'status': 'success', 'report': 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}}}], 'role': 'user'}
{'parts': [{'text': 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}], 'role': 'model'}
```

如需有關在 Agent Engine 中與已部署的 Agent Development Kit (ADK)（ADK）agent 互動的更多資訊，請參閱 Agent Engine 文件中的
[管理已部署的 agent](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/manage/overview)
以及
[使用 Agent Development Kit agent](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/use/adk)。

#### 傳送多模態查詢

若要向您的 agent 傳送多模態查詢（例如包含圖片），您可以將 `message` 參數（用於 `async_stream_query`）建構為 `types.Part` 物件的清單。每個部分可以是文字或圖片。

若要包含圖片，您可以使用 `types.Part.from_uri`，並提供圖片的 Google Cloud Storage (GCS) URI。

```python
from google.genai import types

image_part = types.Part.from_uri(
    file_uri="gs://cloud-samples-data/generative-ai/image/scones.jpg",
    mime_type="image/jpeg",
)
text_part = types.Part.from_text(
    text="What is in this image?",
)

async for event in remote_app.async_stream_query(
    user_id="u_456",
    session_id=remote_session["id"],
    message=[text_part, image_part],
):
    print(event)
```

!!!note 
    雖然底層與模型的通訊可能會針對影像進行 Base64 編碼，但建議且支援的方式，是透過提供 GCS URI 來將影像資料傳送給部署於 Agent Engine 的 agent。

## 部署 payload {#payload}

當你將 Agent Development Kit (ADK)（ADK）agent 專案部署到 Agent Engine 時，以下內容會被上傳到服務：

- 你的 ADK agent 程式碼
- 在你的 ADK agent 程式碼中宣告的所有相依套件

部署內容*不會*包含 ADK API server 或 ADK 網頁 UI 函式庫。Agent Engine 服務會提供 ADK API server 所需的函式庫功能。

## 清理部署

如果你曾經進行過測試性部署，建議在完成後清理你的雲端資源。你可以刪除已部署的 Agent Engine 執行個體，以避免在 Google Cloud 帳戶上產生任何非預期的費用。

```python
remote_app.delete(force=True)
```

`force=True` 參數也會一併刪除從已部署 agent 所產生的任何子資源，例如 session。你也可以透過 Google Cloud 上的 [Agent Engine UI](https://console.cloud.google.com/vertex-ai/agents/agent-engines) 刪除已部署的 agent。
