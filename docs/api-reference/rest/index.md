# REST API 參考

本頁提供由 Agent Development Kit (ADK) 網頁伺服器所提供的 REST API 參考說明。  
如需實際使用 ADK REST API 的詳細資訊，請參閱  
[Testing](../../get-started/testing.md)。 

!!! tip
    你可以在執行中的 Agent Development Kit (ADK) web 伺服器上，透過瀏覽 `/docs` 位置來檢視最新的 API 參考，例如：`http://localhost:8000/docs`

## 端點

### `/run`

此 API 端點會執行一次 agent run。它接受一個包含執行細節的 JSON 載荷，並回傳在執行期間產生的事件（event）列表。

**Request Body**

請求主體應為一個 JSON 物件，包含以下欄位：

- `app_name`（string，必填）：要執行的 agent 名稱。
- `user_id`（string，必填）：使用者的 ID。
- `session_id`（string，必填）：session 的 ID。
- `new_message`（Content，必填）：要傳送給 agent 的新訊息。詳情請參閱 [Content](#content-物件) 章節。
- `streaming`（boolean，選填）：是否使用串流。預設為 `false`。
- `state_delta`（object，選填）：在執行前要套用的 state 差異（delta）。

**Response Body**

回應主體為一個 [Event](#event-物件) 物件的 JSON 陣列。

### `/run_sse`

此 API 端點會使用 Server Sent Events (SSE) 來串流回應，執行一次 agent run。它接受與 `/run` 端點相同的 JSON 載荷。

**Request Body**

請求主體與 `/run` 端點相同。

**Response Body**

回應是一個 Server Sent Events (SSE) 串流。每個事件都是一個代表 [Event](#event-物件) 的 JSON 物件。

## 物件

### `Content` 物件

`Content` 物件代表一則訊息的內容。其結構如下：

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

- `parts`：部分（part）的清單。每個部分可以是文字或函式呼叫（function call）。
- `role`：訊息作者的角色（例如："user"、"model"）。

### `Event` 物件

`Event` 物件代表 agent 執行期間發生的一個事件（event）。它具有複雜的結構，包含許多可選欄位。最重要的欄位如下：

- `id`：事件的 ID。
- `timestamp`：事件的時間戳記（timestamp）。
- `author`：事件的作者。
- `content`：事件的內容。
