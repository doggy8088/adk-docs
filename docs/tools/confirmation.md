# 取得 ADK 工具的操作確認

有些代理流程（agent workflow）在決策、驗證、安全性或一般監督時需要進行確認。在這些情境下，你會希望在流程繼續執行前，先從人類或監督系統取得回應。Agent Development Kit (ADK) 的 *工具確認*（Tool Confirmation）功能，允許 ADK 工具在執行時暫停，並與使用者或其他系統互動，以取得確認或在繼續前收集結構化資料。你可以透過以下方式，將工具確認功能應用於 ADK 工具：

-   **[布林值確認](#boolean-confirmation)：** 你可以將 `require_confirmation` 參數設定於 FunctionTool。這個選項會讓工具暫停，等待使用者給予是或否的確認回應。
-   **[進階確認](#advanced-confirmation)：** 若情境需要結構化資料回應，你可以設定 `FunctionTool`，並提供文字提示來說明確認內容及預期回應。

!!! example "實驗性功能"
    工具確認功能目前為實驗性功能，且存在一些
    [已知限制](#known-limitations)。
    歡迎提供你的
    [回饋](https://github.com/google/adk-python/issues/new?template=feature_request.md&labels=tool%20confirmation)！

你可以設定請求如何傳達給使用者，系統也可以透過 Agent Development Kit (ADK) 伺服器的 REST API，使用[遠端回應](#remote-response)。當你在 ADK 網頁使用者介面中使用確認功能時，代理流程會顯示對話框，請求使用者輸入，如下圖（圖 1）所示：

![工具確認的預設使用者介面截圖](/adk-docs/assets/confirmation-ui.png)

**圖 1.** 使用進階工具回應實作時，請求確認回應的對話框範例。

下列章節將說明如何在不同確認情境下使用此功能。完整程式碼範例請參考
[human_tool_confirmation](https://github.com/google/adk-python/blob/fc90ce968f114f84b14829f8117797a4c256d710/contributing/samples/human_tool_confirmation/agent.py)
範例。你也可以用其他方式將人類輸入納入代理流程，詳情請參閱
[Human-in-the-loop](/adk-docs/agents/multi-agents/#human-in-the-loop-pattern)
代理模式。

## 布林值確認 {#boolean-confirmation}

當你的工具僅需從使用者取得簡單的 `yes` 或 `no` 回應時，可以使用 `FunctionTool` 類別作為包裝器，新增確認步驟。例如，若你有一個名為 `reimburse` 的工具，可以將其包裝在 `FunctionTool` 類別中，並將 `require_confirmation` 參數設為 `True`，如下例所示：

```
# From agent.py
root_agent = Agent(
   ...
   tools=[
        # Set require_confirmation to True to require user confirmation
        # for the tool call.
        FunctionTool(reimburse, require_confirmation=True),
    ],
...
```

這種實作方法所需的程式碼極少，但僅限於用於用戶或確認系統的簡單核准。若需此方法的完整範例，請參考
[human_tool_confirmation](https://github.com/google/adk-python/blob/fc90ce968f114f84b14829f8117797a4c256d710/contributing/samples/human_tool_confirmation/agent.py)
程式碼範例。

### 需要確認的函式

你可以透過將其輸入值替換為一個回傳布林值的函式，來修改 `require_confirmation` 回應的行為。以下範例展示了一個用於判斷是否需要確認的函式：

```
async def confirmation_threshold(
    amount: int, tool_context: ToolContext
) -> bool:
  """Returns true if the amount is greater than 1000."""
  return amount > 1000
```

此函式接著可以設為 `require_confirmation` 參數的值：

```
root_agent = Agent(
   ...
   tools=[
        # Set require_confirmation to True to require user confirmation
        FunctionTool(reimburse, require_confirmation=confirmation_threshold),
    ],
...
```

完整的實作範例請參見
[human_tool_confirmation](https://github.com/google/adk-python/blob/fc90ce968f114f84b14829f8117797a4c256d710/contributing/samples/human_tool_confirmation/agent.py)
程式碼範例。

## 進階確認 {#advanced-confirmation}

當工具確認（tool confirmation）需要提供更多細節給使用者，或需要更複雜的回應時，請使用 tool_confirmation 的實作方式。這種方式會擴充 `ToolContext` 物件，加入用於描述請求內容的文字說明，並允許更複雜的回應資料。以這種方式實作工具確認時，你可以暫停工具的執行，請求特定資訊，然後再以提供的資料繼續執行工具。

此確認流程包含兩個階段：請求階段，系統會組合並發送輸入請求給人類回應；回應階段，系統接收並處理回傳的資料。

### 確認定義

當你要建立一個具有進階確認功能的工具時，請建立一個包含 ToolContext 物件的函式。接著，使用 tool_confirmation 物件，搭配 `tool_context.request_confirmation()` 方法和 `hint`、`payload` 參數來定義確認內容。這些屬性的用途如下：

-   `hint`：說明需要使用者提供哪些資訊的描述性訊息。
-   `payload`：你預期回傳的資料結構。這個資料型態為 Any，且必須能序列化為 JSON 格式的字串，例如 dictionary 或 pydantic model。

以下程式碼展示了一個處理員工請假申請的工具之實作範例：

```
def request_time_off(days: int, tool_context: ToolContext):
  """Request day off for the employee."""
  ...
  tool_confirmation = tool_context.tool_confirmation
  if not tool_confirmation:
    tool_context.request_confirmation(
        hint=(
            'Please approve or reject the tool call request_time_off() by'
            ' responding with a FunctionResponse with an expected'
            ' ToolConfirmation payload.'
        ),
        payload={
            'approved_days': 0,
        },
    )
    # Return intermediate status indicating that the tool is waiting for
    # a confirmation response:
    return {'status': 'Manager approval is required.'}

  approved_days = tool_confirmation.payload['approved_days']
  approved_days = min(approved_days, days)
  if approved_days == 0:
    return {'status': 'The time off request is rejected.', 'approved_days': 0}
  return {
      'status': 'ok',
      'approved_days': approved_days,
  }
```

如需此方法的完整範例，請參閱
[human_tool_confirmation](https://github.com/google/adk-python/blob/fc90ce968f114f84b14829f8117797a4c256d710/contributing/samples/human_tool_confirmation/agent.py)
程式碼範例。請注意，在取得確認時，agent 工作流程工具的執行會暫停。收到確認後，您可以在 `tool_confirmation.payload` 物件中存取
確認回應，然後繼續執行工作流程。

## 透過 REST API 進行遠端確認 {#remote-response}

如果沒有用戶介面可供人工確認 agent 工作流程，您可以透過命令列介面 (CLI) 或其他管道（如電子郵件或聊天應用程式）來處理確認。為了確認工具呼叫，使用者或呼叫應用程式需要傳送一個 `FunctionResponse` 事件，並附上工具確認資料。

您可以將請求發送到 Agent Development Kit (ADK) API 伺服器的 `/run` 或 `/run_sse` 端點，或直接發送到 ADK runner。以下範例使用 `curl` 指令，將確認資訊傳送到 `/run_sse` 端點：

```
 curl -X POST http://localhost:8000/run_sse \
 -H "Content-Type: application/json" \
 -d '{
    "app_name": "human_tool_confirmation",
    "user_id": "user",
    "session_id": "7828f575-2402-489f-8079-74ea95b6a300",
    "new_message": {
        "parts": [
            {
                "function_response": {
                    "id": "adk-13b84a8c-c95c-4d66-b006-d72b30447e35",
                    "name": "adk_request_confirmation",
                    "response": {
                        "confirmed": true
                    }
                }
            }
        ],
        "role": "user"
    }
}'
```

基於 REST 的確認回應必須符合以下要求：

-   `function_response` 中的 `id` 應與 `RequestConfirmation` `FunctionCall` 事件中的 `function_call_id` 相符。
-   `name` 應為 `adk_request_confirmation`。
-   `response` 物件包含確認狀態以及工具所需的任何額外負載資料。

## 已知限制 {#known-limitations}

工具確認功能有以下限制：

-   [DatabaseSessionService](/adk-docs/api-reference/python/google-adk.html#google.adk.sessions.DatabaseSessionService)
    不支援此功能。
-   [VertexAiSessionService](/adk-docs/api-reference/python/google-adk.html#google.adk.sessions.VertexAiSessionService)
    不支援此功能。

## 下一步

如需更多關於為代理流程建立 ADK 工具的資訊，請參閱 [Function tools](/adk-docs/tools/function-tools/)。