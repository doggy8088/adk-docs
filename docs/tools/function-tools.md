# Function tools

當內建的 Agent Development Kit (ADK) 工具無法滿足你的需求時，你可以自行建立自訂的 *function tools*（函式工具）。建構 function tools 讓你能夠打造專屬的功能，例如連接專有資料庫或實作獨特的演算法。
舉例來說，一個 function tool `myfinancetool`，可能是一個計算特定財務指標的函式。Agent Development Kit (ADK) 也支援長時間執行的函式，因此如果該計算需要較長時間，agent 仍可繼續處理其他任務。

Agent Development Kit (ADK) 提供多種建立 function tools 的方式，適用於不同複雜度與控制需求：

*  [Function Tools](#function-tool)
*  [Long Running Function Tools](#long-run-tool)
*  [Agents-as-a-Tool](#agent-tool)

## Function Tools {#function-tool}

將 Python 函式轉換為工具，是將自訂邏輯整合進 agent 的簡單方法。當你將函式指派給 agent 的 `tools` 清單時，框架會自動將其包裝為 `FunctionTool`。

### 運作方式

Agent Development Kit (ADK) 框架會自動檢查你的 Python 函式簽章，包括名稱、docstring、參數、型別提示以及預設值，並據此產生 schema。這個 schema 讓大型語言模型 (LLM) 能夠理解該工具的用途、使用時機，以及所需的參數。

### 定義函式簽章

良好定義的函式簽章對於大型語言模型 (LLM) 正確使用你的工具至關重要。

#### 參數

你可以定義帶有必要參數、選用參數與可變參數的函式。以下說明各種參數的處理方式：

##### 必要參數
如果參數有型別提示但**沒有預設值**，則視為**必要參數**。大型語言模型 (LLM) 在呼叫該工具時，必須為此參數提供值。

???+ "範例：必要參數"
    === "Python"
        ```python
        def get_weather(city: str, unit: str):
            """
            Retrieves the weather for a city in the specified unit.

            Args:
                city (str): The city name.
                unit (str): The temperature unit, either 'Celsius' or 'Fahrenheit'.
            """
            # ... function logic ...
            return {"status": "success", "report": f"Weather for {city} is sunny."}
        ```
    在此範例中，`city` 和 `unit` 都是必填參數。如果大型語言模型 (LLM) 嘗試在缺少其中一個的情況下呼叫 `get_weather`，Agent Development Kit (ADK) 會回傳錯誤給 LLM，提示其修正呼叫內容。

##### 具有預設值的選用參數
如果你為參數提供**預設值**，該參數就被視為**選用**。這是 Python 定義選用參數的標準方式。Agent Development Kit (ADK) 會正確解析這些參數，並且不會將它們列在傳送給 LLM 的工具 schema 的 `required` 欄位中。

???+ "範例：具有預設值的選用參數"
    === "Python"
        ```python
        def search_flights(destination: str, departure_date: str, flexible_days: int = 0):
            """
            Searches for flights.

            Args:
                destination (str): The destination city.
                departure_date (str): The desired departure date.
                flexible_days (int, optional): Number of flexible days for the search. Defaults to 0.
            """
            # ... function logic ...
            if flexible_days > 0:
                return {"status": "success", "report": f"Found flexible flights to {destination}."}
            return {"status": "success", "report": f"Found flights to {destination} on {departure_date}."}
        ```
    這裡的 `flexible_days` 是選填的。大型語言模型 (LLM) 可以選擇提供它，但不是必須的。

##### 使用 `typing.Optional` 的選填參數
你也可以使用 `typing.Optional[SomeType]` 或 Python 3.10+ 的 `| None` 語法來標記參數為選填。這表示該參數可以是 `None`。當與預設值 `None` 結合時，會如同標準的選填參數運作。

???+ "範例：`typing.Optional`"
    === "Python"
        ```python
        from typing import Optional

        def create_user_profile(username: str, bio: Optional[str] = None):
            """
            Creates a new user profile.

            Args:
                username (str): The user's unique username.
                bio (str, optional): A short biography for the user. Defaults to None.
            """
            # ... function logic ...
            if bio:
                return {"status": "success", "message": f"Profile for {username} created with a bio."}
            return {"status": "success", "message": f"Profile for {username} created."}
        ```

##### 可變參數（`*args` 與 `**kwargs`）

雖然你可以在函式簽名中加入 `*args`（可變位置參數）與 `**kwargs`（可變關鍵字參數）以用於其他目的，但在 Agent Development Kit (ADK) 框架為大型語言模型 (LLM) 產生工具 schema 時，這些參數**會被忽略**。LLM 不會知道這些參數的存在，也無法傳遞參數給它們。因此，建議你對所有期望由 LLM 傳入的資料，都明確定義參數。

#### 回傳型態

Function Tool（函式工具）建議的回傳型態是在 Python 中使用**dictionary（字典）**，或在 Java 中使用**Map**。這樣可以用鍵值對的方式結構化回應，為 LLM 提供更多上下文與清晰度。如果你的函式回傳的型態不是字典，框架會自動將其包裝成一個僅有單一鍵 **"result"** 的字典。

請盡量讓你的回傳值具有描述性。*例如，*與其回傳數字型的錯誤代碼，不如回傳一個包含 "error_message" 鍵且帶有人類可讀說明的字典。**請記住，理解結果的是 LLM，而不是一段程式碼。**最佳實踐是，在回傳的字典中加入 "status" 鍵，用來標示整體執行結果（例如 "success"、"error"、"pending"），讓 LLM 能夠明確判斷操作狀態。

#### Docstring

你的函式 docstring 會作為工具的**描述**，並傳送給 LLM。因此，一份撰寫良好且詳盡的 docstring 對於 LLM 有效理解如何使用該工具至關重要。請清楚說明函式的用途、各參數的意義，以及預期的回傳值。

### 工具間資料傳遞

當 agent 依序呼叫多個工具時，你可能需要將資料從一個工具傳遞到另一個工具。建議的做法是使用 session state 中的 `temp:` 前綴。

一個工具可以將資料寫入 `temp:` 變數，後續的工具則可以讀取這個變數。這些資料僅在目前的呼叫過程中有效，之後會被清除。

!!! note "Shared Invocation Context"
    在單一 agent 回合（agent turn）內的所有工具呼叫（tool calls）都會共用相同的 `InvocationContext`。這也表示它們會共用相同的暫存（`temp:`）狀態，這就是資料能夠在它們之間傳遞的方式。

### 範例

??? "範例"

    === "Python"
    
        This tool is a python function which obtains the Stock price of a given Stock ticker/ symbol.
    
        <u>Note</u>: You need to `pip install yfinance` library before using this tool.
    
        ```py
        --8<-- "examples/python/snippets/tools/function-tools/func_tool.py"
        ```
    
        The return value from this tool will be wrapped into a dictionary.
    
        ```json
        {"result": "$123"}
        ```
    
    === "Java"
    
        This tool retrieves the mocked value of a stock price.
    
        ```java
        --8<-- "examples/java/snippets/src/main/java/tools/StockPriceAgent.java:full_code"
        ```
    
        The return value from this tool will be wrapped into a Map<String, Object>.
    
        ```json
        For input `GOOG`: {"symbol": "GOOG", "price": "1.0"}
        ```

### 最佳實踐

雖然你在定義工具函式時擁有相當大的彈性，但請記住，簡單性有助於提升大型語言模型 (LLM) 的可用性。建議遵循以下指引：

* **參數越少越好：** 盡量減少參數數量，以降低複雜度。  
* **簡單資料型別：** 優先使用像是 `str` 和 `int` 這類的原始資料型別，盡量避免自訂類別。  
* **具意義的命名：** 函式名稱與參數名稱對大型語言模型 (LLM) 如何解讀與運用該工具有重大影響。請選擇能清楚反映函式用途及輸入意義的名稱，避免使用像 `do_stuff()` 或 `beAgent()` 這類泛用名稱。
* **為平行執行而設計：** 當多個工具同時運行時，透過設計為非同步操作來提升工具呼叫 (tool calls) 的效能。關於如何啟用工具的平行執行，請參閱
[Increase tool performance with parallel execution](/adk-docs/tools/performance/)。

## 長時間運行的 Function Tools {#long-run-tool}

此工具設計用於協助你啟動並管理需要在 agent 工作流程之外執行、且需大量處理時間的任務，同時不會阻塞 agent 的執行。這個工具是 `FunctionTool` 的子類別。

當你使用 `LongRunningFunctionTool` 時，函式可以啟動長時間運行的操作，並可選擇性地回傳**初始結果**，例如長時間運行操作的 ID。一旦長時間運行的 function tool 被呼叫，agent runner 會暫停 agent 的運行，並讓 agent client 決定是否繼續或等待長時間運行的操作完成。agent client 可以查詢長時間運行操作的進度，並回傳中間或最終回應。agent 隨後可以繼續執行其他任務。舉例來說，在 human-in-the-loop（人類參與）情境下，agent 需要獲得人類批准後才能繼續執行任務。

!!! warning "Warning: Execution handling"
    長時間執行函式工具（Long Running Function Tools）旨在協助你在 agent 工作流程中啟動並*管理*長時間執行的任務，但***不會實際執行***這些長時間任務。對於需要花費大量時間才能完成的任務，建議你實作一個獨立的伺服器來處理該任務。

!!! tip "Tip: Parallel execution"
    根據你所建構的工具類型，設計為非同步（asynchronous）操作通常會比建立長時間運行的工具來得更好。欲了解更多資訊，請參閱[利用平行執行提升工具效能](/adk-docs/tools/performance/)。

### 運作方式說明

在 Python 中，你可以使用 `LongRunningFunctionTool` 將函式包裝起來。在 Java 中，則是將 Method 名稱傳遞給 `LongRunningFunctionTool.create()`。

1. **啟動階段：**當大型語言模型 (LLM) 呼叫該工具時，你的函式會啟動長時間運行的操作。

2. **初始回報：**你的函式可以選擇性地回傳初步結果（例如長時間運行操作的 id）。Agent Development Kit (ADK) 框架會將這個結果包裝在 `FunctionResponse` 中回傳給 LLM。這讓 LLM 可以通知使用者（例如狀態、完成百分比、訊息等）。隨後，agent 執行會結束或暫停。

3. **繼續或等待：**每次 agent 執行結束後，agent client 可以查詢長時間運行操作的進度，並決定是要以中間回應（用於更新進度）繼續 agent 執行，還是等待直到取得最終回應。agent client 應將中間或最終回應回傳給 agent，以進行下一次執行。

4. **框架處理：**Agent Development Kit (ADK) 框架負責管理整個執行流程。它會將 agent client 傳回的中間或最終 `FunctionResponse` 傳送給 LLM，以產生對使用者友善的訊息。

### 建立工具

定義你的工具函式（tool function），並使用 `LongRunningFunctionTool` 類別將其包裝：

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/function-tools/human_in_the_loop.py:define_long_running_function"
    ```

=== "Java"

    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.tools.LongRunningFunctionTool;
    import java.util.HashMap;
    import java.util.Map;
    
    public class ExampleLongRunningFunction {
    
      // Define your Long Running function.
      // Ask for approval for the reimbursement.
      public static Map<String, Object> askForApproval(String purpose, double amount) {
        // Simulate creating a ticket and sending a notification
        System.out.println(
            "Simulating ticket creation for purpose: " + purpose + ", amount: " + amount);
    
        // Send a notification to the approver with the link of the ticket
        Map<String, Object> result = new HashMap<>();
        result.put("status", "pending");
        result.put("approver", "Sean Zhou");
        result.put("purpose", purpose);
        result.put("amount", amount);
        result.put("ticket-id", "approval-ticket-1");
        return result;
      }
    
      public static void main(String[] args) throws NoSuchMethodException {
        // Pass the method to LongRunningFunctionTool.create
        LongRunningFunctionTool approveTool =
            LongRunningFunctionTool.create(ExampleLongRunningFunction.class, "askForApproval");
    
        // Include the tool in the agent
        LlmAgent approverAgent =
            LlmAgent.builder()
                // ...
                .tools(approveTool)
                .build();
      }
    }
    ```

### 中間 / 最終結果更新

Agent client 會收到包含長時間執行工具呼叫 (function calls) 的事件，並檢查該 ticket 的狀態。接著，Agent client 可以將中間或最終回應傳回，以更新進度。框架會將這個值（即使是 None）包裝在`FunctionResponse`的內容中，並回傳給大型語言模型 (LLM)。

??? Tip "僅適用於 Java Agent Development Kit (ADK)"

    When passing `ToolContext` with Function Tools, ensure that one of the following is true:

    * The Schema is passed with the ToolContext parameter in the function signature, like:
      ```
      @com.google.adk.tools.Annotations.Schema(name = "toolContext") ToolContext toolContext
      ```
    OR

    * The following `-parameters` flag is set to the mvn compiler plugin

    ```
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.0</version> <!-- or newer -->
                <configuration>
                    <compilerArgs>
                        <arg>-parameters</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
        </plugins>
    </build>
    ```
    This constraint is temporary and will be removed.


=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/function-tools/human_in_the_loop.py:call_reimbursement_tool"
    ```

=== "Java"

（譯註：此區塊標示為 Java 相關內容，請依照後續內容進行翻譯。如原文僅有此標題，則無需額外翻譯內容。）

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/LongRunningFunctionExample.java:full_code"
    ```


??? "Python 完整範例：檔案處理模擬"

    ```py
    --8<-- "examples/python/snippets/tools/function-tools/human_in_the_loop.py"
    ```

#### 此範例的重點

* **`LongRunningFunctionTool`**：包裝所提供的方法／函式；框架會自動處理將讓渡（yielded）的更新與最終回傳值，依序作為 FunctionResponse 傳送。

* **Agent 指令**：指示大型語言模型 (LLM) 使用該工具，並理解收到的 FunctionResponse 串流（進度 vs. 完成），以便向使用者提供更新。

* **最終回傳**：該函式會回傳最終的結果字典，並於最後的 FunctionResponse 中傳送，以表示已完成。

## Agent-as-a-Tool {#agent-tool}

這項強大的功能讓你可以在系統內，將其他 agent 當作工具來調用。Agent-as-a-Tool 讓你能夠呼叫另一個 agent 來執行特定任務，實現**責任委派**。這在概念上類似於建立一個 Python 函式，該函式會呼叫另一個 agent，並將該 agent 的回應作為函式的回傳值。

### 與子 agent 的主要差異

需特別區分 Agent-as-a-Tool 與 Sub-Agent（子 agent）。

* **Agent-as-a-Tool：** 當 Agent A 以工具方式呼叫 Agent B（使用 Agent-as-a-Tool）時，Agent B 的答案會**傳回**給 Agent A，接著由 Agent A 彙整答案並產生回應給使用者。Agent A 保持主控權，並持續處理後續的使用者輸入。

* **Sub-agent：** 當 Agent A 以子 agent 方式呼叫 Agent B 時，回答使用者的責任會完全**轉移給 Agent B**。Agent A 實際上就不再參與流程。所有後續的使用者輸入都會由 Agent B 回應。

### 使用方式

若要將 agent 當作工具使用，請使用 AgentTool 類別包裝該 agent。

=== "Python"

    ```py
    tools=[AgentTool(agent=agent_b)]
    ```

```markdown
=== "Java"
```

    ```java
    AgentTool.create(agent)
    ```

### 自訂化

`AgentTool` 類別提供以下屬性，以便自訂其行為：

* **skip\_summarization: bool：** 若設為 True，框架將**略過基於大型語言模型 (LLM) 的工具 agent 回應摘要處理**。當工具的回應已經格式良好且不需要進一步處理時，這個選項會很有用。

??? "範例"

    === "Python"

        ```py
        --8<-- "examples/python/snippets/tools/function-tools/summarizer.py"
        ```
  
    === "Java"

        ```java
        --8<-- "examples/java/snippets/src/main/java/tools/AgentToolCustomization.java:full_code"
        ```

### 運作方式

1. 當 `main_agent` 收到長文本時，其指令會告訴它針對長文本使用 `summarize` 工具。  
2. 框架會將 `summarize` 辨識為包裝 `summary_agent` 的 `AgentTool`。  
3. 在背景流程中，`main_agent` 會以長文本作為輸入，呼叫 `summary_agent`。  
4. `summary_agent` 會依據其指令處理文本並產生摘要。  
5. **來自 `summary_agent` 的回應會再傳回給 `main_agent`。**  
6. `main_agent` 便可利用該摘要，組成最終回應給使用者（例如：「這是該文本的摘要：...」）