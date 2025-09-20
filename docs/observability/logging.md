# Agent Development Kit (ADK) 的日誌紀錄

Agent Development Kit (ADK)（ADK）使用 Python 標準的 `logging` 模組，提供靈活且強大的日誌紀錄功能。了解如何設定與解讀這些日誌，對於監控 agent 行為與有效除錯至關重要。

## 日誌紀錄理念

ADK 的日誌紀錄設計理念，是在預設不過度冗長的前提下，提供詳細的診斷資訊。其設計讓應用程式開發者可以自行設定，根據開發或生產環境的需求，調整日誌輸出內容。

- **標準函式庫：** 採用標準的 `logging` 函式庫，因此任何適用於該函式庫的設定或 handler，也都適用於 ADK。
- **階層式 Logger：** Logger 會依照模組路徑（例如 `google_adk.google.adk.agents.llm_agent`）以階層式命名，讓你能夠細緻控制框架中哪些部分產生日誌。
- **使用者自訂設定：** 框架本身不會自動設定日誌紀錄。開發者需在應用程式的進入點自行設定所需的日誌紀錄設定。

## 如何設定日誌紀錄

你可以在主應用程式腳本（例如 `main.py`）中，在初始化與執行 agent 之前設定日誌紀錄。最簡單的方式是使用 `logging.basicConfig`。

### 設定範例

若要啟用詳細日誌紀錄（包含 `DEBUG` 等級的訊息），請在腳本最上方加入以下內容：

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)

# Your ADK agent code follows...
# from google.adk.agents import LlmAgent
# ...
```

### 使用 ADK 命令列介面 (CLI) 設定日誌

當你使用 Agent Development Kit (ADK)（ADK）內建的網頁或 API 伺服器來執行代理（agent）時，可以直接透過命令列輕鬆控制日誌詳細程度。`adk web`、`adk api_server` 和 `adk deploy cloud_run` 指令皆支援 `--log_level` 選項。

這提供了一種方便的方法，讓你無需修改代理（agent）原始碼即可設定日誌等級。

> **注意：** 對於 ADK 的日誌記錄器，命令列設定永遠優先於程式化設定（例如 `logging.basicConfig`）。建議在正式環境中使用 `INFO` 或 `WARNING`，僅在除錯時啟用 `DEBUG`。

**使用 `adk web` 的範例：**

若要以 `DEBUG` 等級的日誌啟動網頁伺服器，請執行：

```bash
adk web --log_level DEBUG path/to/your/agents_dir
```

`--log_level` 選項可用的日誌等級有：

- `DEBUG`
- `INFO`（預設值）
- `WARNING`
- `ERROR`
- `CRITICAL`

> 你也可以使用 `-v` 或 `--verbose` 作為 `--log_level DEBUG` 的快捷方式。
>
> ```bash
> adk web -v path/to/your/agents_dir
> ```

### 日誌等級

Agent Development Kit (ADK) 採用標準日誌等級來分類訊息。所設定的等級會決定哪些資訊會被記錄。

| 等級 | 說明 | 記錄的資訊類型  |
| :--- | :--- | :--- |
| **`DEBUG`** | **除錯時至關重要。** 最詳細的等級，用於細緻的診斷資訊。 | <ul><li>**完整大型語言模型 (LLM) 提示：** 發送給大型語言模型 (LLM) 的完整請求，包括系統指令、歷史紀錄與工具。</li><li>來自服務的詳細 API 回應。</li><li>內部狀態轉換與變數值。</li></ul> |
| **`INFO`** | 關於 agent 生命週期的一般資訊。 | <ul><li>agent 初始化與啟動。</li><li>工作階段（session）建立與刪除事件。</li><li>工具執行，包括其名稱與參數。</li></ul> |
| **`WARNING`** | 表示潛在問題或已棄用功能的使用。agent 仍可繼續運作，但可能需要注意。 | <ul><li>已棄用方法或參數的使用。</li><li>系統已復原的非關鍵性錯誤。</li></ul> |
| **`ERROR`** | 嚴重錯誤，導致操作無法完成。 | <ul><li>對外部服務（如 LLM、Session Service）的 API 呼叫失敗。</li><li>agent 執行期間未處理的例外。</li><li>組態錯誤。</li></ul> |

> **注意：** 建議在生產環境中使用 `INFO` 或 `WARNING`。僅在積極排查問題時啟用 `DEBUG`，因為 `DEBUG` 日誌可能非常冗長，且可能包含敏感資訊。

## 讀取與理解日誌

`basicConfig` 範例中的 `format` 字串決定了每則日誌訊息的結構。

以下是一則日誌範例：

```text
2025-07-08 11:22:33,456 - DEBUG - google_adk.google.adk.models.google_llm - LLM Request: contents { ... }
```

| 日誌區段                        | 格式指定符      | 意義                                             |
| ------------------------------- | --------------- | ------------------------------------------------ |
| `2025-07-08 11:22:33,456`       | `%(asctime)s`    | 時間戳記                                         |
| `DEBUG`                         | `%(levelname)s`  | 嚴重性等級                                       |
| `google_adk.models.google_llm`  | `%(name)s`       | Logger 名稱（產生日誌的模組）                     |
| `LLM Request: contents { ... }` | `%(message)s`    | 實際日誌訊息                                     |

透過查看 Logger 名稱，你可以立即定位日誌的來源，並了解其在 agent 架構中的上下文。

## 使用日誌進行除錯：實務範例

**情境：** 你的 agent 沒有產生預期的輸出，你懷疑傳送給大型語言模型 (LLM) 的提示（prompt）有誤或缺少資訊。

**步驟：**

1.  **啟用 DEBUG 日誌紀錄：** 在你的 `main.py` 中，將日誌等級設定為 `DEBUG`，如設定範例所示。

    ```python
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
    )
    ```

2.  **執行您的 agent：** 如同平常一樣執行您的 agent 任務。

3.  **檢查日誌：** 在主控台輸出中尋找來自 `google.adk.models.google_llm` logger 且以 `LLM Request:` 開頭的訊息。

    ```log
    ...
    2025-07-10 15:26:13,778 - DEBUG - google_adk.google.adk.models.google_llm - Sending out request, model: gemini-2.0-flash, backend: GoogleLLMVariant.GEMINI_API, stream: False
    2025-07-10 15:26:13,778 - DEBUG - google_adk.google.adk.models.google_llm - 
    LLM Request:
    -----------------------------------------------------------
    System Instruction:

          You roll dice and answer questions about the outcome of the dice rolls.
          You can roll dice of different sizes.
          You can use multiple tools in parallel by calling functions in parallel(in one request and in one round).
          It is ok to discuss previous dice roles, and comment on the dice rolls.
          When you are asked to roll a die, you must call the roll_die tool with the number of sides. Be sure to pass in an integer. Do not pass in a string.
          You should never roll a die on your own.
          When checking prime numbers, call the check_prime tool with a list of integers. Be sure to pass in a list of integers. You should never pass in a string.
          You should not check prime numbers before calling the tool.
          When you are asked to roll a die and check prime numbers, you should always make the following two function calls:
          1. You should first call the roll_die tool to get a roll. Wait for the function response before calling the check_prime tool.
          2. After you get the function response from roll_die tool, you should call the check_prime tool with the roll_die result.
            2.1 If user asks you to check primes based on previous rolls, make sure you include the previous rolls in the list.
          3. When you respond, you must include the roll_die result from step 1.
          You should always perform the previous 3 steps when asking for a roll and checking prime numbers.
          You should not rely on the previous history on prime results.
        

    You are an agent. Your internal name is "hello_world_agent".

    The description about you is "hello world agent that can roll a dice of 8 sides and check prime numbers."
    -----------------------------------------------------------
    Contents:
    {"parts":[{"text":"Roll a 6 sided dice"}],"role":"user"}
    {"parts":[{"function_call":{"args":{"sides":6},"name":"roll_die"}}],"role":"model"}
    {"parts":[{"function_response":{"name":"roll_die","response":{"result":2}}}],"role":"user"}
    -----------------------------------------------------------
    Functions:
    roll_die: {'sides': {'type': <Type.INTEGER: 'INTEGER'>}} 
    check_prime: {'nums': {'items': {'type': <Type.INTEGER: 'INTEGER'>}, 'type': <Type.ARRAY: 'ARRAY'>}} 
    -----------------------------------------------------------

    2025-07-10 15:26:13,779 - INFO - google_genai.models - AFC is enabled with max remote calls: 10.
    2025-07-10 15:26:14,309 - INFO - google_adk.google.adk.models.google_llm - 
    LLM Response:
    -----------------------------------------------------------
    Text:
    I have rolled a 6 sided die, and the result is 2.
    ...
    ```

4.  **分析提示（Prompt）：** 透過檢查已記錄請求中的 `System Instruction`、`contents`、`functions` 區段，你可以驗證：
    -   系統指令是否正確？
    -   對話歷史（`user` 和 `model` 輪次）是否準確？
    -   是否包含最新的使用者查詢？
    -   是否正確提供了 tools 給模型？
    -   模型是否正確呼叫了 tools？
    -   模型回應所需的時間為何？

這些詳細的輸出讓你能直接從日誌檔案中診斷各種問題，從提示工程（prompt engineering）錯誤到 tools 定義上的問題都能一目了然。
