# Function tools

當內建的 Agent Development Kit (ADK) 工具無法滿足您的需求時，您可以建立自訂的 *function tools*（函式工具）。建構 function tools 讓您能夠打造專屬的功能，例如連接專有資料庫或實作獨特的演算法。
舉例來說，一個 function tool `myfinancetool` 可能是一個計算特定財務指標的函式。Agent Development Kit (ADK) 也支援長時間運行的函式，因此即使該計算需要較長時間，代理（agent）仍可繼續處理其他任務。

Agent Development Kit (ADK) 提供多種建立 function tools 的方式，適用於不同複雜度與控制需求：

*  [Function Tools](#function-tool)
*  [Long Running Function Tools](#long-run-tool)
*  [Agents-as-a-Tool](#agent-tool)

## Function Tools {#function-tool}

將 Python 函式轉換為工具，是將自訂邏輯整合至您的代理（agent）中的直接方式。當您將函式指派給代理的 `tools` 清單時，框架會自動將其包裝為 `FunctionTool`。

### 運作方式

Agent Development Kit (ADK) 框架會自動檢查您的 Python 函式簽章，包括名稱、docstring、參數、型別提示（type hints）及預設值，以產生一份 schema。這份 schema 讓大型語言模型 (LLM) 能理解該工具的用途、適用時機及所需參數。

### 定義函式簽章

良好定義的函式簽章對於大型語言模型 (LLM) 正確使用您的工具至關重要。

#### 參數

您可以定義具有必要參數、選用參數，以及可變參數的函式。以下說明各種情境的處理方式：

##### 必要參數
若參數有型別提示（type hint）但**沒有預設值**，則視為**必要參數**。大型語言模型 (LLM) 在呼叫該工具時，必須為此參數提供值。

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
    在此範例中，`city` 和 `unit` 都是必填參數。如果大型語言模型 (LLM) 嘗試在缺少其中一個的情況下呼叫 `get_weather`，Agent Development Kit (ADK) 會回傳錯誤給 LLM，並提示其修正呼叫方式。

##### 具有預設值的選用參數
如果你為參數提供了**預設值**，該參數就被視為**選用**。這是 Python 定義選用參數的標準方式。Agent Development Kit (ADK) 會正確解析這些參數，並且不會將它們列在傳送給 LLM 的工具 schema 的 `required` 欄位中。

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
    這裡的 `flexible_days` 是可選的。大型語言模型 (LLM) 可以選擇提供它，但並非必須。

##### 使用 `typing.Optional` 標記為可選參數
你也可以使用 `typing.Optional[SomeType]` 或 `| None` 語法（Python 3.10+）將參數標記為可選。這表示該參數可以是 `None`。當與預設值 `None` 結合時，它的行為就如同標準的可選參數。

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
雖然你可以在函式簽名中包含 `*args`（可變位置參數）和 `**kwargs`（可變關鍵字參數）以供其他用途，但**在為大型語言模型 (LLM) 產生工具 schema 時，Agent Development Kit (ADK) 框架會忽略這些參數**。LLM 不會察覺到這些參數，也無法傳遞參數給它們。建議你對所有期望從 LLM 獲取的資料，都明確定義為參數。

#### 回傳型別

Function Tool（函式工具）建議的回傳型別為 Python 的 **dictionary（字典）** 或 Java 的 **Map（映射）**。這樣可以用鍵值對的方式結構化回應，為 LLM 提供更多上下文與清晰度。如果你的函式回傳的型別不是字典，框架會自動將其包裝成一個以 **"result"** 為鍵的單一字典。

請盡量讓你的回傳值具有描述性。*例如，*與其回傳數字錯誤碼，不如回傳一個包含 "error_message" 鍵且內含易於理解說明的字典。**請記住，理解結果的是 LLM，而不是程式碼。**最佳實踐是，在回傳的字典中加入 "status" 鍵，來標示整體執行狀態（例如："success"、"error"、"pending"），讓 LLM 能夠明確判斷操作的狀態。

#### Docstrings（文件字串）

你的函式 docstring（文件字串）會作為工具的**描述**，並傳送給 LLM。因此，撰寫清楚且詳盡的 docstring 對於讓 LLM 正確理解如何使用此工具至關重要。請明確說明函式的用途、各參數的意義，以及預期的回傳值。

### 工具間資料傳遞

當 agent 依序呼叫多個工具時，你可能需要將資料從一個工具傳遞到另一個工具。建議的做法是利用 session state（會話狀態）中的 `temp:` 前綴來達成。

一個工具可以將資料寫入 `temp:` 變數，後續的工具則可以讀取該資料。這些資料僅在本次呼叫期間有效，之後會被清除。

!!! note "共享呼叫上下文"
    單一 agent 回合內的所有工具呼叫都共用同一個 `InvocationContext`。這表示它們也共用同一個暫存（`temp:`）狀態，因此資料可以在它們之間傳遞。

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

雖然你在定義函式時有相當大的彈性，但請記住，簡單性有助於提升大型語言模型 (LLM) 的可用性。建議遵循以下指引：

* **參數越少越好：** 盡量減少參數數量，以降低複雜度。  
* **簡單資料型別：** 優先使用像是 `str` 和 `int` 這類原始資料型別，而非自訂類別。  
* **具意義的命名：** 函式名稱與參數名稱會大幅影響大型語言模型 (LLM) 如何解讀與使用這個工具。請選用能清楚反映函式用途及輸入意義的名稱，避免像 `do_stuff()` 或 `beAgent()` 這類通用名稱。
* **為平行執行設計：** 當多個工具同時運行時，建議設計為非同步操作以提升函式呼叫效能。關於如何啟用工具的平行執行，請參閱
[Increase tool performance with parallel execution](/adk-docs/tools/performance/)。

## 長時間運行函式工具 {#long-run-tool}

這個工具旨在協助你啟動並管理需要大量處理時間、且在代理流程 (agent workflow) 之外執行的任務，同時不會阻塞代理的執行。此工具為 `FunctionTool` 的子類別。

當你使用 `LongRunningFunctionTool` 時，你的函式可以啟動長時間運行的操作，並可選擇性地回傳**初始結果**，例如長時間運行操作的 ID。當長時間運行函式工具被呼叫後，代理執行器 (agent runner) 會暫停代理的運作，並讓代理客戶端 (agent client) 決定是否繼續或等待長時間運行操作完成。代理客戶端可以查詢長時間運行操作的進度，並回傳中間或最終回應。代理便可繼續處理其他任務。常見情境如 human-in-the-loop（人類參與流程），代理在執行任務前需取得人類批准。

!!! warning "警告：執行處理"
    長時間運行函式工具的設計目的是協助你啟動並*管理*長時間運行的任務，
    但***不會執行***實際的長時間任務。
    對於需要大量時間才能完成的任務，建議你實作獨立的伺服器來執行該任務。

!!! tip "提示：平行執行"
    視你所開發工具的類型而定，設計為非同步操作可能比建立長時間運行工具更合適。
    詳情請參閱
    [Increase tool performance with parallel execution](/adk-docs/tools/performance/)。

### 運作方式

在 Python 中，你可以用 `LongRunningFunctionTool` 包裝函式。在 Java 中，則將方法名稱傳遞給 `LongRunningFunctionTool.create()`。

1. **啟動：** 當大型語言模型 (LLM) 呼叫此工具時，你的函式會啟動長時間運行的操作。

2. **初始更新：** 你的函式可選擇性地回傳初始結果（例如長時間運行操作的 ID）。Agent Development Kit (ADK) 框架會將結果包裝在 `FunctionResponse` 中並回傳給大型語言模型 (LLM)。這樣 LLM 就能通知使用者（例如狀態、完成百分比、訊息）。接著代理運作會結束或暫停。

3. **繼續或等待：** 每次代理運作結束後，代理客戶端可以查詢長時間運行操作的進度，並決定是否以中間回應（用於更新進度）繼續代理運作，或等待取得最終回應。代理客戶端應將中間或最終回應傳回代理以進行下一次運作。

4. **框架處理：** Agent Development Kit (ADK) 框架會負責執行管理。它會將代理客戶端傳來的中間或最終 `FunctionResponse` 傳送給大型語言模型 (LLM)，以產生對使用者友善的訊息。

### 建立工具

定義你的工具函式，並使用 `LongRunningFunctionTool` 類別進行包裝：

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

### 中間／最終結果更新

Agent client 會收到包含長時間執行 function 呼叫的事件，並檢查該 ticket 的狀態。接著，Agent client 可以傳送中間或最終回應，以更新進度。框架會將這個值（即使是 None）封裝到回傳給大型語言模型 (LLM) 的 `FunctionResponse` 內容中。

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

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/LongRunningFunctionExample.java:full_code"
    ```


??? "Python 完整範例：檔案處理模擬"

    ```py
    --8<-- "examples/python/snippets/tools/function-tools/human_in_the_loop.py"
    ```

#### 此範例的重點

* **`LongRunningFunctionTool`**：包裝所提供的方法/函式；框架會處理傳送產生的更新內容以及最終回傳值，這些都會以連續的 FunctionResponse 形式傳送。

* **代理指令**：指示大型語言模型 (LLM) 使用該工具，並理解傳入的 FunctionResponse 串流（進度 vs. 完成），以便向使用者更新狀態。

* **最終回傳**：該函式會回傳最終的結果字典，並在最後的 FunctionResponse 中傳送，以表示任務完成。

## Agent-as-a-Tool {#agent-tool}

這個強大的功能讓你能夠在系統內部將其他代理（Agent）作為工具來調用，充分發揮其能力。Agent-as-a-Tool 允許你呼叫另一個代理來執行特定任務，實現**責任委派**。這在概念上類似於建立一個 Python 函式，該函式呼叫另一個代理，並將該代理的回應作為自己的回傳值。

### 與子代理（Sub-Agent）的主要差異

需要明確區分 Agent-as-a-Tool 與 Sub-Agent（子代理）。

* **Agent-as-a-Tool：** 當代理 A 以工具方式呼叫代理 B（使用 Agent-as-a-Tool）時，代理 B 的回應會**傳回**給代理 A，然後代理 A 會彙整這個回應並產生對使用者的回覆。代理 A 保持控制權，並繼續處理後續的使用者輸入。

* **子代理（Sub-agent）：** 當代理 A 以子代理方式呼叫代理 B 時，回應使用者的責任會完全**轉移給代理 B**。代理 A 等同於退出流程，後續所有的使用者輸入都將由代理 B 回應。

### 使用方式

若要將代理作為工具使用，請使用 AgentTool 類別來包裝該代理。

=== "Python"

    ```py
    tools=[AgentTool(agent=agent_b)]
    ```

=== "Java"

    ```java
    AgentTool.create(agent)
    ```

### 自訂

`AgentTool` 類別提供以下屬性以自訂其行為：

* **skip\_summarization: bool：** 若設為 True，框架將**略過基於大型語言模型 (LLM) 的工具代理回應摘要**。當工具的回應已經格式良好且不需要進一步處理時，這個選項會很有用。

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

1. 當 `main_agent` 收到長文本時，其指令會告訴它針對長文本使用 'summarize' 工具。  
2. 框架會辨識 'summarize' 是包裝了 `summary_agent` 的 `AgentTool`。  
3. 在後台，`main_agent` 會以長文本作為輸入呼叫 `summary_agent`。  
4. `summary_agent` 會依照其指令處理文本並產生摘要。  
5. **來自 `summary_agent` 的回應隨後會傳回給 `main_agent`。**  
6. `main_agent` 便可利用該摘要，向使用者組成最終回應（例如：「這是該文本的摘要：...」）