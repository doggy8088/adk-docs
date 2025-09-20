# 內建工具

這些內建工具（built-in tools）提供現成可用的功能，例如 Google Search 或程式碼執行器（code executors），讓 agent 擁有常見的能力。例如，一個需要從網路擷取資訊的 agent，可以直接使用 **google\_search** 工具，無需額外設定。

## 使用方式

1. **匯入：** 從 tools 模組匯入所需的工具。在 Python 中為 `agents.tools`，在 Java 中為 `com.google.adk.tools`。
2. **設定：** 初始化該工具，並提供必要的參數（如有）。
3. **註冊：** 將初始化後的工具加入你的 agent 的 **tools** 清單中。

將工具加入 agent 後，agent 可以根據 **user prompt** 和其 **instructions** 決定是否使用該工具。當 agent 呼叫工具時，框架會自動處理工具的執行。重要提醒：請參閱本頁的 ***限制*** 章節。

## 可用的內建工具

注意：目前 Java 僅支援 Google Search 與程式碼執行工具。

### Google Search

`google_search` 工具允許 agent 使用 Google Search 進行網頁搜尋。`google_search` 工具僅相容於 Gemini 2 模型。欲瞭解此工具的更多細節，請參閱 [Understanding Google Search grounding](../grounding/google_search_grounding.md)。

!!! warning "Additional requirements when using the `google_search` tool"
    當你在使用 Google Search 的知識接地 (grounding) 功能，並在回應中收到 Search 建議時，你必須在正式環境及你的應用程式中顯示這些 Search 建議。  
如需有關 Google Search 知識接地 (grounding) 的更多資訊，請參閱 [Google AI Studio](https://ai.google.dev/gemini-api/docs/grounding/search-suggestions) 或 [Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-search-suggestions) 的 Grounding with Google Search 文件說明。Gemini 回應中會以 `renderedContent` 形式回傳 UI 程式碼（HTML），你需要根據政策在你的應用程式中顯示該 HTML。

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/built-in-tools/google_search.py"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/GoogleSearchAgentApp.java:full_code"
    ```

### 程式碼執行

`built_in_code_execution` 工具讓 agent 能夠執行程式碼，特別是在使用 Gemini 2 模型時。這使模型能夠執行像是計算、資料操作或執行小型腳本等任務。

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/built-in-tools/code_execution.py"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/CodeExecutionAgentApp.java:full_code"
    ```

### GKE 程式碼執行器

GKE 程式碼執行器（`GkeCodeExecutor`）提供一種安全且可擴展的方法，利用 GKE（Google Kubernetes Engine）Sandbox 環境來執行大型語言模型 (LLM) 產生的程式碼，該環境透過 gVisor 來實現工作負載隔離。

每次程式碼執行請求時，系統會動態建立一個短暫且沙箱化的 Kubernetes Job，並採用強化的 Pod 設定。這是建議在 GKE 生產環境中使用的執行器，特別適用於安全性與隔離性要求高的場景。

#### 系統需求

若要成功使用 GKE 程式碼執行器工具部署您的 Agent Development Kit (ADK) 專案，需符合以下需求：

- 擁有啟用 **gVisor 的節點集區（node pool）** 的 GKE 叢集。
- agent 的服務帳戶（Service Account）需具備特定 **RBAC 權限**，以允許其：
    - 為每個執行請求建立、監控及刪除 **Jobs**。
    - 管理 **ConfigMaps**，將程式碼注入至 Job 的 pod 中。
    - 列出 **Pods** 並讀取其 **logs**，以取得執行結果
- 安裝包含 GKE extras 的用戶端程式庫：`pip install google-adk[gke]`

如需完整且可直接使用的設定範例，請參閱
[deployment_rbac.yaml](https://github.com/google/adk-python/blob/main/contributing/samples/gke_agent_sandbox/deployment_rbac.yaml)
範例。更多有關將 ADK 工作流程部署至 GKE 的資訊，請參閱
[Deploy to Google Kubernetes Engine (GKE)](/adk-docs/deploy/gke/)。

=== "Python"

    ```py
    from google.adk.agents import LlmAgent
    from google.adk.code_executors import GkeCodeExecutor

    # Initialize the executor, targeting the namespace where its ServiceAccount
    # has the required RBAC permissions.
    gke_executor = GkeCodeExecutor(
        namespace="agent-sandbox",
        timeout_seconds=600,
    )

    # The agent will now use this executor for any code it generates.
    gke_agent = LlmAgent(
        name="gke_coding_agent",
        model="gemini-2.0-flash",
        instruction="You are a helpful AI agent that writes and executes Python code.",
        code_executor=gke_executor,
    )
    ```

### Vertex AI RAG Engine

`vertex_ai_rag_retrieval` 工具允許 agent 使用 Vertex AI RAG Engine 執行私有資料檢索。

當你使用 Vertex AI RAG Engine 進行知識接地 (grounding) 時，需要事先準備好 RAG corpus。
請參考 [RAG ADK agent sample](https://github.com/google/adk-samples/blob/main/python/agents/RAG/rag/shared_libraries/prepare_corpus_and_data.py) 或 [Vertex AI RAG Engine page](https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-quickstart) 來進行相關設定。

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/built-in-tools/vertexai_rag_engine.py"
    ```

### Vertex AI Search

`vertex_ai_search_tool` 使用 Google Cloud Vertex AI Search，讓 agent 能夠在您私有且已設定的資料儲存區（例如：內部文件、公司政策、知識庫）中進行搜尋。此內建工具在設定時需要您提供特定的資料儲存區 ID。如需此工具的詳細資訊，請參閱 [Understanding Vertex AI Search grounding](../grounding/vertex_ai_search_grounding.md)。


```py
--8<-- "examples/python/snippets/tools/built-in-tools/vertexai_search.py"
```


### BigQuery

這是一組旨在提供與 BigQuery 整合的工具，具體包括：

* **`list_dataset_ids`**：擷取指定 Google Cloud 專案中現有的 BigQuery 資料集 ID。
* **`get_dataset_info`**：擷取 BigQuery 資料集的中繼資料。
* **`list_table_ids`**：擷取指定 BigQuery 資料集中的資料表 ID。
* **`get_table_info`**：擷取 BigQuery 資料表的中繼資料。
* **`execute_sql`**：在 BigQuery 中執行 SQL 查詢並取得結果。
* **`ask_data_insights`**：使用自然語言回答有關 BigQuery 資料表中資料的問題。

這些工具被打包於工具組 `BigQueryToolset` 中。



```py
--8<-- "examples/python/snippets/tools/built-in-tools/bigquery.py"
```

## 結合內建工具與其他工具使用

以下範例程式碼展示如何透過多個 agent，結合多個內建工具，或將內建工具與其他工具一起使用：

=== "Python"

    ```py
    from google.adk.tools.agent_tool import AgentTool
    from google.adk.agents import Agent
    from google.adk.tools import google_search
    from google.adk.code_executors import BuiltInCodeExecutor
    

    search_agent = Agent(
        model='gemini-2.0-flash',
        name='SearchAgent',
        instruction="""
        You're a specialist in Google Search
        """,
        tools=[google_search],
    )
    coding_agent = Agent(
        model='gemini-2.0-flash',
        name='CodeAgent',
        instruction="""
        You're a specialist in Code Execution
        """,
        code_executor=BuiltInCodeExecutor(),
    )
    root_agent = Agent(
        name="RootAgent",
        model="gemini-2.0-flash",
        description="Root Agent",
        tools=[AgentTool(agent=search_agent), AgentTool(agent=coding_agent)],
    )
    ```

=== "Java"

    ```java
    import com.google.adk.agents.BaseAgent;
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.tools.AgentTool;
    import com.google.adk.tools.BuiltInCodeExecutionTool;
    import com.google.adk.tools.GoogleSearchTool;
    import com.google.common.collect.ImmutableList;
    
    public class NestedAgentApp {
    
      private static final String MODEL_ID = "gemini-2.0-flash";
    
      public static void main(String[] args) {

        // Define the SearchAgent
        LlmAgent searchAgent =
            LlmAgent.builder()
                .model(MODEL_ID)
                .name("SearchAgent")
                .instruction("You're a specialist in Google Search")
                .tools(new GoogleSearchTool()) // Instantiate GoogleSearchTool
                .build();
    

        // Define the CodingAgent
        LlmAgent codingAgent =
            LlmAgent.builder()
                .model(MODEL_ID)
                .name("CodeAgent")
                .instruction("You're a specialist in Code Execution")
                .tools(new BuiltInCodeExecutionTool()) // Instantiate BuiltInCodeExecutionTool
                .build();

        // Define the RootAgent, which uses AgentTool.create() to wrap SearchAgent and CodingAgent
        BaseAgent rootAgent =
            LlmAgent.builder()
                .name("RootAgent")
                .model(MODEL_ID)
                .description("Root Agent")
                .tools(
                    AgentTool.create(searchAgent), // Use create method
                    AgentTool.create(codingAgent)   // Use create method
                 )
                .build();

        // Note: This sample only demonstrates the agent definitions.
        // To run these agents, you'd need to integrate them with a Runner and SessionService,
        // similar to the previous examples.
        System.out.println("Agents defined successfully:");
        System.out.println("  Root Agent: " + rootAgent.name());
        System.out.println("  Search Agent (nested): " + searchAgent.name());
        System.out.println("  Code Agent (nested): " + codingAgent.name());
      }
    }
    ```


### 限制事項

!!! warning

    目前，對於每個 root agent 或單一 agent，只支援一個內建工具（built-in tool）。在同一個 agent 中，不能同時使用其他任何類型的工具。

例如，下列在單一 agent 中同時使用***內建工具與其他工具***的做法，目前**尚未**支援：

=== "Python"

    ```py
    root_agent = Agent(
        name="RootAgent",
        model="gemini-2.0-flash",
        description="Root Agent",
        tools=[custom_function], 
        code_executor=BuiltInCodeExecutor() # <-- not supported when used with tools
    )
    ```

=== "Java"

    ```java
     LlmAgent searchAgent =
            LlmAgent.builder()
                .model(MODEL_ID)
                .name("SearchAgent")
                .instruction("You're a specialist in Google Search")
                .tools(new GoogleSearchTool(), new YourCustomTool()) // <-- not supported
                .build();
    ```

!!! warning

    內建工具（built-in tools）無法在子 agent（sub-agent）中使用。

例如，以下在子 agent 中使用內建工具的做法，目前**尚未**支援：

=== "Python"

    ```py
    search_agent = Agent(
        model='gemini-2.0-flash',
        name='SearchAgent',
        instruction="""
        You're a specialist in Google Search
        """,
        tools=[google_search],
    )
    coding_agent = Agent(
        model='gemini-2.0-flash',
        name='CodeAgent',
        instruction="""
        You're a specialist in Code Execution
        """,
        code_executor=BuiltInCodeExecutor(),
    )
    root_agent = Agent(
        name="RootAgent",
        model="gemini-2.0-flash",
        description="Root Agent",
        sub_agents=[
            search_agent,
            coding_agent
        ],
    )
    ```

=== "Java"

    ```java
    LlmAgent searchAgent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("SearchAgent")
            .instruction("You're a specialist in Google Search")
            .tools(new GoogleSearchTool())
            .build();

    LlmAgent codingAgent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("CodeAgent")
            .instruction("You're a specialist in Code Execution")
            .tools(new BuiltInCodeExecutionTool())
            .build();
    

    LlmAgent rootAgent =
        LlmAgent.builder()
            .name("RootAgent")
            .model("gemini-2.0-flash")
            .description("Root Agent")
            .subAgents(searchAgent, codingAgent) // Not supported, as the sub agents use built in tools.
            .build();
    ```
