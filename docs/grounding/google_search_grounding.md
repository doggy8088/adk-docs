# 理解 Google Search 知識接地 (grounding)

[Google Search Grounding 工具](../tools/built-in-tools.md#google-search) 是 Agent Development Kit (ADK) 中一項強大的功能，能讓 AI agent 取得來自網路的即時、權威資訊。透過將你的 agent 連接到 Google Search，你可以為使用者提供來自可靠來源的最新答案。

這項功能對於需要即時資訊的查詢特別有價值，例如天氣更新、新聞事件、股價，或是任何自模型訓練資料截止日後可能已變動的事實。當你的 agent 判斷需要外部資訊時，會自動執行網路搜尋，並將搜尋結果（含正確出處）整合進回應中。

## 你將學到什麼

在本指南中，你將學習到：

- **快速開始**：如何從零開始建立並執行支援 Google Search 的 agent
- **知識接地架構**：網路知識接地的資料流程與技術原理
- **回應結構**：如何解讀知識接地回應及其中繼資料
- **最佳實踐**：向使用者顯示搜尋結果與引用來源的建議指引

### 其他資源

作為補充資源，[Gemini Fullstack Agent Development Kit (ADK) 快速開始](https://github.com/google/adk-samples/tree/main/python/agents/gemini-fullstack) 提供了[一個很好的 Google Search 知識接地實作範例](https://github.com/google/adk-samples/blob/main/python/agents/gemini-fullstack/app/agent.py)，作為全端應用的實際案例。

## Google Search 知識接地快速開始

本快速開始將帶你建立一個具備 Google Search 知識接地功能的 ADK agent。本快速開始假設你已在本機 IDE（如 VS Code 或 PyCharm 等）安裝 Python 3.9+ 並可使用終端機。

### 1. 建立環境並安裝 ADK { #set-up-environment-install-adk }

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
pip install google-adk==1.4.2
```

### 2. 建立 Agent 專案 { #create-agent-project }

在專案目錄下，執行以下指令：

=== "OS X &amp; Linux"
    ```bash
    # Step 1: Create a new directory for your agent
    mkdir google_search_agent

    # Step 2: Create __init__.py for the agent
    echo "from . import agent" > google_search_agent/__init__.py

    # Step 3: Create an agent.py (the agent definition) and .env (Gemini authentication config)
    touch google_search_agent/agent.py .env
    ```

=== "Windows（命令提示字元）"
    ```shell
    # Step 1: Create a new directory for your agent
    mkdir google_search_agent

    # Step 2: Create __init__.py for the agent
    echo "from . import agent" > google_search_agent/__init__.py

    # Step 3: Create an agent.py (the agent definition) and .env (Gemini authentication config)
    type nul > google_search_agent\agent.py 
    type nul > google_search_agent\.env
    ```



#### 編輯 `agent.py`

請將以下程式碼複製並貼到 `agent.py`：

```python title="google_search_agent/agent.py"
from google.adk.agents import Agent
from google.adk.tools import google_search

root_agent = Agent(
    name="google_search_agent",
    model="gemini-2.5-flash",
    instruction="Answer questions using Google Search when needed. Always cite sources.",
    description="Professional search assistant with Google Search capabilities",
    tools=[google_search]
)
```

現在你會看到以下的目錄結構：

```console
my_project/
    google_search_agent/
        __init__.py
        agent.py
    .env
```

### 3. 選擇平台 { #choose-a-platform }

要執行 agent，您需要選擇一個 agent 用來呼叫 Gemini 模型的平台。請從 Google AI Studio 或 Vertex AI 中擇一：

=== "Gemini - Google AI Studio"
    1. 從 [Google AI Studio](https://aistudio.google.com/apikey) 取得 API KEY。
    2. 若使用 Python，請開啟 **`.env`** 檔案並複製貼上以下程式碼。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=FALSE
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

    3. 將 `PASTE_YOUR_ACTUAL_API_KEY_HERE` 替換為你實際的 `API KEY`。

=== "Gemini - Google Cloud Vertex AI"
    1. 你需要一個已存在的
    [Google Cloud](https://cloud.google.com/?e=48754805&hl=en) 帳戶與一個專案。
        * 建立一個
          [Google Cloud 專案](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp)
        * 設定
          [gcloud 命令列介面 (Command Line Interface)](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local)
        * 從終端機執行
          `gcloud auth login`，以驗證 Google Cloud 身分。
        * [啟用 Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)。
    2. 若使用 Python，請開啟 **`.env`** 檔案，複製並貼上下列程式碼，並更新專案 ID 與 Location。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=TRUE
        GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
        GOOGLE_CLOUD_LOCATION=LOCATION
        ```

### 4. 執行你的 agent { #run-your-agent }

你可以透過多種方式與你的 agent 互動：

=== "Dev UI (adk web)"
    執行以下指令以啟動 **dev UI**。

    ```shell
    adk web
    ```
    
    !!!info "Note for Windows users"

        When hitting the `_make_subprocess_transport NotImplementedError`, consider using `adk web --no-reload` instead.


    **Step 1:** Open the URL provided (usually `http://localhost:8000` or
    `http://127.0.0.1:8000`) directly in your browser.

    **Step 2.** In the top-left corner of the UI, you can select your agent in
    the dropdown. Select "google_search_agent".

    !!!note "Troubleshooting"

        If you do not see "google_search_agent" in the dropdown menu, make sure you
        are running `adk web` in the **parent folder** of your agent folder
        (i.e. the parent folder of google_search_agent).

    **Step 3.** Now you can chat with your agent using the textbox.

=== "終端機（adk run）"

    Run the following command, to chat with your Weather agent.

    ```
    adk run google_search_agent
    ```
    To exit, use Cmd/Ctrl+C.

### 📝 範例提示語（prompts）可供嘗試

透過這些問題，你可以確認 agent 是否真的呼叫了 Google Search
來取得最新的天氣與時間資訊。

* 紐約的天氣如何？
* 紐約現在幾點？
* 巴黎的天氣如何？
* 巴黎現在幾點？

![Try the agent with adk web](../assets/google_search_grd_adk_web.png)

你已經成功使用 Agent Development Kit (ADK) 建立並與你的 Google Search agent 互動！

## Google Search 知識接地（grounding）運作方式

知識接地（grounding）是將你的 agent 連結到網路上的即時資訊，讓它能產生更準確且最新回應的過程。當使用者的提示語需要模型訓練時未涵蓋，或是與時間高度相關的資訊時，agent 底層的大型語言模型 (Large Language Model, LLM) 會智慧地決定是否呼叫 `google_search` 工具來查找相關事實。

### **資料流程圖**

下圖說明了使用者查詢如何逐步產生知識接地回應的流程。

![](../assets/google_search_grd_dataflow.png)

### **詳細說明**

知識接地 agent 會依據圖中的資料流程，擷取、處理並將外部資訊整合到最終呈現給使用者的答案中。

1. **使用者查詢**：終端使用者透過提問或下指令與你的 agent 互動。  
2. **ADK 調度**：Agent Development Kit (ADK) 負責調度 agent 的行為，並將使用者訊息傳遞給 agent 核心。  
3. **LLM 分析與工具呼叫**：agent 的大型語言模型 (LLM，例如 Gemini 模型) 會分析提示語。如果判斷需要外部且最新的資訊，會透過呼叫  
    `google_search` 工具來啟動知識接地機制。這對於回答近期新聞、天氣或模型訓練資料中未包含的事實特別理想。  
4. **知識接地服務互動**：`google_search` 工具會與內部知識接地服務互動，該服務會組合並發送一個或多個查詢到 Google Search 索引。  
5. **內容注入**：知識接地服務會擷取相關網頁與摘要，然後將這些搜尋結果整合到模型的 context  
    中，於產生最終回應前完成。這個關鍵步驟讓模型能夠基於即時、具事實性的資料進行「推理」。  
6. **知識接地回應產生**：LLM 取得最新搜尋結果後，會產生結合擷取資訊的回應內容。  
7. **帶來源的回應呈現**：ADK 會接收最終的知識接地回應，其中包含必要的來源 URL 及  
   groundingMetadata，並將其帶有出處地呈現給使用者。這讓終端使用者可以驗證資訊來源，並提升對 agent 回答的信任。

### 了解 Google Search 知識接地回應

當 agent 使用 Google Search 進行知識接地時，會回傳一組詳細資訊，除了最終的文字答案外，還包含產生該答案所用的來源。這些中繼資料（metadata）對於驗證回應內容與提供原始來源出處至關重要。

#### **知識接地回應範例**

以下是模型在知識接地查詢後回傳的 content 物件範例。

**最終答案文字：**

```
"Yes, Inter Miami won their last game in the FIFA Club World Cup. They defeated FC Porto 2-1 in their second group stage match. Their first game in the tournament was a 0-0 draw against Al Ahly FC. Inter Miami is scheduled to play their third group stage match against Palmeiras on Monday, June 23, 2025."
```

**知識接地 (grounding) 中繼資料片段：**

```json
"groundingMetadata": {
  "groundingChunks": [
    { "web": { "title": "mlssoccer.com", "uri": "..." } },
    { "web": { "title": "intermiamicf.com", "uri": "..." } },
    { "web": { "title": "mlssoccer.com", "uri": "..." } }
  ],
  "groundingSupports": [
    {
      "groundingChunkIndices": [0, 1],
      "segment": {
        "startIndex": 65,
        "endIndex": 126,
        "text": "They defeated FC Porto 2-1 in their second group stage match."
      }
    },
    {
      "groundingChunkIndices": [1],
      "segment": {
        "startIndex": 127,
        "endIndex": 196,
        "text": "Their first game in the tournament was a 0-0 draw against Al Ahly FC."
      }
    },
    {
      "groundingChunkIndices": [0, 2],
      "segment": {
        "startIndex": 197,
        "endIndex": 303,
        "text": "Inter Miami is scheduled to play their third group stage match against Palmeiras on Monday, June 23, 2025."
      }
    }
  ],
  "searchEntryPoint": { ... }
}

```

#### **如何解讀回應內容**

metadata（中繼資料）提供了模型生成文字與其所依據來源之間的連結。以下是逐步說明：

1. **groundingChunks**：這是一個模型所參考網頁的清單。每個 chunk 包含網頁標題（title）以及指向來源的 uri。  
2. **groundingSupports**：這個清單將最終答案中的特定句子對應回 groundingChunks。  
   * **segment**：此物件標識最終文字答案中的特定片段，由 startIndex、endIndex 及該段文字組成。  
   * **groundingChunkIndices**：這個陣列包含對應於 groundingChunks 清單中來源的索引號。例如，句子 "They defeated FC Porto 2-1..." 是由 groundingChunks 中索引 0 和 1（分別來自 mlssoccer.com 和 intermiamicf.com）的資訊所支持。

### 如何以 Google Search 呈現知識接地（grounding）回應

正確地將資訊（包含引用來源與 Search 建議）展示給最終使用者，是使用知識接地（grounding）的關鍵一環。這能建立信任，並讓使用者自行驗證資訊。

![Responnses from Google Search](../assets/google_search_grd_resp.png)

#### **顯示 Search 建議**

`groundingMetadata` 中的 `searchEntryPoint` 物件包含了用於顯示搜尋查詢建議的預先格式化 HTML。如範例圖片所示，這些建議通常會以可點擊的 chip 呈現，讓使用者探索相關主題。

**來自 searchEntryPoint 的渲染 HTML：** metadata 提供了渲染 Search 建議列所需的 HTML 與 CSS，其中包含 Google 標誌，以及如「When is the next FIFA Club World Cup」、「Inter Miami FIFA Club World Cup history」等相關查詢的 chip。將這段 HTML 直接整合至應用程式前端，即可如預期顯示這些建議。

如需更多資訊，請參閱 Vertex AI 文件中的 [using Google Search Suggestions](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-search-suggestions)。

## 摘要

Google Search Grounding 讓 AI agent 從靜態知識庫，轉變為能夠即時連網、提供準確資訊的智慧助理。將此功能整合至您的 Agent Development Kit (ADK) agent，可讓其：

- 存取訓練資料以外的最新資訊
- 提供來源標註，提升透明度與信任感
- 回答內容詳盡且可驗證
- 透過相關 Search 建議提升使用者體驗

知識接地（grounding）流程能無縫地將使用者查詢連結至 Google 的龐大搜尋索引，讓回應內容具備最新脈絡，同時維持對話流暢。只要正確實作並呈現知識接地回應，您的 agent 就能成為強大的資訊探索與決策輔助工具。
