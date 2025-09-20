# 理解 Vertex AI Search Grounding

[Vertex AI Search Grounding 工具](../tools/built-in-tools.md#vertex-ai-search) 是 Agent Development Kit (ADK)（ADK）中的一項強大功能，可讓 AI 代理（agent）存取您企業內部文件與資料庫中的資訊。透過將您的代理（agent）連接到已建立索引的企業內容，您可以為使用者提供根據組織知識庫所產生的答案。

這項功能特別適用於需要從內部文件、政策、研究論文或任何已在 [Vertex AI Search](https://cloud.google.com/enterprise-search) 資料庫建立索引的專有內容中取得資訊的企業專屬查詢。當您的代理（agent）判斷需要來自知識庫的資訊時，會自動搜尋已建立索引的文件，並將搜尋結果納入回應中，並正確標註出處。

## 您將學到什麼

在本指南中，您將了解：

- **快速開始**：如何從零開始建立並執行支援 Vertex AI Search 的代理（agent）
- **Grounding 架構**：企業文件 grounding 的資料流程與技術實作過程
- **回應結構**：如何解讀 grounding 回應及其中繼資料
- **最佳實踐**：向使用者顯示引用與文件參考的指引

## Vertex AI Search Grounding 快速開始

本快速開始將引導您建立一個具備 Vertex AI Search grounding 功能的 ADK 代理（agent）。本快速開始假設您已具備本機 IDE（如 VS Code 或 PyCharm 等）、Python 3.9 以上版本，以及終端機存取權限。

### 1. 準備 Vertex AI Search { #prepare-vertex-ai-search }

如果您已經擁有 Vertex AI Search Data Store 及其 Data Store ID，可以跳過本節。否則，請依照 [Get started with custom search](https://cloud.google.com/generative-ai-app-builder/docs/try-enterprise-search#unstructured-data) 的說明操作，直到 [Create a data store](https://cloud.google.com/generative-ai-app-builder/docs/try-enterprise-search#create_a_data_store) 結束，並選擇 `Unstructured data` 分頁。依照這份說明，您將以 [Alphabet investor site](https://abc.xyz/) 上的財報 PDF 為例建立一個範例 Data Store。

完成 Create a data store 步驟後，請開啟 [Data Stores](https://console.cloud.google.com/gen-app-builder/data-stores/)，選取您建立的 data store，並找到 `Data store ID`：

![Vertex AI Search Data Store](../assets/vertex_ai_search_grd_data_store.png)

請記下這個 `Data store ID`，稍後會用到。

### 2. 設定環境並安裝 ADK { #set-up-environment-install-adk }

建立並啟用虛擬環境：

```bash
# Create
python -m venv .venv

# Activate (each new terminal)
# macOS/Linux: source .venv/bin/activate
# Windows CMD: .venv\Scripts\activate.bat
# Windows PowerShell: .venv\Scripts\Activate.ps1
```

安裝 Agent Development Kit (ADK)：

```bash
pip install google-adk==1.5.0
```

### 3. 建立 Agent 專案 { #create-agent-project }

在專案目錄下，執行以下指令：

=== "OS X &amp; Linux"
    ```bash
    # Step 1: Create a new directory for your agent
    mkdir vertex_search_agent

    # Step 2: Create __init__.py for the agent
    echo "from . import agent" > vertex_search_agent/__init__.py

    # Step 3: Create an agent.py (the agent definition) and .env (authentication config)
    touch vertex_search_agent/agent.py .env
    ```

=== "Windows"
    ```shell
    # Step 1: Create a new directory for your agent
    mkdir vertex_search_agent

    # Step 2: Create __init__.py for the agent
    echo "from . import agent" > vertex_search_agent/__init__.py

    # Step 3: Create an agent.py (the agent definition) and .env (authentication config)
    type nul > vertex_search_agent\agent.py 
    type nul > google_search_agent\.env
    ```

#### 編輯 `agent.py`

請將以下程式碼複製並貼到 `agent.py`，然後將 `Configuration` 部分的 `YOUR_PROJECT_ID` 和 `YOUR_DATASTORE_ID` 分別替換為你的專案 ID 及 Data Store ID：

```python title="vertex_search_agent/agent.py"
from google.adk.agents import Agent
from google.adk.tools import VertexAiSearchTool

# Configuration
DATASTORE_ID = "projects/YOUR_PROJECT_ID/locations/global/collections/default_collection/dataStores/YOUR_DATASTORE_ID"

root_agent = Agent(
    name="vertex_search_agent",
    model="gemini-2.5-flash",
    instruction="Answer questions using Vertex AI Search to find information from internal documents. Always cite sources when available.",
    description="Enterprise document search assistant with Vertex AI Search capabilities",
    tools=[VertexAiSearchTool(data_store_id=DATASTORE_ID)]
)
```

現在你應該會有以下的目錄結構：

```console
my_project/
    vertex_search_agent/
        __init__.py
        agent.py
    .env
```

### 4. 驗證設定 { #authentication-setup }

**注意：Vertex AI Search 需要 Google Cloud Platform（Vertex AI）驗證。本工具不支援 Google AI Studio。**

  * 設定 [gcloud 命令列介面 (CLI)](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local)
  * 在終端機執行 `gcloud auth login` 以驗證 Google Cloud。
  * 開啟 **`.env`** 檔案，將下方程式碼複製貼上，並更新專案 ID 與位置。

    ```env title=".env"
    GOOGLE_GENAI_USE_VERTEXAI=TRUE
    GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
    GOOGLE_CLOUD_LOCATION=LOCATION
    ```


### 5. 執行你的 agent { #run-your-agent }

你可以透過多種方式與你的 agent 互動：

=== "Dev UI (adk web)"
    執行以下指令以啟動 **dev UI**。

    ```shell
    adk web
    ```
    
請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。    
    !!!info "Note for Windows users"

        When hitting the `_make_subprocess_transport NotImplementedError`, consider using `adk web --no-reload` instead.


    **Step 1:** Open the URL provided (usually `http://localhost:8000` or
    `http://127.0.0.1:8000`) directly in your browser.

    **Step 2.** In the top-left corner of the UI, you can select your agent in
    the dropdown. Select "vertex_search_agent".

    !!!note "Troubleshooting"

        If you do not see "vertex_search_agent" in the dropdown menu, make sure you
        are running `adk web` in the **parent folder** of your agent folder
        (i.e. the parent folder of vertex_search_agent).

    **Step 3.** Now you can chat with your agent using the textbox.

=== "終端機（adk run）"

    Run the following command, to chat with your Vertex AI Search agent.

    ```
    adk run vertex_search_agent
    ```
    To exit, use Cmd/Ctrl+C.

### 📝 範例提示詞（Prompts）供您嘗試

透過以下問題，您可以確認 agent 確實有呼叫 Vertex AI Search
來從 Alphabet 報告中取得資訊：

* Google Cloud 在 2022 年第一季的營收是多少？
* 那 YouTube 呢？

![Vertex AI Search Grounding Data Flow](../assets/vertex_ai_search_grd_adk_web.png)

您已成功使用 Agent Development Kit (ADK) 建立並與您的 Vertex AI Search agent 互動！

## Vertex AI Search 落地（grounding）運作原理

使用 Vertex AI Search 進行 grounding，是將您的 agent 連結到組織內已建立索引的文件與資料，讓 agent 能根據企業內部的專屬內容產生精確回應的過程。當使用者的提示詞需要從您的內部知識庫獲取資訊時，agent 背後的 大型語言模型 (LLM) 會智能地決定是否呼叫 `VertexAiSearchTool`，以便從已建立索引的文件中尋找相關事實。

### **資料流程圖**

下圖說明了使用者查詢如何逐步產生一個有落地（grounded）的回應。

![Vertex AI Search Grounding Data Flow](../assets/vertex_ai_search_grd_dataflow.png)

### **詳細說明**

grounding agent 會依據圖中的資料流程，擷取、處理並將企業資訊整合到最終呈現給使用者的答案中。

1. **使用者查詢**：終端使用者透過 agent 提出有關內部文件或企業資料的問題。

2. **ADK 調度**：Agent Development Kit (ADK) 負責協調 agent 的行為，並將使用者訊息傳遞給 agent 核心。

3. **LLM 分析與工具呼叫**：agent 的 大型語言模型 (LLM)（例如 Gemini 模型）會分析提示詞。如果判斷需要從已建立索引的文件中取得資訊，則會透過呼叫 VertexAiSearchTool 啟動 grounding 機制。這特別適合回答有關公司政策、技術文件或專有研究的查詢。

4. **Vertex AI Search 服務互動**：VertexAiSearchTool 會與您設定的 Vertex AI Search 資料庫互動，該資料庫包含您已建立索引的企業文件。服務會針對您的專屬內容組成並執行搜尋查詢。

5. **文件擷取與排序**：Vertex AI Search 會根據語意相似度與相關性評分，從資料庫中擷取並排序最相關的文件片段。

6. **內容注入**：搜尋服務會在產生最終回應前，將擷取到的文件片段整合進模型的上下文中。這個關鍵步驟讓模型能夠針對組織的事實資料進行「推理」。

7. **落地回應產生**：LLM 在取得相關企業內容後，會產生一個結合文件資訊的回應。

8. **帶來源的回應呈現**：ADK 會接收最終的落地回應，其中包含必要的來源文件參考與 groundingMetadata，並將帶有出處的回應呈現給使用者。這讓終端使用者可以根據企業來源驗證資訊。

## 理解 Vertex AI Search grounding 回應

當 agent 使用 Vertex AI Search 進行 grounding 回應時，會回傳包含最終文字答案及產生該答案所用文件的中繼資料（metadata）的詳細資訊。這些中繼資料對於驗證回應內容及提供企業來源出處非常重要。

### 落地回應範例

以下是模型針對企業文件進行落地查詢後，所回傳的 content 物件範例。

**最終答案文字：**

```
"Developing models for a medical scribe presents several significant challenges, primarily due to the complex nature of medical documentation, the sensitive data involved, and the demanding requirements of clinical workflows. Key challenges include: **Accuracy and Reliability:** Medical documentation requires extremely high levels of accuracy, as errors can lead to misdiagnoses, incorrect treatments, and legal repercussions. Ensuring that AI models can reliably capture nuanced medical language, distinguish between subjective and objective information, and accurately transcribe physician-patient interactions is a major hurdle. **Natural Language Understanding (NLU) and Speech Recognition:** Medical conversations are often rapid, involve highly specialized jargon, acronyms, and abbreviations, and can be spoken by individuals with diverse accents or speech patterns... [response continues with detailed analysis of privacy, integration, and technical challenges]"
```

**Grounding Metadata Snippet:**

這是你將會收到的 grounding metadata（基礎資料）。在 `adk web` 上，你可以在 `Response` 分頁中找到這個資訊：

```json
{
  "groundingMetadata": {
    "groundingChunks": [
      {
        "document": {
          "title": "AI in Medical Scribing: Technical Challenges",
          "uri": "projects/your-project/locations/global/dataStores/your-datastore-id/documents/doc-medical-scribe-ai-tech-challenges",
          "id": "doc-medical-scribe-ai-tech-challenges"
        }
      },
      {
        "document": {
          "title": "Regulatory and Ethical Hurdles for AI in Healthcare",
          "uri": "projects/your-project/locations/global/dataStores/your-datastore-id/documents/doc-ai-healthcare-ethics",
          "id": "doc-ai-healthcare-ethics"
        }
      }
      // ... additional documents
    ],
    "groundingSupports": [
      {
        "groundingChunkIndices": [0, 1],
        "segment": {
          "endIndex": 637,
          "startIndex": 433,
          "text": "Ensuring that AI models can reliably capture nuanced medical language..."
        }
      }
      // ... additional supports linking text segments to source documents
    ],
    "retrievalQueries": [
      "challenges in natural language processing medical domain",
      "AI medical scribe challenges",
      "difficulties in developing AI for medical scribes"
      // ... additional search queries executed
    ]
  }
}
```

### 如何解讀回應內容

metadata（中繼資料）提供了模型產生的文字與其所依據的企業文件之間的連結。以下是逐步說明：

- **groundingChunks**：這是一個模型所參考之企業文件的清單。每個 chunk（區塊）都包含文件標題、uri（文件路徑）以及 id。

- **groundingSupports**：這個清單將最終答案中的特定句子連結回`groundingChunks`。

- **segment**：這個物件用來標識最終文字答案中的特定區段，該區段由`startIndex`、`endIndex`以及`text`本身所定義。

- **groundingChunkIndices**：這個陣列包含對應於`groundingChunks`中所列來源的索引編號。例如，關於「HIPAA 合規性」的文字，是由索引 1 號（"Regulatory and Ethical Hurdles" 文件）的`groundingChunks`資訊所支持。

- **retrievalQueries**：這個陣列顯示針對您的資料儲存區所執行、用以尋找相關資訊的具體搜尋查詢。

## 如何以 Vertex AI Search 呈現 grounding 回應

與 Google Search grounding 不同，Vertex AI Search grounding 不需要特定的顯示元件。然而，顯示引用與文件參考有助於建立信任，並讓使用者能夠根據您組織的權威來源驗證資訊。

### 選用的引用顯示

由於系統會提供 grounding metadata（中繼資料），您可以依照應用需求選擇實作引用顯示：

**純文字顯示（最小化實作）：**

```python
for event in events:
    if event.is_final_response():
        print(event.content.parts[0].text)
        
        # Optional: Show source count
        if event.grounding_metadata:
            print(f"\nBased on {len(event.grounding_metadata.grounding_chunks)} documents")
```

**增強型引註顯示（可選）：** 你可以實作互動式引註，顯示每個陳述所依據的文件。grounding metadata（基礎資料）提供了將文字片段對應到來源文件所需的所有資訊。

### 實作注意事項

在實作 Vertex AI Search grounding 顯示時：

1. **文件存取權限**：確認使用者對被引用文件的存取權限
2. **簡易整合**：基礎文字輸出不需要額外的顯示邏輯
3. **可選強化功能**：僅在你的使用情境需要來源註記時，才加入引註
4. **文件連結**：如有需要，將文件 URI 轉換為可存取的內部連結
5. **搜尋查詢**：`retrievalQueries` 陣列顯示對你的資料庫執行了哪些搜尋

## 摘要

Vertex AI Search Grounding 能將 AI agent 從通用型助理轉變為企業專屬的知識系統，能夠從你組織的私有文件中提供準確且具來源註記的資訊。將此功能整合進你的 Agent Development Kit (ADK)（ADK）agent，可讓它們：

- 存取來自你已索引文件庫的專有資訊
- 提供來源註記，提升透明度與信任度
- 回答時能結合可驗證的企業事實，提供完整解答
- 在 Google Cloud 環境中維護資料隱私

grounding 流程能無縫地將使用者查詢連結到你組織的知識庫，並在維持對話流程的同時，將你私有文件中的相關脈絡豐富地帶入回應。只要正確實作，你的 agent 就能成為企業資訊探索與決策的強大工具。
