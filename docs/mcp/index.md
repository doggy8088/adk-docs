# Model Context Protocol (MCP)

## 什麼是 Model Context Protocol (MCP)？

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction)
是一個開放標準，旨在標準化大型語言模型（Large Language Model, LLM）如 Gemini 和 Claude，與外部應用程式、資料來源及工具之間的溝通方式。你可以將它想像成一種通用的連接機制，簡化 LLM 取得情境資訊、執行動作，以及與各種系統互動的流程。

## MCP 如何運作？

MCP 採用 client-server 架構，定義了資料（資源）、互動式範本（prompts）以及可執行函式（tools）如何由 MCP server 提供，並由 MCP client（可能是 LLM host 應用程式或 AI agent）消費。

## ADK 中的 MCP 工具

Agent Development Kit (ADK)（ADK）協助你在 agent 中使用與消費 MCP 工具，無論你是要建構一個呼叫 MCP 服務的工具，還是要將 MCP server 對外公開，讓其他開發者或 agent 與你的工具互動。

請參考 [MCP Tools documentation](../tools/mcp-tools.md)，其中包含協助你將 ADK 與 MCP server 結合使用的範例程式碼與設計模式，包括：

- **在 ADK 中使用現有的 MCP server**：ADK agent 可以作為 MCP client，使用外部 MCP server 提供的工具。
- **透過 MCP server 對外公開 ADK 工具**：說明如何建構一個 MCP server，將 ADK 工具包裝後，讓任何 MCP client 都能存取。

## 資料庫專用的 MCP Toolbox

[MCP Toolbox for Databases](https://github.com/googleapis/genai-toolbox)
是一個開源的 MCP server，能夠安全地將你的後端資料來源，以一組預先建置、可直接用於生產環境的工具，提供給生成式 AI agent 使用。它作為一個通用抽象層，讓你的 ADK agent 能夠安全地查詢、分析並從各種資料庫中擷取資訊，並且內建多種支援。

MCP Toolbox server 內建完整的連接器函式庫，確保 agent 能夠安全地與你的複雜資料環境互動。

### 支援的資料來源

MCP Toolbox 針對下列資料庫與資料平台，提供現成的工具集：

#### Google Cloud

* BigQuery（包含 SQL 執行、結構探索、機器學習預測等工具）
* AlloyDB（相容 PostgreSQL，支援標準查詢與自然語言查詢工具）
* Spanner（支援 GoogleSQL 與 PostgreSQL 方言）
* Cloud SQL（專為 Cloud SQL for PostgreSQL、Cloud SQL for MySQL、Cloud SQL for SQL Server 提供支援）
* Firestore
* Bigtable
* Dataplex（用於資料探索與中繼資料搜尋）

#### 關聯式與 SQL 資料庫

* PostgreSQL（通用）
* MySQL（通用）
* Microsoft SQL Server（通用）
* ClickHouse
* TiDB
* OceanBase
* Firebird
* SQLite

#### NoSQL 與 Key-Value 儲存

* MongoDB
* Couchbase
* Redis
* Valkey

#### 圖形資料庫

* Neo4j（支援 Cypher 查詢與結構檢查工具）
* Dgraph

#### 資料平台與聯邦查詢

* Looker（可透過 Looker API 執行 Looks、查詢與建立儀表板）
* Trino（可跨多個來源執行聯邦查詢）

### 文件

請參考
[MCP Toolbox for Databases](../tools/google-cloud-tools.md#toolbox-tools-for-databases)
的文件，瞭解如何將 ADK 與 MCP Toolbox for Databases 結合使用。若要快速開始，可參考部落格文章 [Tutorial : MCP Toolbox for Databases - Exposing Big Query Datasets](https://medium.com/google-cloud/tutorial-mcp-toolbox-for-databases-exposing-big-query-datasets-9321f0064f4e) 以及 Codelab [MCP Toolbox for Databases:Making BigQuery datasets available to MCP clients](https://codelabs.developers.google.com/mcp-toolbox-bigquery-dataset?hl=en#0)。

![GenAI Toolbox](../assets/mcp_db_toolbox.png)

## ADK Agent 與 FastMCP server

[FastMCP](https://github.com/jlowin/fastmcp) 處理所有複雜的 MCP 協定細節與 server 管理，讓你能專注於打造優秀的工具。它設計為高階且貼近 Python 風格，在多數情境下，你只需為函式加上裝飾器即可。

請參考 [MCP Tools documentation](../tools/mcp-tools.md)，瞭解如何將 ADK 與部署於 Cloud Run 的 FastMCP server 結合使用。

## Google Cloud Genmedia 專用的 MCP Server

[MCP Tools for Genmedia Services](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
是一組開源的 MCP server，讓你能將 Google Cloud 生成式媒體服務（如 Imagen、Veo、Chirp 3 HD 聲音與 Lyria）整合進你的 AI 應用程式。

Agent Development Kit (ADK)（ADK）與 [Genkit](https://genkit.dev/) 內建支援這些 MCP 工具，讓你的 AI agent 能有效協調生成式媒體工作流程。實作指引請參考 [ADK example agent](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia/sample-agents/adk) 及 [Genkit example](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia/sample-agents/genkit)。
