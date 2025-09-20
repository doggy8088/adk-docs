# 測試你的 agent

在部署你的 agent 之前，應該先進行測試，以確保其運作符合預期。最簡單的測試方式是在開發環境中使用 ADK API 伺服器。

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

!!! tip "Advanced Usage and Debugging"

    如需完整的所有可用 API 端點、請求/回應格式，以及除錯技巧（包含如何使用互動式 API 文件說明），請參閱下方的 **ADK API Server Guide**。

## 本機測試

本機測試包含啟動本機開發伺服器、建立 session，並向你的 agent 發送查詢。首先，請確保你已在正確的工作目錄下：

```console
parent_folder/
└── my_sample_agent/
    └── agent.py (or Agent.java)
```

**啟動本機開發伺服器**

接下來，請使用上方列出的指令來啟動本機開發伺服器。

輸出結果應類似於：

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

您的伺服器現在已在本機運行。請確保在後續所有指令中使用正確的**_埠號_**。

**建立新 session**

在 API 伺服器持續運行的情況下，請開啟一個新的終端機視窗或分頁，並使用以下指令與 agent 建立新的 session：

```shell
curl -X POST http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{"state": {"key1": "value1", "key2": 42}}'
```

讓我們來拆解一下這段程式碼的運作方式：

* `http://localhost:8000/apps/my_sample_agent/users/u_123/sessions/s_123`：這會為你的 agent `my_sample_agent`（也就是 agent 資料夾的名稱）、使用者 ID（`u_123`）以及 session ID（`s_123`）建立一個新的 session。你可以將 `my_sample_agent` 替換成你的 agent 資料夾名稱，也可以將 `u_123` 替換成特定的使用者 ID，`s_123` 則可以替換成特定的 session ID。
* `{"state": {"key1": "value1", "key2": 42}}`：這是選填項目。你可以在建立 session 時，透過這個參數自訂 agent 的預設狀態（dict）。

如果建立成功，這應該會回傳 session 的相關資訊。輸出結果應該會類似如下：

```json
{"id":"s_123","appName":"my_sample_agent","userId":"u_123","state":{"key1":"value1","key2":42},"events":[],"lastUpdateTime":1743711430.022186}
```

!!! info

    你不能以完全相同的 user ID 和 session ID 建立多個 session。如果你嘗試這麼做，可能會看到像這樣的回應：
    `{"detail":"Session already exists: s_123"}`。要解決這個問題，你可以刪除該 session（例如：`s_123`），或選擇不同的 session ID。

**發送查詢**

你可以透過 POST 請求，使用 `/run` 或 `/run_sse` 路由向你的 agent 發送查詢，有兩種方式：

* `POST http://localhost:8000/run`：將所有事件收集為一個列表，並一次性回傳該列表。適合大多數使用者（如果你不確定，建議使用這個）。
* `POST http://localhost:8000/run_sse`：以 Server-Sent-Events（SSE）的方式回傳，也就是事件物件的串流。適合希望在事件可用時立即收到通知的使用者。使用 `/run_sse` 時，你也可以將 `streaming` 設為 `true`，以啟用逐字元串流（token-level streaming）。

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

如果使用 `/run`，你會同時看到所有事件的完整輸出，呈現為一個清單，顯示內容應該類似於：

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

你可以將 `streaming` 設為 `true` 以啟用逐字元串流 (token-level streaming)，這表示回應會以多個區塊（chunk）傳回給你，輸出應該會類似如下所示：


```shell
data: {"content":{"parts":[{"functionCall":{"id":"af-f83f8af9-f732-46b6-8cb5-7b5b73bbf13d","args":{"city":"new york"},"name":"get_weather"}}],"role":"model"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"longRunningToolIds":[],"id":"ptcjaZBa","timestamp":1743712255.313043}

data: {"content":{"parts":[{"functionResponse":{"id":"af-f83f8af9-f732-46b6-8cb5-7b5b73bbf13d","name":"get_weather","response":{"status":"success","report":"The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit)."}}}],"role":"user"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"5aocxjaq","timestamp":1743712257.387306}

data: {"content":{"parts":[{"text":"OK. The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).\n"}],"role":"model"},"invocationId":"e-3f6d7765-5287-419e-9991-5fffa1a75565","author":"weather_time_agent","actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"id":"rAnWGSiV","timestamp":1743712257.391317}
```
**使用 `/run` 或 `/run_sse` 傳送包含 base64 編碼檔案的查詢**

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

    如果你正在使用 `/run_sse`，你應該能在每個事件一旦可用時立即看到它。

## 整合

Agent Development Kit (ADK) 使用 [Callbacks](../callbacks/index.md) 來與第三方可觀測性工具整合。這些整合能夠捕捉 agent 呼叫與互動的詳細追蹤紀錄，這對於理解 agent 行為、除錯問題以及評估效能都至關重要。

* [Comet Opik](https://github.com/comet-ml/opik) 是一個開源的大型語言模型 (LLM) 可觀測性與評估平台，並且
  [原生支援 ADK](https://www.comet.com/docs/opik/tracing/integrations/adk)。

## 部署你的 agent

現在你已經驗證了 agent 在本機的運作，接下來就可以準備部署你的 agent 了！以下是幾種部署 agent 的方式：

* 部署到 [Agent Engine](../deploy/agent-engine.md)，這是將你的 ADK agent 部署到 Google Cloud 上 Vertex AI 受管服務的最簡單方式。
* 部署到 [Cloud Run](../deploy/cloud-run.md)，讓你能完全掌控 agent 的擴展與管理，並利用 Google Cloud 的無伺服器架構。

## ADK API 伺服器

ADK API 伺服器是一個預先封裝好的 [FastAPI](https://fastapi.tiangolo.com/) 網頁伺服器，能透過 RESTful API 將你的 agent 對外提供服務。這是本機測試與開發的主要工具，讓你在部署前可以以程式化方式與 agent 互動。

## 執行伺服器

要啟動伺服器，請在你的專案根目錄下執行以下指令：

```shell
adk api_server
```

預設情況下，伺服器會在 `http://localhost:8000` 上運行。你會看到伺服器已啟動的確認輸出：

```shell
INFO:     Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
```

## 使用互動式 API 文件進行除錯

API 伺服器會自動產生互動式 API 文件，採用 Swagger UI。這是一個極為寶貴的工具，可用於探索 API 端點、了解請求格式，並可直接從瀏覽器測試你的 agent。

要存取互動式文件，請啟動 API 伺服器，然後在瀏覽器中前往 [http://localhost:8000/docs](http://localhost:8000/docs)。

你將會看到所有可用 API 端點的完整互動清單，點開後可查看參數、請求主體（request body）以及回應 schema 的詳細資訊。你甚至可以點選「Try it out」來對正在執行的 agent 發送即時請求。

## API 端點

以下章節將詳細說明與你的 agent 互動的主要 API 端點。

!!! note "JSON Naming Convention"
    - **Request bodies** 必須使用 `snake_case` 作為欄位名稱（例如：`"app_name"`）。
    - **Response bodies** 會使用 `camelCase` 作為欄位名稱（例如：`"appName"`）。

### 公用端點（Utility Endpoints）

#### 列出可用的 agent

回傳由伺服器發現的所有 agent 應用程式清單。

*   **Method：** `GET`
*   **Path：** `/list-apps`

**範例請求**
```shell
curl -X GET http://localhost:8000/list-apps
```

**範例回應**
```json
["my_sample_agent", "another_agent"]
```

---

### Session 管理

Session 用於儲存特定使用者與 agent 互動時的 state 及事件歷史紀錄。

#### 建立或更新 Session

建立新的 Session，或更新現有的 Session。如果已存在具有指定 ID 的 Session，其 state 會被提供的新 state 覆蓋。

*   **Method:** `POST`
*   **Path:** `/apps/{app_name}/users/{user_id}/sessions/{session_id}`

**Request Body**
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

擷取特定 Session 的詳細資訊，包括其目前的 session state 以及所有相關的 Event。

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

刪除一個 Session 及其所有相關的資料。

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

這些 API 端點用於向 agent 發送新訊息並獲取回應。

#### 執行 agent（單次回應）

執行 agent，並在運行完成後，以單一 JSON 陣列回傳所有產生的事件。

*   **方法：** `POST`
*   **路徑：** `/run`

**請求內容（Request Body）**
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

執行 agent，並在事件產生時，透過 [Server Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) 將事件串流回傳給用戶端。

*   **Method：** `POST`
*   **Path：** `/run_sse`

**Request Body**  
請求主體與 `/run` 相同，另外可選擇加入 `streaming` 旗標。
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
- `streaming`：（選填）設為 `true` 可啟用模型回應的逐字元串流 (token-level streaming)。預設為 `false`。

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
