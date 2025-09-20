# 測試你的代理（agent）

在部署你的 agent 之前，你應該先進行測試，以確保其運作符合預期。在開發環境中測試 agent 最簡單的方法，就是使用 Agent Development Kit (ADK) API 伺服器。

=== "Python"

    ```py
    adk api_server
    ```

=== "Java"

    Make sure to update the port number.

    ```java
    mvn compile exec:java \
         -Dexec.args="--adk.agents.source-dir=src/main/java/agents --server.port=8080"
    ```
    In Java, both the Dev UI and the API server are bundled together.

此指令會啟動一個本機網頁伺服器，您可以在該伺服器上執行 cURL 指令或發送 API 請求，以測試您的 agent。

!!! tip "進階用法與除錯"

    For a complete reference on all available endpoints, request/response formats, and tips for debugging (including how to use the interactive API documentation), see the **ADK API Server Guide** below.

## 本機測試

本機測試包含啟動本機開發伺服器、建立工作階段，並向你的 agent 發送查詢。首先，請確保你位於正確的工作目錄下：

```console
parent_folder/
└── my_sample_agent/
    └── agent.py (or Agent.java)
```

**啟動本機開發伺服器**

接下來，請使用上方列出的指令來啟動本機開發伺服器。

輸出結果應該會類似於：

=== "Python"

    ```shell
    INFO:     Started server process [12345]
    INFO:     Waiting for application startup.
    INFO:     Application startup complete.
    INFO:     Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
    ```

=== "Java"

    ```shell
    2025-05-13T23:32:08.972-06:00  INFO 37864 --- [ebServer.main()] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 8080 (http) with context path '/'
    2025-05-13T23:32:08.980-06:00  INFO 37864 --- [ebServer.main()] com.google.adk.web.AdkWebServer          : Started AdkWebServer in 1.15 seconds (process running for 2.877)
    2025-05-13T23:32:08.981-06:00  INFO 37864 --- [ebServer.main()] com.google.adk.web.AdkWebServer          : AdkWebServer application started successfully.
    ```

您的伺服器現在已在本機運行。請確保在後續所有指令中使用正確的**_連接埠號碼_**。

**建立新工作階段**

在 API 伺服器仍然運行的情況下，請開啟新的終端機視窗或分頁，並使用以下指令與 agent 建立新的工作階段：

```shell
curl -X POST http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{"state": {"key1": "value1", "key2": 42}}'
```

讓我們來拆解一下這段程式碼的運作方式：

* `http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_123`：這會為你的 agent `my_sample_agent`（也就是 agent 資料夾的名稱）、使用者 ID（`u_123`）以及 session ID（`s_123`）建立一個新的 session。你可以將 `my_sample_agent` 替換為你自己的 agent 資料夾名稱，也可以將 `u_123` 替換為特定的使用者 ID，`s_123` 則可替換為特定的 session ID。
* `{"state": {"key1": "value1", "key2": 42}}`：這是可選的。你可以用這個參數在建立 session 時自訂 agent 的預設狀態（dict）。

如果建立成功，這應該會回傳 session 的相關資訊。輸出結果應該會類似於：

```json
{"id":"s_123","appName":"my_sample_agent","userId":"u_123","state":{"key1":"value1","key2":42},"events":[],"lastUpdateTime":1743711430.022186}
```

!!! info

    You cannot create multiple sessions with exactly the same user ID and
    session ID. If you try to, you may see a response, like:
    `{"detail":"Session already exists: s_123"}`. To fix this, you can either
    delete that session (e.g., `s_123`), or choose a different session ID.

**發送查詢**

有兩種方式可以透過 POST 向你的 agent 發送查詢，分別是 `/run` 或 `/run_sse` 路由。

* `POST http://localhost:8000/run`：將所有事件收集為一個清單，並一次性回傳該清單。適合大多數使用者（如果你不確定，建議使用這個）。
* `POST http://localhost:8000/run_sse`：以 Server-Sent-Events（伺服器推送事件）方式回傳，會串流事件物件。適合希望在事件一產生就立即收到通知的使用者。使用 `/run_sse` 時，你也可以將 `streaming` 設為 `true`，以啟用 token 級別的串流。

**使用 `/run`**

```shell
curl -X POST http://localhost:8000/run \
-H "Content-Type: application/json" \
-d '{
"app_name": "my_sample_agent",
"user_id": "u_123",
"session_id": "s_123",
"new_message": {
    "role": "user",
    "parts": [{
    "text": "Hey whats the weather in new york today"
    }]
}
}'
```

如果使用 `/run`，你將會同時看到所有事件的完整輸出，這些事件會以清單的形式顯示，內容應該類似於：

```json
[{"content":{"parts":[{"functionCall":{"id":"af-e75e946d-c02a-4aad-931e-49e4ab859838","args":{"city":"new york"},"name":"get_weather"}}],"role":"model"},"invocationId":"e-71353f1e-aea1-4821-aa4b-46874a766853","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"longRunningToolIds":[],"id":"2Btee6zW","timestamp":1743712220.385936},{"content":{"parts":[{"functionResponse":{"id":"af-e75e946d-c02a-4aad-931e-49e4ab859838","name":"get_weather","response":{"status":"success","report":"The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit)."}}}],"role":"user"},"invocationId":"e-71353f1e-aea1-4821-aa4b-46874a766853","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"PmWibL2m","timestamp":1743712221.895042},{"content":{"parts":[{"text":"OK. The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).\n"}],"role":"model"},"invocationId":"e-71353f1e-aea1-4821-aa4b-46874a766853","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"sYT42eVC","timestamp":1743712221.899018}]
```

**使用 `/run_sse`**

```shell
curl -X POST http://localhost:8000/run_sse \
-H "Content-Type: application/json" \
-d '{
"app_name": "my_sample_agent",
"user_id": "u_123",
"session_id": "s_123",
"new_message": {
    "role": "user",
    "parts": [{
    "text": "Hey whats the weather in new york today"
    }]
},
"streaming": false
}'
```

你可以將 `streaming` 設為 `true` 以啟用逐 token 串流（token-level streaming），這表示回應會以多個區塊（chunk）傳回給你，輸出結果應該會類似如下：


```shell
data: {"content":{"parts":[{"functionCall":{"id":"af-f83f8af9-f732-46b6-8cb5-7b5b73bbf13d","args":{"city":"new york"},"name":"get_weather"}}],"role":"model"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"longRunningToolIds":[],"id":"ptcjaZBa","timestamp":1743712255.313043}

data: {"content":{"parts":[{"functionResponse":{"id":"af-f83f8af9-f732-46b6-8cb5-7b5b73bbf13d","name":"get_weather","response":{"status":"success","report":"The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit)."}}}],"role":"user"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"5aocxjaq","timestamp":1743712257.387306}

data: {"content":{"parts":[{"text":"OK. The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).\n"}],"role":"model"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"rAnWGSiV","timestamp":1743712257.391317}
```
**使用`/run`或`/run_sse`，傳送帶有 base64 編碼檔案的查詢**

```shell
curl -X POST http://localhost:8000/run \
--H 'Content-Type: application/json' \
--d '{
   "appName":"my_sample_agent",
   "userId":"u_123",
   "sessionId":"s_123",
   "newMessage":{
      "role":"user",
      "parts":[
         {
            "text":"Describe this image"
         },
         {
            "inlineData":{
               "displayName":"my_image.png",
               "data":"iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpw...",
               "mimeType":"image/png"
            }
         }
      ]
   },
   "streaming":false
}'
```

!!! info

    If you are using `/run_sse`, you should see each event as soon as it becomes
    available.

## 整合

Agent Development Kit (ADK)（ADK）使用 [Callbacks](../callbacks/index.md) 來與第三方可觀測性工具整合。這些整合能夠捕捉 agent 呼叫與互動的詳細追蹤紀錄，對於理解行為、除錯問題以及評估效能都至關重要。

* [Comet Opik](https://github.com/comet-ml/opik) 是一個開源的大型語言模型 (LLM)
  可觀測性與評估平台，並且
  [原生支援 ADK](https://www.comet.com/docs/opik/tracing/integrations/adk)。

## 部署你的 agent

現在你已經驗證了 agent 在本機的運作，接下來就可以部署你的 agent 了！以下是幾種部署 agent 的方式：

* 部署到 [Agent Engine](../deploy/agent-engine.md)，這是將你的 ADK agent 部署到 Google Cloud 上 Vertex AI 受管服務的最簡單方法。
* 部署到 [Cloud Run](../deploy/cloud-run.md)，你可以完全掌控 agent 的擴展與管理，並利用 Google Cloud 的無伺服器架構。

## ADK API Server

ADK API Server 是一個預先封裝好的 [FastAPI](https://fastapi.tiangolo.com/) 網頁伺服器，透過 RESTful API 將你的 agent 對外提供服務。這是本機測試與開發的主要工具，讓你在部署前可以以程式化方式與 agent 互動。

## 啟動伺服器

要啟動伺服器，請在你的專案根目錄執行以下指令：

```shell
adk api_server
```

預設情況下，伺服器會在 `http://localhost:8000` 上運行。你會看到伺服器已啟動的確認輸出：

```shell
INFO:     Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
```

## 使用互動式 API 文件進行除錯

API 伺服器會自動產生互動式 API 文件，並透過 Swagger UI 呈現。這是一個極為有價值的工具，可用於探索各個端點、了解請求格式，並直接從瀏覽器測試你的 agent。

要存取互動式文件，請啟動 API 伺服器，然後在瀏覽器中前往 [http://localhost:8000/docs](http://localhost:8000/docs)。

你將會看到所有可用 API 端點的完整互動式清單，點擊展開即可查看參數、請求主體與回應結構的詳細資訊。你甚至可以點選「Try it out」來對正在執行的 agent 發送即時請求。

## API 端點

以下章節將詳細說明與你的 agent 互動的主要端點。

!!! note "JSON 命名慣例"
    - **請求主體** 必須使用 `snake_case` 作為欄位名稱（例如：`"app_name"`）。
    - **回應主體** 將會使用 `camelCase` 作為欄位名稱（例如：`"appName"`）。

### 工具端點

#### 列出可用 agent

回傳伺服器所發現的所有 agent 應用程式清單。

*   **方法 (Method)：** `GET`
*   **路徑 (Path)：** `/list-apps`

**範例請求**
```shell
curl -X GET http://localhost:8000/list-apps
```

**範例回應**
```json
["my_sample_agent", "another_agent"]
```

---

### 工作階段管理（Session Management）

工作階段（Session）用於儲存特定使用者與 agent 互動時的狀態與事件歷史。

#### 建立或更新工作階段

建立新的工作階段，或更新現有的工作階段。如果已存在具有指定 ID 的工作階段，其狀態將會被提供的新狀態覆蓋。

*   **方法（Method）：** `POST`
*   **路徑（Path）：** `/apps/{app_name}/users/{user_id}/sessions/{session_id}`

**請求主體（Request Body）**
```json
{
  "state": {
    "key1": "value1",
    "key2": 42
  }
}
```

**範例請求**
```shell
curl -X POST http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_abc \
  -H "Content-Type: application/json" \
  -d '{"state": {"visit_count": 5}}'
```

**範例回應**
```json
{"id":"s_abc","appName":"my_sample_agent","userId":"u_123","state":{"visit_count":5},"events":[],"lastUpdateTime":1743711430.022186}
```

#### 取得 Session

擷取特定 session 的詳細資訊，包括其目前狀態以及所有相關事件。

*   **Method：** `GET`
*   **Path：** `/apps/{app_name}/users/{user_id}/sessions/{session_id}`

**範例請求**
```shell
curl -X GET http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_abc
```

**範例回應**
```json
{"id":"s_abc","appName":"my_sample_agent","userId":"u_123","state":{"visit_count":5},"events":[...],"lastUpdateTime":1743711430.022186}
```

#### 刪除 Session

刪除一個 session 及其所有相關的資料。

*   **方法 (Method)：** `DELETE`
*   **路徑 (Path)：** `/apps/{app_name}/users/{user_id}/sessions/{session_id}`

**範例請求 (Example Request)**
```shell
curl -X DELETE http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_abc
```

**範例回應**
成功刪除時會回傳一個空的回應，並帶有 `204 No Content` 狀態碼。

---

### agent 執行

這些端點（endpoint）用於傳送新訊息給 agent 並取得回應。

#### 執行 agent（單一回應）

執行 agent，並在執行完成後，以單一 JSON 陣列回傳所有產生的事件。

*   **方法：** `POST`
*   **路徑：** `/run`

**請求主體（Request Body）**
```json
{
  "app_name": "my_sample_agent",
  "user_id": "u_123",
  "session_id": "s_abc",
  "new_message": {
    "role": "user",
    "parts": [
      { "text": "What is the capital of France?" }
    ]
  }
}
```

**範例請求**
```shell
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "my_sample_agent",
    "user_id": "u_123",
    "session_id": "s_abc",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What is the capital of France?"}]
    }
  }'
```

#### 執行 agent（串流模式）

執行 agent，並在事件產生時，透過 [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) 將事件串流回傳給用戶端。

*   **Method：** `POST`
*   **Path：** `/run_sse`

**Request Body**  
請求主體與 `/run` 相同，額外可選擇加入 `streaming` 旗標。
```json
{
  "app_name": "my_sample_agent",
  "user_id": "u_123",
  "session_id": "s_abc",
  "new_message": {
    "role": "user",
    "parts": [
      { "text": "What is the weather in New York?" }
    ]
  },
  "streaming": true
}
```
- `streaming`：（選填）設為 `true` 可啟用模型回應的權杖級串流（token-level streaming）。預設為 `false`。

**範例請求**
```shell
curl -X POST http://localhost:8000/run_sse \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "my_sample_agent",
    "user_id": "u_123",
    "session_id": "s_abc",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What is the weather in New York?"}]
    },
    "streaming": false
  }'
```
