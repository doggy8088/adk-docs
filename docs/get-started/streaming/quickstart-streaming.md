# 快速開始（串流 / Python） {#adk-streaming-quickstart}

透過本快速開始教學，你將學會如何建立一個簡單的 agent，並使用 Agent Development Kit (ADK) 串流功能，實現低延遲、雙向的語音與視訊通訊。我們將安裝 ADK，設定一個基本的「Google Search」agent，嘗試使用 `adk web` 工具以串流方式執行 agent，並說明如何自行利用 ADK 串流與 [FastAPI](https://fastapi.tiangolo.com/) 建立一個簡單的非同步網頁應用程式。

**注意：** 本指南假設你已具備在 Windows、Mac 與 Linux 環境下使用終端機的經驗。

## 支援語音／視訊串流的模型 {#supported-models}

要在 ADK 中使用語音／視訊串流功能，需使用支援 Gemini Live API 的 Gemini 模型。你可以在下列文件中找到支援 Gemini Live API 的**模型 ID**：

- [Google AI Studio: Gemini Live API](https://ai.google.dev/gemini-api/docs/models#live-api)
- [Vertex AI: Gemini Live API](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api)

## 1. 建立環境並安裝 ADK { #setup-environment-install-adk }

建立並啟用虛擬環境（建議）：

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
pip install google-adk
```

## 2. 專案結構 { #project-structure }

請依下列資料夾結構建立空的檔案：

```console
adk-streaming/  # Project folder
└── app/ # the web app folder
    ├── .env # Gemini API key
    └── google_search_agent/ # Agent folder
        ├── __init__.py # Python package
        └── agent.py # Agent definition
```

### agent.py

請將以下程式碼區塊複製貼上到 `agent.py` 檔案中。

對於 `model`，請依照前述於 [Models section](#supported-models) 的說明，再次確認 model ID 是否正確。

```py
from google.adk.agents import Agent
from google.adk.tools import google_search  # Import the tool

root_agent = Agent(
   # A unique name for the agent.
   name="basic_search_agent",
   # The Large Language Model (LLM) that agent will use.
   # Please fill in the latest model id that supports live from
   # https://doggy8088.github.io/adk-docs/get-started/streaming/quickstart-streaming/#supported-models
   model="...",  # for example: model="gemini-2.0-flash-live-001" or model="gemini-2.0-flash-live-preview-04-09"
   # A short description of the agent's purpose.
   description="Agent to answer questions using Google Search.",
   # Instructions to set the agent's behavior.
   instruction="You are an expert researcher. You always stick to the facts.",
   # Add google_search tool to perform grounding with Google search.
   tools=[google_search]
)
```

`agent.py` 是儲存所有 agent 邏輯的地方，且你必須定義 `root_agent`。

請注意，你已經非常輕鬆地整合了 [知識接地 (grounding) 與 Google Search](https://ai.google.dev/gemini-api/docs/grounding?lang=python#configure-search) 的功能。`Agent` 類別與 `google_search` 工具負責處理與大型語言模型 (LLM) 及 Google Search API 進行知識接地的複雜互動，讓你能專注於 agent 的*目的*與*行為*。

![intro_components.png](../../assets/quickstart-streaming-tool.png)

請將下方程式碼區塊複製貼到 `__init__.py` 檔案中。

```py title="__init__.py"
from . import agent
```

## 3\. 設定平台 { #set-up-the-platform }

要執行 agent，請從 Google AI Studio 或 Google Cloud Vertex AI 這兩個平台中擇一：

=== "Gemini - Google AI Studio"
    1. 從 [Google AI Studio](https://aistudio.google.com/apikey) 取得 API KEY。
    2. 開啟位於 (`app/`) 內的 **`.env`** 檔案，並將以下程式碼複製貼上。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=FALSE
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

    3. 將 `PASTE_YOUR_ACTUAL_API_KEY_HERE` 替換為你實際的 `API KEY`。

=== "Gemini - Google Cloud Vertex AI"
    1. 你需要一個已存在的
       [Google Cloud](https://cloud.google.com/?e=48754805&hl=en) 帳戶以及一個專案。
        * 建立一個
          [Google Cloud 專案](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp)
        * 設定
          [gcloud CLI](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local)
        * 從終端機執行
          `gcloud auth login` 來驗證 Google Cloud 身份。
        * [啟用 Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)。
    2. 開啟位於 (`app/`) 內的 **`.env`** 檔案。複製並貼上以下程式碼，並更新專案 ID 與 Location。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=TRUE
        GOOGLE_CLOUD_PROJECT=PASTE_YOUR_ACTUAL_PROJECT_ID
        GOOGLE_CLOUD_LOCATION=us-central1
        ```

## 4. 使用 `adk web` 嘗試 agent { #try-the-agent-with-adk-web }

現在已經可以嘗試這個 agent 了。請執行以下指令來啟動**開發 UI（dev UI）**。首先，請確保目前的目錄已設為 `app`：

```shell
cd app
```

另外，請使用以下指令設定 `SSL_CERT_FILE` 變數。這在後續進行語音和視訊測試時是必要的。

=== "OS X &amp; Linux"
    ```bash
    export SSL_CERT_FILE=$(python -m certifi)
    ```

=== "Windows（命令提示字元）"
    ```powershell
    $env:SSL_CERT_FILE = (python -m certifi)
    ```



然後，執行開發 UI：

```shell
adk web
```

!!!info "Windows 使用者注意事項"

    When hitting the `_make_subprocess_transport NotImplementedError`, consider using `adk web --no-reload` instead.


請**直接在瀏覽器中**開啟所提供的 URL（通常為 `http://localhost:8000` 或 `http://127.0.0.1:8000`）。這個連線將完全留在您的本機。請選擇 `google_search_agent`。

### 嘗試文字互動

請在 UI 介面中輸入以下提示來進行測試。

* 紐約的天氣如何？
* 紐約現在幾點？
* 巴黎的天氣如何？
* 巴黎現在幾點？

agent 會使用 google_search 工具來取得最新資訊並回答這些問題。

### 嘗試語音與視訊互動

若要嘗試語音互動，請重新載入網頁瀏覽器，點擊麥克風按鈕以啟用語音輸入，然後用語音詢問相同的問題。您將會即時聽到語音回覆。

若要嘗試視訊互動，請重新載入網頁瀏覽器，點擊相機按鈕以啟用視訊輸入，然後詢問像是「你看到了什麼？」這類問題。agent 會根據視訊輸入回答他所看到的內容。

（只需點擊一次麥克風或相機按鈕即可。您的語音或視訊將會串流傳送至模型，並且模型的回應也會持續串流回來。不支援多次點擊麥克風或相機按鈕。）

### 停止工具

請在主控台按下 `Ctrl-C` 來停止 `adk web`。

### 關於 ADK Streaming 的注意事項

以下功能將在未來版本的 Agent Development Kit (ADK) Streaming 中支援：Callback、LongRunningTool、ExampleTool，以及 Shell agent（例如 SequentialAgent）。

恭喜您！您已成功使用 Agent Development Kit (ADK) 建立並互動您的第一個 Streaming agent！

## 下一步：打造自訂串流應用程式

在 [Custom Audio Streaming app](../../streaming/custom-streaming.md) 教學中，將概述如何使用 Agent Development Kit (ADK) Streaming 與 [FastAPI](https://fastapi.tiangolo.com/) 建立自訂的非同步網頁應用程式，包括伺服器與用戶端程式碼，實現即時、雙向的語音與文字通訊。
