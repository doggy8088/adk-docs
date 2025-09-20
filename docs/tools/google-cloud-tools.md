# Google Cloud 工具

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援規劃中／即將推出。"}

Google Cloud 工具讓您更輕鬆地將您的代理（agent）連接至 Google Cloud 的產品與服務。只需幾行程式碼，您就可以使用這些工具將代理連接到：

* 開發人員在 Apigee 上託管的**任何自訂 API**
* 數百個**預建連接器**，可連接至如 Salesforce、Workday、SAP 等企業系統
* 透過應用程式整合（Application Integration）建立的**自動化工作流程**
* 使用 MCP Toolbox for databases 連接如 Spanner、AlloyDB、Postgres 等**資料庫**

![Google Cloud Tools](../assets/google_cloud_tools.svg)

## Apigee API Hub 工具

**ApiHubToolset** 讓您只需幾行程式碼，即可將來自 Apigee API hub 的任何已文件化（documented）的 API 轉換為工具。本節將逐步說明，包括如何設定驗證，以安全地連接至您的 API。

**先決條件**

1. [安裝 Agent Development Kit (ADK)](../get-started/installation.md)
2. 安裝
   [Google Cloud 命令列介面 (CLI)](https://cloud.google.com/sdk/docs/install?db=bigtable-docs#installation_instructions)
3. 擁有已文件化（例如 OpenAPI 規格）的 [Apigee API hub](https://cloud.google.com/apigee/docs/apihub/what-is-api-hub) 實例
4. 設定您的專案結構並建立所需檔案

```console
project_root_folder
 |
 `-- my_agent
     |-- .env
     |-- __init__.py
     |-- agent.py
     `__ tool.py
```

### 建立 API Hub 工具集

注意：本教學包含代理程式（agent）的建立。如果你已經有代理程式，只需執行這些步驟的部分內容即可。

1. 取得你的存取權杖（access token），以便 APIHubToolset 能夠從 API Hub API 擷取規格。在你的終端機中執行以下指令

    ```shell
    gcloud auth print-access-token
    # Prints your access token like 'ya29....'
    ```

2. 確認所使用的帳戶擁有所需的權限。你可以使用預先定義的角色 `roles/apihub.viewer`，或指派以下權限：

    1. **apihub.specs.get（必要）**
    2. apihub.apis.get（選用）
    3. apihub.apis.list（選用）
    4. apihub.versions.get（選用）
    5. apihub.versions.list（選用）
    6. apihub.specs.list（選用）

3. 使用 `APIHubToolset` 建立工具。將以下內容新增至 `tools.py`

    如果你的 API 需要驗證，必須為該工具設定驗證機制。以下程式碼範例示範如何設定 API 金鑰。Agent Development Kit (ADK) 支援基於權杖的驗證（API 金鑰、Bearer 權杖）、服務帳戶，以及 OpenID Connect。我們即將新增對各種 OAuth2 流程的支援。

    ```py
    from google.adk.tools.openapi_tool.auth.auth_helpers import token_to_scheme_credential
    from google.adk.tools.apihub_tool.apihub_toolset import APIHubToolset

    # Provide authentication for your APIs. Not required if your APIs don't required authentication.
    auth_scheme, auth_credential = token_to_scheme_credential(
        "apikey", "query", "apikey", apikey_credential_str
    )

    sample_toolset = APIHubToolset(
        name="apihub-sample-tool",
        description="Sample Tool",
        access_token="...",  # Copy your access token generated in step 1
        apihub_resource_name="...", # API Hub resource name
        auth_scheme=auth_scheme,
        auth_credential=auth_credential,
    )
    ```

    在正式環境部署時，我們建議使用服務帳戶（service account）來取代 access token。在上述程式碼片段中，請使用
`service_account_json=service_account_cred_json_str`，並提供您的
服務帳戶憑證，而非 token。

關於 `apihub_resource_name`，如果您已知用於 API 的 OpenAPI Spec 的特定 ID，請使用
`` `projects/my-project-id/locations/us-west1/apis/my-api-id/versions/version-id/specs/spec-id` ``。
如果您希望 Toolset 自動從 API 拉取第一個可用的規範（spec），請使用
`` `projects/my-project-id/locations/us-west1/apis/my-api-id` ``

4. 建立您的代理人檔案 Agent.py，並將已建立的工具加入您的代理人定義中：

    ```py
    from google.adk.agents.llm_agent import LlmAgent
    from .tools import sample_toolset

    root_agent = LlmAgent(
        model='gemini-2.0-flash',
        name='enterprise_assistant',
        instruction='Help user, leverage the tools you have access to',
        tools=sample_toolset.get_tools(),
    )
    ```

5. 設定您的`__init__.py`以公開您的 agent

    ```py
    from . import agent
    ```

6. 啟動 Google Agent Development Kit (ADK) Web UI 並嘗試你的 agent：

    ```shell
    # make sure to run `adk web` from your project_root_folder
    adk web
    ```

   接著前往 [http://localhost:8000](http://localhost:8000)，從 Web UI 嘗試你的 agent。

---

## 應用程式整合工具

透過 **ApplicationIntegrationToolset**，你可以無縫地讓你的 agent 以安全且受治理的方式存取企業應用程式，利用 Integration Connectors 超過 100 種預先建置的連接器，支援如 Salesforce、ServiceNow、JIRA、SAP 等系統。

它同時支援本地端（on-premise）與 SaaS 應用程式。此外，你也可以將現有的 Application Integration 流程自動化，轉換為 agentic 工作流程，方法是將應用程式整合工作流程作為工具，提供給你的 ADK agent 使用。

### 先決條件

#### 1. 安裝 ADK

=== "Python"

    Install the latest version of [ADK](../get-started/installation.md). For information about the latest version of ADK, see [Agent Development Kit Walkthrough](https://docs.google.com/document/d/1oqXkqX9m5wjWE-rkwp-qO0CGpSEQHBTYAYQcWRf91XU/edit?tab=t.0#heading=h.7k9wrm8jpdug).

=== "Java"

    Install the latest version of [ADK](../get-started/installation.md). For information about the latest version of ADK, see [Agent Development Kit Walkthrough](https://docs.google.com/document/d/1oqXkqX9m5wjWE-rkwp-qO0CGpSEQHBTYAYQcWRf91XU/edit?tab=t.0#heading=h.7k9wrm8jpdug).


#### 2. 安裝命令列介面 (CLI)

=== "Python"

    Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install#installation_instructions). To use the tool with default credentials, run the following commands:
    
      ```shell
      gcloud config set project <project-id>
      gcloud auth application-default login
      gcloud auth application-default set-quota-project <project-id>
      ```
    
    Replace `<project-id>` with the unique ID of your Google Cloud project.
    
=== "Java"

    Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install#installation_instructions). To use the tool with default credentials, run the following commands:
    
      ```bash
      gcloud config set project <project-id>
      gcloud auth application-default login
      gcloud auth application-default set-quota-project <project-id>
      ```
    
    Replace `<project-id>` with the unique ID of your Google Cloud project.


#### 3. 部署 Application Integration 工作流程並發佈 Connection Tool

=== "Python"

    Use an existing [Application Integration](https://cloud.google.com/application-integration/docs/overview) workflow or [Integrations Connector](https://cloud.google.com/integration-connectors/docs/overview) connection you want to use with your agent. You can also create a new [Application Integration workflow](https://cloud.google.com/application-integration/docs/setup-application-integration) or a [connection](https://cloud.google.com/integration-connectors/docs/connectors/neo4j/configure#configure-the-connector).
    
    Import and publish the [Connection Tool](https://console.cloud.google.com/integrations/templates/connection-tool/locations/global) from the template library.
    
    **Note**: To use a connector from Integration Connectors, you need to provision Application Integration in the same region as your connection.

=== "Java"

    Use an existing [Application Integration](https://cloud.google.com/application-integration/docs/overview) workflow or [Integrations Connector](https://cloud.google.com/integration-connectors/docs/overview) connection you want to use with your agent. You can also create a new [Application Integration workflow](https://cloud.google.com/application-integration/docs/setup-application-integration) or a [connection](https://cloud.google.com/integration-connectors/docs/connectors/neo4j/configure#configure-the-connector).
    
    Import and publish the [Connection Tool](https://console.cloud.google.com/integrations/templates/connection-tool/locations/global) from the template library.
    
    **Note**: To use a connector from Integration Connectors, you need to provision Application Integration in the same region as your connection, import and publish Connection Tool from the template library.

#### 4. 建立專案結構

=== "Python"

    Set up your project structure and create required files.
    
      ```console
      project_root_folder
      |-- .env
      `-- my_agent
          |-- __init__.py
          |-- agent.py
          `__ tools.py
      ```
    
    When running the agent, make sure to run `adk web` in the `project\_root_folder`.

=== "Java"

     Set up your project structure and create required files.
      
        ```console
          project_root_folder
          |-- my_agent
          |   |-- agent.java
          |   `-- pom.xml
        ```
        
      When running the agent, make sure to run the commands in the `project\_root_folder`.

#### 5. 設定角色與權限

=== "Python"

    To get the permissions that you need to set up **ApplicationIntegrationToolset**, you must have the following IAM roles on the project (common to both Integration Connectors and Application Integration Workflows):
    
      - `roles/integrations.integrationEditor`
      - `roles/connectors.invoker`
      - `roles/secretmanager.secretAccessor`
    
    **Note:** For Agent Engine (AE), don't use `roles/integrations.integrationInvoker`, as it can result in 403 errors. Use `roles/integrations.integrationEditor` instead.

=== "Java"

    To get the permissions that you need to set up **ApplicationIntegrationToolset**, you must have the following IAM roles on the project (common to both Integration Connectors and Application Integration Workflows):
    
      - `roles/integrations.integrationEditor`
      - `roles/connectors.invoker`
      - `roles/secretmanager.secretAccessor`

    **Note:** For Agent Engine (AE), don't use `roles/integrations.integrationInvoker`, as it can result in 403 errors. Use `roles/integrations.integrationEditor` instead.
    

### 使用 Integration Connectors

使用 [Integration Connectors](https://cloud.google.com/integration-connectors/docs/overview) 將您的 agent 連接到企業應用程式。

#### 開始之前

**注意：** 當您在特定區域佈建 Application Integration 時，*ExecuteConnection* integration 通常會自動建立。如果在 [integrations 清單](https://console.cloud.google.com/integrations/list) 中找不到 *ExecuteConnection*，您必須按照以下步驟手動建立：

1. 若要使用 Integration Connectors 中的 connector，請點擊 **QUICK SETUP**，並在與您的 connection 相同區域 [佈建](https://console.cloud.google.com/integrations) Application Integration。

   ![Google Cloud Tools](../assets/application-integration-overview.png)
   
   

2. 前往範本庫中的 [Connection Tool](https://console.cloud.google.com/integrations/templates/connection-tool/locations/us-central1) 範本，然後點擊 **USE TEMPLATE**。

    ![Google Cloud Tools](../assets/use-connection-tool-template.png)

3. 輸入 Integration Name 為 *ExecuteConnection*（必須完全使用此名稱）。然後，選擇與您的 connection 相同的區域，並點擊 **CREATE**。

4. 點擊 **PUBLISH**，在 <i>Application Integration</i> 編輯器中發佈此 integration。

    ![Google Cloud Tools](../assets/publish-integration.png)
   
   
#### 建立 Application Integration Toolset

若要為 Integration Connectors 建立 Application Integration Toolset，請依照以下步驟操作：

1. 在 `tools.py` 檔案中使用 `ApplicationIntegrationToolset` 建立一個 tool：

    ```py
    from google.adk.tools.application_integration_tool.application_integration_toolset import ApplicationIntegrationToolset

    connector_tool = ApplicationIntegrationToolset(
        project="test-project", # TODO: replace with GCP project of the connection
        location="us-central1", #TODO: replace with location of the connection
        connection="test-connection", #TODO: replace with connection name
        entity_operations={"Entity_One": ["LIST","CREATE"], "Entity_Two": []},#empty list for actions means all operations on the entity are supported.
        actions=["action1"], #TODO: replace with actions
        service_account_json='{...}', # optional. Stringified json for service account key
        tool_name_prefix="tool_prefix2",
        tool_instructions="..."
    )
    ```

    **注意：**

    * 你可以提供一個服務帳戶（Service Account）來取代預設憑證，方法是產生一組 [Service Account Key](https://cloud.google.com/iam/docs/keys-create-delete#creating)，並賦予該服務帳戶正確的 [Application Integration 和 Integration Connector IAM 角色](#prerequisites)。
    * 若要查詢某個連線所支援的實體（entity）及動作（action）清單，請使用 Connectors API：[listActions](https://cloud.google.com/integration-connectors/docs/reference/rest/v1/projects.locations.connections.connectionSchemaMetadata/listActions) 或 [listEntityTypes](https://cloud.google.com/integration-connectors/docs/reference/rest/v1/projects.locations.connections.connectionSchemaMetadata/listEntityTypes)。


    `ApplicationIntegrationToolset` 支援 `auth_scheme` 和 `auth_credential`，用於 Integration Connectors 的**動態 OAuth2 驗證**。若要使用此功能，請在 `tools.py` 檔案中建立類似如下的工具：

    ```py
    from google.adk.tools.application_integration_tool.application_integration_toolset import ApplicationIntegrationToolset
    from google.adk.tools.openapi_tool.auth.auth_helpers import dict_to_auth_scheme
    from google.adk.auth import AuthCredential
    from google.adk.auth import AuthCredentialTypes
    from google.adk.auth import OAuth2Auth

    oauth2_data_google_cloud = {
      "type": "oauth2",
      "flows": {
          "authorizationCode": {
              "authorizationUrl": "https://accounts.google.com/o/oauth2/auth",
              "tokenUrl": "https://oauth2.googleapis.com/token",
              "scopes": {
                  "https://www.googleapis.com/auth/cloud-platform": (
                      "View and manage your data across Google Cloud Platform"
                      " services"
                  ),
                  "https://www.googleapis.com/auth/calendar.readonly": "View your calendars"
              },
          }
      },
    }

    oauth_scheme = dict_to_auth_scheme(oauth2_data_google_cloud)

    auth_credential = AuthCredential(
      auth_type=AuthCredentialTypes.OAUTH2,
      oauth2=OAuth2Auth(
          client_id="...", #TODO: replace with client_id
          client_secret="...", #TODO: replace with client_secret
      ),
    )

    connector_tool = ApplicationIntegrationToolset(
        project="test-project", # TODO: replace with GCP project of the connection
        location="us-central1", #TODO: replace with location of the connection
        connection="test-connection", #TODO: replace with connection name
        entity_operations={"Entity_One": ["LIST","CREATE"], "Entity_Two": []},#empty list for actions means all operations on the entity are supported.
        actions=["GET_calendars/%7BcalendarId%7D/events"], #TODO: replace with actions. this one is for list events
        service_account_json='{...}', # optional. Stringified json for service account key
        tool_name_prefix="tool_prefix2",
        tool_instructions="...",
        auth_scheme=oauth_scheme,
        auth_credential=auth_credential
    )
    ```


2. 更新 `agent.py` 檔案並將工具新增到您的 agent：

    ```py
    from google.adk.agents.llm_agent import LlmAgent
    from .tools import connector_tool

    root_agent = LlmAgent(
        model='gemini-2.0-flash',
        name='connector_agent',
        instruction="Help user, leverage the tools you have access to",
        tools=[connector_tool],
    )
    ```

3. 設定 `__init__.py` 以公開您的 agent：

    ```py
    from . import agent
    ```

4. 啟動 Google Agent Development Kit (ADK) Web UI 並使用您的 agent：

    ```shell
    # make sure to run `adk web` from your project_root_folder
    adk web
    ```

完成上述步驟後，請前往 [http://localhost:8000](http://localhost:8000)，並選擇
   `my\_agent` agent（這與 agent 資料夾名稱相同）。


### 使用 Application Integration 工作流程

可將現有的
[Application Integration](https://cloud.google.com/application-integration/docs/overview)
工作流程作為您的 agent 工具，或建立新的工作流程。


#### 1. 建立工具

=== "Python"

    To create a tool with `ApplicationIntegrationToolset` in the `tools.py` file, use the following code:
    
      ```py
          integration_tool = ApplicationIntegrationToolset(
              project="test-project", # TODO: replace with GCP project of the connection
              location="us-central1", #TODO: replace with location of the connection
              integration="test-integration", #TODO: replace with integration name
              triggers=["api_trigger/test_trigger"],#TODO: replace with trigger id(s). Empty list would mean all api triggers in the integration to be considered.
              service_account_json='{...}', #optional. Stringified json for service account key
              tool_name_prefix="tool_prefix1",
              tool_instructions="..."
          )
      ```
      
      **Note:** You can provide a service account to be used instead of using default credentials. To do this, generate a [Service Account Key](https://cloud.google.com/iam/docs/keys-create-delete#creating) and provide the correct 
         [Application Integration and Integration Connector IAM roles](#prerequisites) to the service account. For more details about the IAM roles, refer to the [Prerequisites](#prerequisites) section.

=== "Java"

    To create a tool with `ApplicationIntegrationToolset` in the `tools.java` file, use the following code:
    
      ```java    
          import com.google.adk.tools.applicationintegrationtoolset.ApplicationIntegrationToolset;
          import com.google.common.collect.ImmutableList;
          import com.google.common.collect.ImmutableMap;
      
          public class Tools {
              private static ApplicationIntegrationToolset integrationTool;
              private static ApplicationIntegrationToolset connectionsTool;
      
              static {
                  integrationTool = new ApplicationIntegrationToolset(
                          "test-project",
                          "us-central1",
                          "test-integration",
                          ImmutableList.of("api_trigger/test-api"),
                          null,
                          null,
                          null,
                          "{...}",
                          "tool_prefix1",
                          "...");
      
                  connectionsTool = new ApplicationIntegrationToolset(
                          "test-project",
                          "us-central1",
                          null,
                          null,
                          "test-connection",
                          ImmutableMap.of("Issue", ImmutableList.of("GET")),
                          ImmutableList.of("ExecuteCustomQuery"),
                          "{...}",
                          "tool_prefix",
                          "...");
              }
          }
      ```
    
      **Note:** You can provide a service account to be used instead of using default credentials. To do this, generate a [Service Account Key](https://cloud.google.com/iam/docs/keys-create-delete#creating) and provide the correct [Application Integration and Integration Connector IAM roles](#prerequisites) to the service account. For more details about the IAM roles, refer to the [Prerequisites](#prerequisites) section.

#### 2. 將此工具加入至您的 agent

=== "Python"

    To update the `agent.py` file and add the tool to your agent, use the following code:
    
      ```py
          from google.adk.agents.llm_agent import LlmAgent
          from .tools import integration_tool, connector_tool
      
          root_agent = LlmAgent(
              model='gemini-2.0-flash',
              name='integration_agent',
              instruction="Help user, leverage the tools you have access to",
              tools=[integration_tool],
          )
      ```

=== "Java"

    To update the `agent.java` file and add the tool to your agent, use the following code:

    ```java
          import com.google.adk.agent.LlmAgent;
          import com.google.adk.tools.BaseTool;
          import com.google.common.collect.ImmutableList;
        
            public class MyAgent {
                public static void main(String[] args) {
                    // Assuming Tools class is defined as in the previous step
                    ImmutableList<BaseTool> tools = ImmutableList.<BaseTool>builder()
                            .add(Tools.integrationTool)
                            .add(Tools.connectionsTool)
                            .build();
        
                    // Finally, create your agent with the tools generated automatically.
                    LlmAgent rootAgent = LlmAgent.builder()
                            .name("science-teacher")
                            .description("Science teacher agent")
                            .model("gemini-2.0-flash")
                            .instruction(
                                    "Help user, leverage the tools you have access to."
                            )
                            .tools(tools)
                            .build();
        
                    // You can now use rootAgent to interact with the LLM
                    // For example, you can start a conversation with the agent.
                }
            }
      ```
        
    **Note:** To find the list of supported entities and actions for a
        connection, use these Connector APIs: `listActions`, `listEntityTypes`.    
      
#### 3. 將你的 agent 對外公開

=== "Python"

    To configure `__init__.py` to expose your agent, use the following code:
    
      ```py
          from . import agent
      ```

#### 4. 使用您的 agent

=== "Python"

    To start the Google ADK Web UI and use your agent, use the following commands:
    
      ```shell
          # make sure to run `adk web` from your project_root_folder
          adk web
      ```
    After completing the above steps, go to [http://localhost:8000](http://localhost:8000), and choose the `my_agent` agent (which is the same as the agent folder name).
    
=== "Java"

    To start the Google ADK Web UI and use your agent, use the following commands:
    
      ```bash
          mvn install
      
          mvn exec:java \
              -Dexec.mainClass="com.google.adk.web.AdkWebServer" \
              -Dexec.args="--adk.agents.source-dir=src/main/java" \
              -Dexec.classpathScope="compile"
      ```
    
    After completing the above steps, go to [http://localhost:8000](http://localhost:8000), and choose the `my_agent` agent (which is the same as the agent folder name).
  
---

## 資料庫的 Toolbox 工具

[MCP Toolbox for Databases](https://github.com/googleapis/genai-toolbox) 是一個開源的 MCP 伺服器，專為資料庫設計。它以企業級與生產環境品質為目標，讓你能夠更輕鬆、更快速且更安全地開發工具，因為它處理了連線池（connection pooling）、驗證（authentication）等複雜性問題。

Google 的 Agent Development Kit (ADK) 已內建對 Toolbox 的支援。若需瞭解
[快速開始](https://googleapis.github.io/genai-toolbox/getting-started) 或
[設定](https://googleapis.github.io/genai-toolbox/getting-started/configure/)
Toolbox，請參閱
[相關文件](https://googleapis.github.io/genai-toolbox/getting-started/introduction/)。

![GenAI Toolbox](../assets/mcp_db_toolbox.png)

### 設定與部署

Toolbox 是一個你自行部署與管理的開源伺服器。更多部署與設定的說明，請參考官方 Toolbox 文件：

* [安裝伺服器](https://googleapis.github.io/genai-toolbox/getting-started/introduction/#installing-the-server)
* [設定 Toolbox](https://googleapis.github.io/genai-toolbox/getting-started/configure/)

### 安裝用戶端 SDK

Agent Development Kit (ADK) 依賴 `toolbox-core` Python 套件來使用 Toolbox。請在開始之前安裝此套件：

```shell
pip install toolbox-core
```

### 載入 Toolbox 工具

當你的 Toolbox 伺服器設定完成並且已經啟動後，你可以使用 Agent Development Kit (ADK) 從你的伺服器載入工具：

```python
from google.adk.agents import Agent
from toolbox_core import ToolboxSyncClient

toolbox = ToolboxSyncClient("https://127.0.0.1:5000")

# Load a specific set of tools
tools = toolbox.load_toolset('my-toolset-name'),
# Load single tool
tools = toolbox.load_tool('my-tool-name'),

root_agent = Agent(
    ...,
    tools=tools # Provide the list of tools to the Agent

)
```

### 進階 Toolbox 功能

Toolbox 提供多種功能，協助開發針對資料庫的生成式 AI 工具。  
如需更多資訊，請參閱以下功能說明：

* [Authenticated Parameters](https://googleapis.github.io/genai-toolbox/resources/tools/#authenticated-parameters)：自動將工具輸入綁定至 OIDC token 的值，讓執行敏感查詢時更容易，同時避免資料外洩的風險
* [Authorized Invocations:](https://googleapis.github.io/genai-toolbox/resources/tools/#authorized-invocations) 根據使用者的 Auth token 限制工具的存取權限
* [OpenTelemetry](https://googleapis.github.io/genai-toolbox/how-to/export_telemetry/)：透過 OpenTelemetry 從 Toolbox 取得指標與追蹤資訊
