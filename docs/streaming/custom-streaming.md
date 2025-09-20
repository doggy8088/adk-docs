# 自訂音訊串流應用程式（SSE） {#custom-streaming}

本文概述了一個以 Agent Development Kit (ADK) Streaming 與 [FastAPI](https://fastapi.tiangolo.com/) 建立的自訂非同步網頁應用程式的伺服器端與用戶端程式碼，實現了透過 Server-Sent Events (SSE) 進行即時、雙向音訊與文字通訊。其主要特色包括：

**伺服器端（Python/FastAPI）**：
- FastAPI 與 ADK 整合
- 以 Server-Sent Events 實現即時串流
- 具備獨立使用者情境的工作階段管理
- 同時支援文字與音訊通訊模式
- 整合 Google Search 工具以產生具根據的回應

**用戶端（JavaScript/Web Audio API）**：
- 透過 SSE 與 HTTP POST 實現即時雙向通訊
- 使用 AudioWorklet 處理器進行專業音訊處理
- 可無縫切換文字與音訊模式
- 自動重新連線與錯誤處理
- 以 Base64 編碼進行音訊資料傳輸

本範例亦提供 [WebSocket](custom-streaming-ws.md) 版本。

## 1. 安裝 ADK {#1.-setup-installation}

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
pip install --upgrade google-adk==1.10.0
```

使用以下指令設定 `SSL_CERT_FILE` 變數。

```shell
export SSL_CERT_FILE=$(python -m certifi)
```

下載範例程式碼：

```bash
git clone --no-checkout https://github.com/google/adk-docs.git
cd adk-docs
git sparse-checkout init --cone
git sparse-checkout set examples/python/snippets/streaming/adk-streaming
git checkout main
cd examples/python/snippets/streaming/adk-streaming/app
```

此範例程式碼包含以下檔案與資料夾：

```console
adk-streaming/
└── app/ # the web app folder
    ├── .env # Gemini API key / Google Cloud Project ID
    ├── main.py # FastAPI web app
    ├── static/ # Static content folder
    |   ├── js # JavaScript files folder (includes app.js)
    |   └── index.html # The web client page
    └── google_search_agent/ # Agent folder
        ├── __init__.py # Python package
        └── agent.py # Agent definition
```

## 2\. 設定平台 {#2.-set-up-the-platform}

要執行範例應用程式，請從 Google AI Studio 或 Google Cloud Vertex AI 中選擇一個平台：

=== "Gemini - Google AI Studio"
    1. 從 [Google AI Studio](https://aistudio.google.com/apikey) 取得 API 金鑰。
    2. 開啟位於 (`app/`) 內的 **`.env`** 檔案，並複製貼上下列程式碼。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=FALSE
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

    3. 將 `PASTE_YOUR_ACTUAL_API_KEY_HERE` 替換為您實際的 `API KEY`。

=== "Gemini - Google Cloud Vertex AI"
    1. 您需要一個現有的
       [Google Cloud](https://cloud.google.com/?e=48754805&hl=en) 帳戶以及一個
       專案。
        * 建立一個
          [Google Cloud 專案](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp)
        * 設定
          [gcloud 命令列介面 (CLI)](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local)
        * 在終端機中執行
          `gcloud auth login`，以驗證 Google Cloud 身份。
        * [啟用 Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)。
    2. 開啟位於 (`app/`) 內的 **`.env`** 檔案。複製並貼上以下程式碼，並更新專案 ID 及位置。

        ```env title=".env"
        GOOGLE_GENAI_USE_VERTEXAI=TRUE
        GOOGLE_CLOUD_PROJECT=PASTE_YOUR_ACTUAL_PROJECT_ID
        GOOGLE_CLOUD_LOCATION=us-central1
        ```


## 3\. 與您的串流應用互動 {#3.-interact-with-your-streaming-app}

1\. **切換到正確的目錄：**

   為了有效執行您的代理，請確保您位於**app 資料夾 (`adk-streaming/app`)**

2\. **啟動 Fast API**：執行以下指令以啟動命令列介面 (CLI)

```console
uvicorn main:app --reload
```

3\. **以文字模式存取應用程式：** 當應用程式啟動後，終端機會顯示一個本機 URL（例如：[http://localhost:8000](http://localhost:8000)）。點擊這個連結，即可在瀏覽器中開啟網頁 UI。

現在你應該會看到如下的 UI 畫面：

![ADK Streaming app](../assets/adk-streaming-text.png)

試著提出一個問題 `What time is it now?`。代理（agent）會利用 Google Search 回答你的查詢。你會發現 UI 會以串流文字的方式顯示代理的回應。即使代理還在回應時，你也可以隨時傳送訊息給代理。這展示了 Agent Development Kit (ADK) Streaming 的雙向通訊能力。

4\. **以語音模式存取應用程式：** 現在請點擊 `Start Audio` 按鈕。應用程式會以語音模式重新連線到伺服器，並且 UI 首次會顯示以下對話框：

![ADK Streaming app](../assets/adk-streaming-audio-dialog.png)

點擊 `Allow while visiting the site`，然後你會看到瀏覽器頂端出現麥克風圖示：

![ADK Streaming app](../assets/adk-streaming-mic.png)

現在你可以用語音與代理對話。像是用語音詢問 `What time is it now?` 這類問題，你也會聽到代理以語音回應。由於 Agent Development Kit (ADK) Streaming 支援[多種語言](https://ai.google.dev/gemini-api/docs/live#supported-languages)，因此也能以支援的語言回應你的問題。

5\. **檢查主控台日誌**

如果你使用的是 Chrome 瀏覽器，請右鍵點擊並選擇 `Inspect` 以開啟 DevTools。在 `Console` 上，你可以看到如 `[CLIENT TO AGENT]` 和 `[AGENT TO CLIENT]` 這類進出音訊資料，這些代表瀏覽器與伺服器之間串流的音訊資料。

同時，在應用程式伺服器的主控台中，你應該會看到類似以下的內容：

```
Client #90766266 connected via SSE, audio mode: false
INFO:     127.0.0.1:52692 - "GET /events/90766266?is_audio=false HTTP/1.1" 200 OK
[CLIENT TO AGENT]: hi
INFO:     127.0.0.1:52696 - "POST /send/90766266 HTTP/1.1" 200 OK
[AGENT TO CLIENT]: text/plain: {'mime_type': 'text/plain', 'data': 'Hi'}
[AGENT TO CLIENT]: text/plain: {'mime_type': 'text/plain', 'data': ' there! How can I help you today?\n'}
[AGENT TO CLIENT]: {'turn_complete': True, 'interrupted': None}
```

這些主控台日誌（console logs）在你開發自有串流應用程式時非常重要。在許多情況下，瀏覽器與伺服器之間的通訊失敗，往往是串流應用程式錯誤的主要原因。

6\. **疑難排解提示**

- **當你的瀏覽器無法透過 SSH proxy 連線到伺服器時：** 各種雲端服務中所使用的 SSH proxy 可能無法與 SSE 搭配運作。請嘗試不使用 SSH proxy，例如直接使用本機筆記型電腦，或改用 [WebSocket](custom-streaming-ws.md) 版本。
- **當 `gemini-2.0-flash-exp` 模型無法運作時：** 如果你在應用程式伺服器主控台看到有關 `gemini-2.0-flash-exp` 模型可用性的錯誤訊息，請嘗試在 `app/google_search_agent/agent.py` 的第 6 行將其替換為 `gemini-2.0-flash-live-001`。

## 4. Agent 定義

`google_search_agent` 資料夾中的 agent 定義程式碼 `agent.py`，是撰寫 agent 邏輯的地方：


```py
from google.adk.agents import Agent
from google.adk.tools import google_search  # Import the tool

root_agent = Agent(
   name="google_search_agent",
   model="gemini-2.0-flash-exp", # if this model does not work, try below
   #model="gemini-2.0-flash-live-001",
   description="Agent to answer questions using Google Search.",
   instruction="Answer the question using the Google Search tool.",
   tools=[google_search],
)
```

請注意，您可以輕鬆地整合 [grounding with Google Search](https://ai.google.dev/gemini-api/docs/grounding?lang=python#configure-search)（結合 Google 搜尋進行知識落地）的能力。`Agent` 類別與 `google_search` 工具負責處理與大型語言模型 (LLM) 及搜尋 API 的複雜互動，讓您能專注於代理（agent）的*目標*與*行為*設計。

![intro_components.png](../assets/quickstart-streaming-tool.png)

伺服器與用戶端架構可實現網頁用戶端與 AI 代理間的即時雙向通訊，並確保適當的工作階段（session）隔離與資源管理。

## 5. 伺服器端程式碼概覽 {#5.-server-side-code-overview}

FastAPI 伺服器提供網頁用戶端與 AI 代理間的即時通訊能力。

### 雙向通訊概覽 {#4.-bidi-comm-overview}

#### 用戶端到代理流程：
1. **連線建立** — 用戶端開啟到 `/events/{user_id}` 的 SSE 連線，觸發建立 session 並將請求佇列儲存於 `active_sessions`
2. **訊息傳送** — 用戶端以 POST 請求傳送至 `/send/{user_id}`，並附帶包含 `mime_type` 與 `data` 的 JSON 載荷
3. **佇列處理** — 伺服器取得該 session 的 `live_request_queue`，並透過 `send_content()` 或 `send_realtime()` 將訊息轉發給代理

#### 代理到用戶端流程：
1. **事件產生** — 代理處理請求並透過 `live_events` 非同步產生器產生事件
2. **串流處理** — `agent_to_client_sse()` 過濾事件並將其格式化為 SSE 相容的 JSON
3. **即時傳遞** — 事件透過持久性 HTTP 連線及正確的 SSE 標頭串流至用戶端

#### 工作階段管理：
- **每位用戶隔離** — 每位用戶都擁有獨立的 session，並儲存在 `active_sessions` 字典中
- **生命週期管理** — 斷線時自動清理 session，並正確釋放資源
- **並發支援** — 多位用戶可同時擁有活躍的 session

#### 錯誤處理：
- **Session 驗證** — POST 請求在處理前會驗證 session 是否存在
- **串流韌性** — SSE 串流自動處理例外狀況並執行清理
- **連線恢復** — 用戶端可重新建立 SSE 連線以恢復通訊

#### 工作階段恢復：
- **即時 session 恢復** — 支援透明地重新連接中斷的即時對話
- **Handle 快取** — 系統自動快取 session handle 以利恢復
- **可靠性提升** — 增強串流過程中對網路不穩定的韌性

### 代理 Session 管理

`start_agent_session()` 函式可建立獨立的 AI 代理 session：

```py
async def start_agent_session(user_id, is_audio=False):
    """Starts an agent session"""

    # Create a Runner
    runner = InMemoryRunner(
        app_name=APP_NAME,
        agent=root_agent,
    )

    # Create a Session
    session = await runner.session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,  # Replace with actual user ID
    )

    # Set response modality
    modality = "AUDIO" if is_audio else "TEXT"
    run_config = RunConfig(response_modalities=[modality])
    
    # Optional: Enable session resumption for improved reliability
    # run_config = RunConfig(
    #     response_modalities=[modality],
    #     session_resumption=types.SessionResumptionConfig()
    # )

    # Create a LiveRequestQueue for this session
    live_request_queue = LiveRequestQueue()

    # Start agent session
    live_events = runner.run_live(
        session=session,
        live_request_queue=live_request_queue,
        run_config=run_config,
    )
    return live_events, live_request_queue
```

- **InMemoryRunner 設定** - 建立一個在記憶體中管理 agent 生命週期的 runner 實例，應用程式名稱為 "ADK Streaming example"，並使用 Google Search agent。

- **Session 建立** - 使用 `runner.session_service.create_session()` 以每個使用者 ID 建立唯一的 session，支援多位使用者同時並行。

- **回應模式設定** - 根據 `is_audio` 參數，將 `RunConfig` 設定為 "AUDIO" 或 "TEXT" 模式，以決定輸出格式。

- **LiveRequestQueue** - 建立一個雙向通訊通道，負責佇列化傳入請求，並實現 client 與 agent 之間的即時訊息傳遞。

- **Live Events Stream** - `runner.run_live()` 會回傳一個非同步產生器（async generator），可即時產生 agent 的事件，包括部分回應、回合完成及中斷等。

### Server-Sent Events (SSE) 串流

`agent_to_client_sse()` 函式負責從 agent 即時串流資料到 client：

```py
async def agent_to_client_sse(live_events):
    """Agent to client communication via SSE"""
    async for event in live_events:
        # If the turn complete or interrupted, send it
        if event.turn_complete or event.interrupted:
            message = {
                "turn_complete": event.turn_complete,
                "interrupted": event.interrupted,
            }
            yield f"data: {json.dumps(message)}\n\n"
            print(f"[AGENT TO CLIENT]: {message}")
            continue

        # Read the Content and its first Part
        part: Part = (
            event.content and event.content.parts and event.content.parts[0]
        )
        if not part:
            continue

        # If it's audio, send Base64 encoded audio data
        is_audio = part.inline_data and part.inline_data.mime_type.startswith("audio/pcm")
        if is_audio:
            audio_data = part.inline_data and part.inline_data.data
            if audio_data:
                message = {
                    "mime_type": "audio/pcm",
                    "data": base64.b64encode(audio_data).decode("ascii")
                }
                yield f"data: {json.dumps(message)}\n\n"
                print(f"[AGENT TO CLIENT]: audio/pcm: {len(audio_data)} bytes.")
                continue

        # If it's text and a parial text, send it
        if part.text and event.partial:
            message = {
                "mime_type": "text/plain",
                "data": part.text
            }
            yield f"data: {json.dumps(message)}\n\n"
            print(f"[AGENT TO CLIENT]: text/plain: {message}")
```

- **事件處理迴圈（Event Processing Loop）** - 迭代`live_events`非同步產生器（async generator），隨著代理（agent）傳來的每個事件逐一處理。

- **輪次管理（Turn Management）**  - 偵測對話輪次完成或中斷事件，並傳送帶有`turn_complete`與`interrupted`旗標的 JSON 訊息，以標示對話狀態變化。

- **內容部分擷取（Content Part Extraction）** - 從事件內容中擷取第一個`Part`，其中包含文字或音訊資料。

- **音訊串流（Audio Streaming）**  - 處理 PCM 音訊資料，方式如下：
  - 偵測`inline_data`中的`audio/pcm` MIME 類型
  - 將原始音訊位元組進行 Base64 編碼，以便 JSON 傳輸
  - 以`mime_type`與`data`欄位傳送

- **文字串流（Text Streaming）**  - 處理部分文字回應，隨產生即時傳送增量文字更新，實現即時輸入效果。

- **SSE 格式（SSE Format）** - 所有資料皆依照 SSE 規範格式化為`data: {json}\n\n`，以確保瀏覽器 EventSource API 相容性。

### HTTP 端點與路由

#### 根端點（Root Endpoint）
**GET /** - 透過 FastAPI 的`FileResponse`，將`static/index.html`作為主要應用介面提供服務。

#### SSE 事件端點（SSE Events Endpoint）

```py
@app.get("/events/{user_id}")
async def sse_endpoint(user_id: int, is_audio: str = "false"):
    """SSE endpoint for agent to client communication"""

    # Start agent session
    user_id_str = str(user_id)
    live_events, live_request_queue = await start_agent_session(user_id_str, is_audio == "true")

    # Store the request queue for this user
    active_sessions[user_id_str] = live_request_queue

    print(f"Client #{user_id} connected via SSE, audio mode: {is_audio}")

    def cleanup():
        live_request_queue.close()
        if user_id_str in active_sessions:
            del active_sessions[user_id_str]
        print(f"Client #{user_id} disconnected from SSE")

    async def event_generator():
        try:
            async for data in agent_to_client_sse(live_events):
                yield data
        except Exception as e:
            print(f"Error in SSE stream: {e}")
        finally:
            cleanup()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )
```

**GET /events/{user_id}** - 建立持久性的 SSE 連線：

- **參數** - 接收 `user_id`（int）以及可選的 `is_audio` 查詢參數（預設為 "false"）

- **工作階段初始化** - 呼叫 `start_agent_session()`，並將 `live_request_queue` 儲存至 `active_sessions` 字典中，以 `user_id` 作為鍵值

- **StreamingResponse** - 回傳 `StreamingResponse`，內容包含：
  - 包裝 `agent_to_client_sse()` 的 `event_generator()` 非同步函式
  - MIME 類型：`text/event-stream`
  - 提供跨來源存取的 CORS 標頭
  - 防止快取的 Cache-control 標頭

- **清理邏輯** - 當連線終止時，會關閉請求佇列並從作用中工作階段中移除，並針對串流中斷進行錯誤處理。

### 工作階段恢復設定

Agent Development Kit (ADK) 支援即時工作階段恢復，以提升串流對話時的可靠性。此功能可在因網路問題導致即時連線中斷時，自動重新連線。

#### 啟用工作階段恢復

若要啟用工作階段恢復，您需要：

1. **匯入所需型別**：
```py
from google.genai import types
```

2. **在 RunConfig 中設定工作階段恢復功能**：
```py
run_config = RunConfig(
    response_modalities=[modality],
    session_resumption=types.SessionResumptionConfig()
)
```

#### 工作階段恢復功能

- **自動 Handle 快取** - 系統會在即時對話期間自動快取工作階段恢復 handle
- **透明式重新連線** - 當連線中斷時，系統會嘗試使用已快取的 handle 進行恢復
- **情境保留** - 對話的情境與狀態可在重新連線後持續維持
- **網路韌性** - 在網路不穩定的情況下，能提供更佳的使用者體驗

#### 實作說明

- 工作階段恢復 handle 由 Agent Development Kit (ADK) 框架於內部管理
- 不需要額外修改客戶端程式碼
- 此功能特別適用於長時間執行的串流對話
- 連線中斷對使用者體驗的影響會大幅降低

#### 疑難排解

如果您在使用工作階段恢復時遇到錯誤：

1. **檢查模型相容性** - 請確認您使用的模型支援工作階段恢復
2. **API 限制** - 部分工作階段恢復功能可能並非所有 API 版本皆支援
3. **移除工作階段恢復** - 若問題持續發生，您可以透過從 `RunConfig` 移除 `session_resumption` 參數來停用工作階段恢復

#### 訊息傳送端點

```py
@app.post("/send/{user_id}")
async def send_message_endpoint(user_id: int, request: Request):
    """HTTP endpoint for client to agent communication"""

    user_id_str = str(user_id)

    # Get the live request queue for this user
    live_request_queue = active_sessions.get(user_id_str)
    if not live_request_queue:
        return {"error": "Session not found"}

    # Parse the message
    message = await request.json()
    mime_type = message["mime_type"]
    data = message["data"]

    # Send the message to the agent
    if mime_type == "text/plain":
        content = Content(role="user", parts=[Part.from_text(text=data)])
        live_request_queue.send_content(content=content)
        print(f"[CLIENT TO AGENT]: {data}")
    elif mime_type == "audio/pcm":
        decoded_data = base64.b64decode(data)
        live_request_queue.send_realtime(Blob(data=decoded_data, mime_type=mime_type))
        print(f"[CLIENT TO AGENT]: audio/pcm: {len(decoded_data)} bytes")
    else:
        return {"error": f"Mime type not supported: {mime_type}"}

    return {"status": "sent"}
```

**POST /send/{user_id}** - 接收用戶端訊息：

- **Session 查詢** - 從 `active_sessions` 取得 `live_request_queue`，若 session 不存在則回傳錯誤

- **訊息處理** - 解析包含 `mime_type` 與 `data` 欄位的 JSON：
  - **文字訊息** - 使用 `Part.from_text()` 建立 `Content`，並透過 `send_content()` 發送
  - **音訊訊息** - 將 PCM 資料進行 Base64 解碼，並透過 `send_realtime()` 搭配 `Blob` 發送

- **錯誤處理** - 對於不支援的 MIME 類型或缺少 session，回傳適當的錯誤回應。


## 6. 用戶端程式碼概覽 {#6.-client-side-code-overview}

用戶端包含一個具備即時通訊與音訊功能的網頁介面：

### HTML 介面 (`static/index.html`)

```html
<!doctype html>
<html>
  <head>
    <title>ADK Streaming Test (Audio)</title>
    <script src="/static/js/app.js" type="module"></script>
  </head>

  <body>
    <h1>ADK Streaming Test</h1>
    <div
      id="messages"
      style="height: 300px; overflow-y: auto; border: 1px solid black"></div>
    <br />

    <form id="messageForm">
      <label for="message">Message:</label>
      <input type="text" id="message" name="message" />
      <button type="submit" id="sendButton" disabled>Send</button>
      <button type="button" id="startAudioButton">Start Audio</button>
    </form>
  </body>

</html>
```

簡易網頁介面包含：
- **訊息顯示** - 可捲動的 div，用於顯示對話歷史
- **文字輸入表單** - 文字輸入欄位與傳送按鈕，用於發送文字訊息
- **音訊控制** - 按鈕可啟用音訊模式並存取麥克風

### 主要應用程式邏輯（`static/js/app.js`）

#### 工作階段管理（`app.js`）

```js
const sessionId = Math.random().toString().substring(10);
const sse_url =
  "http://" + window.location.host + "/events/" + sessionId;
const send_url =
  "http://" + window.location.host + "/send/" + sessionId;
let is_audio = false;
```

- **隨機 Session ID** - 為每個瀏覽器實例產生唯一的 session ID
- **URL 組建** - 使用 session ID 建立 SSE 和 send 端點的 URL
- **音訊模式旗標** - 用於追蹤是否啟用音訊模式

#### Server-Sent Events 連線（`app.js`）
**connectSSE()** 函式負責處理即時的伺服器通訊：

```js
// SSE handlers
function connectSSE() {
  // Connect to SSE endpoint
  eventSource = new EventSource(sse_url + "?is_audio=" + is_audio);

  // Handle connection open
  eventSource.onopen = function () {
    // Connection opened messages
    console.log("SSE connection opened.");
    document.getElementById("messages").textContent = "Connection opened";

    // Enable the Send button
    document.getElementById("sendButton").disabled = false;
    addSubmitHandler();
  };

  // Handle incoming messages
  eventSource.onmessage = function (event) {
    ...
  };

  // Handle connection close
  eventSource.onerror = function (event) {
    console.log("SSE connection error or closed.");
    document.getElementById("sendButton").disabled = true;
    document.getElementById("messages").textContent = "Connection closed";
    eventSource.close();
    setTimeout(function () {
      console.log("Reconnecting...");
      connectSSE();
    }, 5000);
  };
}
```

- **EventSource 設定** - 以 audio mode 參數建立 SSE 連線
- **連線處理程序**：
  - **onopen** - 連線成功時啟用傳送按鈕與表單送出功能
  - **onmessage** - 處理來自 agent 的訊息
  - **onerror** - 處理斷線情況，並於 5 秒後自動重新連線

#### 訊息處理（`app.js`）
處理來自伺服器的不同訊息類型：

```js
  // Handle incoming messages
  eventSource.onmessage = function (event) {
    // Parse the incoming message
    const message_from_server = JSON.parse(event.data);
    console.log("[AGENT TO CLIENT] ", message_from_server);

    // Check if the turn is complete
    // if turn complete, add new message
    if (
      message_from_server.turn_complete &&
      message_from_server.turn_complete == true
    ) {
      currentMessageId = null;
      return;
    }

    // If it's audio, play it
    if (message_from_server.mime_type == "audio/pcm" && audioPlayerNode) {
      audioPlayerNode.port.postMessage(base64ToArray(message_from_server.data));
    }

    // If it's a text, print it
    if (message_from_server.mime_type == "text/plain") {
      // add a new message for a new turn
      if (currentMessageId == null) {
        currentMessageId = Math.random().toString(36).substring(7);
        const message = document.createElement("p");
        message.id = currentMessageId;
        // Append the message element to the messagesDiv
        messagesDiv.appendChild(message);
      }

      // Add message text to the existing message element
      const message = document.getElementById(currentMessageId);
      message.textContent += message_from_server.data;

      // Scroll down to the bottom of the messagesDiv
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
```

- **輪次管理（Turn Management）** - 偵測`turn_complete`以重設訊息狀態
- **音訊播放（Audio Playback）** - 解碼 Base64 PCM 資料並傳送至 audio worklet
- **文字顯示（Text Display）** - 建立新的訊息元素並即時附加部分文字更新，呈現即時輸入效果

#### 訊息傳送（`app.js`）
**sendMessage()** 函式會將資料傳送至伺服器：

```js
async function sendMessage(message) {
  try {
    const response = await fetch(send_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Failed to send message:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
```

- **HTTP POST** - 傳送 JSON 載荷至 `/send/{session_id}` 端點
- **錯誤處理** - 記錄失敗的請求與網路錯誤
- **訊息格式** - 標準化的 `{mime_type, data}` 結構

### 音訊播放器（`static/js/audio-player.js`）

**startAudioPlayerWorklet()** 函式：

- **AudioContext 設定** - 建立 24kHz 取樣率的 context 以進行播放
- **Worklet 載入** - 載入 PCM 播放器處理器以處理音訊
- **音訊處理流程** - 將 worklet 節點連接至音訊輸出（喇叭）

### 音訊錄音器（`static/js/audio-recorder.js`）

**startAudioRecorderWorklet()** 函式：

- **AudioContext 設定** - 建立 16kHz 取樣率的 context 以進行錄音
- **麥克風存取** - 請求使用者媒體權限以獲取音訊輸入
- **音訊處理** - 將麥克風連接至錄音 worklet
- **資料轉換** - 將 Float32 樣本轉換為 16 位元 PCM 格式

### Audio Worklet 處理器

#### PCM 播放器處理器（`static/js/pcm-player-processor.js`）
**PCMPlayerProcessor** 類別負責音訊播放：

- **環形緩衝區** - 用於儲存 180 秒 24kHz 音訊的循環緩衝區
- **資料擷取** - 將 Int16 轉換為 Float32 並儲存至緩衝區
- **播放迴圈** - 持續從緩衝區讀取資料輸出至音訊通道
- **溢位處理** - 當緩衝區已滿時覆寫最舊的樣本

#### PCM 錄音處理器（`static/js/pcm-recorder-processor.js`）
**PCMProcessor** 類別負責擷取麥克風輸入：

- **音訊輸入** - 處理接收到的音訊框架
- **資料傳輸** - 複製 Float32 樣本並透過 message port 傳送至主執行緒

#### 模式切換：
- **音訊啟用** - 「啟動音訊」按鈕會啟用麥克風並以 audio 標誌重新連接 SSE
- **無縫切換** - 關閉現有連線並建立新的啟用音訊的工作階段

此用戶端架構利用現代 Web API，實現文字與音訊雙模態的即時通訊，並支援專業級音訊處理。

## 摘要

本應用展示了一套完整的即時 AI 智能代理系統，具備以下主要特色：

**架構重點**：
- **即時性**：支援串流回應，包含部分文字更新與持續音訊
- **穩健性**：完善的錯誤處理與自動復原機制
- **現代化**：採用最新 Web 標準（AudioWorklet、SSE、ES6 modules）

本系統為需要即時互動、網頁搜尋能力與多媒體通訊的進階 AI 應用提供基礎。

### 部署至生產環境的後續步驟

若要將本系統部署至生產環境，建議考慮以下改進：

#### 安全性
- **身分驗證**：以正式的使用者身分驗證取代隨機工作階段 ID
- **API 金鑰安全**：使用環境變數或機密管理服務
- **HTTPS**：強制所有通訊採用 TLS 加密
- **速率限制**：防止濫用並控管 API 成本

#### 可擴展性
- **持久化儲存**：將記憶體中的工作階段改為持久化工作階段
- **負載平衡**：支援多台伺服器實例並共享工作階段狀態
- **音訊最佳化**：實作壓縮以降低頻寬使用

#### 監控
- **錯誤追蹤**：監控並警示系統故障
- **API 成本監控**：追蹤 Google Search 與 Gemini 使用量，避免預算超支
- **效能指標**：監控回應時間與音訊延遲

#### 基礎設施
- **容器化**：使用 Docker 打包，方便於 Cloud Run 或 Agent Engine 部署
- **健康檢查**：實作端點監控以追蹤服務正常運作
