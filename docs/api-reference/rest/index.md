# REST API 參考

本頁提供由 Agent Development Kit (ADK)（ADK）web 伺服器所提供的 REST API 參考文件。  
如需實際使用 ADK REST API 的詳細說明，請參閱 [Testing](../../get-started/testing.md)。

!!! tip
    你可以在執行中的 ADK web 伺服器上，透過瀏覽 `/docs` 位置來檢視最新的 API 參考，例如：`http://localhost:8000/docs`

## 端點（Endpoints）

### `/run`

此端點會執行一次 agent 執行。它接受一個包含執行細節的 JSON 載荷，並回傳執行期間產生的事件（event）清單。

**Request Body**

請求主體應為一個 JSON 物件，包含以下欄位：

- `app_name`（string，必填）：要執行的 agent 名稱。
- `user_id`（string，必填）：使用者 ID。
- `session_id`（string，必填）：session ID。
- `new_message`（Content，必填）：要傳送給 agent 的新訊息。詳情請參閱 [Content](#content-object) 章節。
- `streaming`（boolean，選填）：是否使用串流。預設為 `false`。
- `state_delta`（object，選填）：在執行前要套用的狀態差異（state delta）。

**Response Body**

回應主體為一個 JSON 陣列，內容為 [Event](#event-object) 物件。

### `/run_sse`

此端點會使用 Server Sent Events（SSE）進行串流回應，執行一次 agent 執行。它接受與 `/run` 端點相同的 JSON 載荷。

**Request Body**

請求主體與 `/run` 端點相同。

**Response Body**

回應為一串 Server Sent Events。每個事件都是一個代表 [Event](#event-object) 的 JSON 物件。

## 物件（Objects）

### `Content` 物件

`Content` 物件代表訊息的內容，其結構如下：

```json
{
  "parts": [
    {
      "text": "..."
    }
  ],
  "role": "..."
}
```

- `parts`：部分（part）清單。每個部分可以是文字或函式呼叫。
- `role`：訊息作者的角色（例如："user"、"model"）。

### `Event` 物件

`Event` 物件代表 agent 執行期間發生的一個事件（event）。它具有複雜的結構，包含許多選填欄位。最重要的欄位如下：

- `id`：事件的 ID。
- `timestamp`：事件的時間戳記。
- `author`：事件的作者。
- `content`：事件的內容。
