# 工具

## 什麼是工具？

在 Agent Development Kit (ADK) 的語境中，工具（Tool）代表賦予 AI agent 特定能力的元件，使其能夠執行動作並與外部世界互動，超越其核心的文字生成與推理能力。能夠有效運用工具，往往是區分高階 agent 與基礎語言模型的關鍵。

從技術角度來看，工具通常是一個模組化的程式碼元件——**例如 Python/Java 函式**、類別方法，甚至是另一個專門化的 agent——設計來執行明確且預先定義的任務。這些任務通常涉及與外部系統或資料的互動。

<img src="../assets/agent-tool-call.png" alt="Agent tool call">

### 主要特性

**以行動為導向：** 工具用於執行特定動作，例如：

* 查詢資料庫
* 發送 API 請求（如取得天氣資料、預訂系統）
* 網頁搜尋
* 執行程式碼片段
* 從文件中檢索資訊（RAG）
* 與其他軟體或服務互動

**擴展 agent 能力：** 工具讓 agent 能夠存取即時資訊、影響外部系統，並克服其訓練資料中固有的知識限制。

**執行預先定義的邏輯：** 工具的關鍵在於執行特定、由開發者定義的邏輯。它們本身不具備像 agent 核心大型語言模型 (LLM) 那樣的獨立推理能力。LLM 負責判斷何時、如何、以何種輸入使用哪個工具，而工具本身僅執行其指定的功能。

## Agent 如何使用工具

Agent 會透過動態方式運用工具，這通常涉及函式呼叫的機制。一般流程如下：

1. **推理：** agent 的 LLM 會分析系統指令、對話歷史與使用者請求。
2. **選擇：** 根據分析結果，LLM 會根據 agent 可用的工具及每個工具的 docstring，決定是否執行某個工具，以及選擇哪個工具。
3. **呼叫：** LLM 會為所選工具生成所需的參數（輸入），並觸發其執行。
4. **觀察：** agent 會接收工具回傳的輸出（結果）。
5. **完成：** agent 將工具的輸出納入其持續的推理過程，用以生成下一步回應、決定後續動作，或判斷目標是否已達成。

你可以將工具想像成 agent 智能核心（LLM）可隨時取用的專業工具箱，協助其完成複雜任務。

## ADK 中的工具類型

Agent Development Kit (ADK) 提供多種工具型態，靈活支援各種需求：

1. **[Function Tools](../tools/function-tools.md)：** 由你自行建立、針對應用需求量身打造的工具。
    * **[Functions/Methods](../tools/function-tools.md#1-function-tool)：** 在你的程式碼中定義標準同步函式或方法（如 Python 的 def）。
    * **[Agents-as-Tools](../tools/function-tools.md#3-agent-as-a-tool)：** 將另一個（可能是專門化的）agent 作為父 agent 的工具來使用。
    * **[Long Running Function Tools](../tools/function-tools.md#2-long-running-function-tool)：** 支援執行非同步操作或需較長時間完成的工具。
2. **[Built-in Tools](../tools/built-in-tools.md)：** 框架內建、可直接使用的常用工具。
        範例：Google Search、Code Execution、Retrieval-Augmented Generation (RAG)。
3. **[Third-Party Tools](../tools/third-party-tools.md)：** 無縫整合來自熱門外部函式庫的工具。
        範例：LangChain Tools、CrewAI Tools。

請前往上方連結的各自文件頁面，取得每種工具類型的詳細說明與範例。

## 在 agent 指令中引用工具

在 agent 的指令（instructions）中，你可以直接透過**函式名稱**來引用工具。如果工具的**函式名稱**與**docstring**足夠具體明確，你的指令可以重點描述**何時應由大型語言模型 (LLM) 使用該工具**。這有助於提升指令的清晰度，並協助模型理解每個工具的預期用途。

**明確指示 agent 如何處理工具可能產生的不同回傳值**也非常重要。例如，若某個工具回傳錯誤訊息，你的指令應明確說明 agent 應該重試操作、放棄任務，或是向使用者請求更多資訊。

此外，ADK 支援工具的連續使用（sequential use），即一個工具的輸出可作為另一個工具的輸入。在設計這類工作流程時，請務必**在 agent 指令中描述預期的工具使用順序**，以引導模型依序完成必要步驟。

### 範例

以下範例展示 agent 如何**在指令中引用工具的函式名稱**來使用工具。同時也說明如何引導 agent **處理工具的不同回傳值**（如成功或錯誤訊息），以及如何協調**多個工具的連續使用**以完成任務。

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/overview/weather_sentiment.py"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/WeatherSentimentAgentApp.java:full_code"
    ```

## 工具上下文

對於更進階的使用情境，Agent Development Kit (ADK) 允許你在工具函式中透過加入特殊參數 `tool_context: ToolContext` 來存取額外的上下文資訊。只要在函式簽名中包含此參數，當代理執行期間呼叫你的工具時，ADK 會**自動**提供一個 **ToolContext** 類別的實例。

**ToolContext** 提供了多項關鍵資訊與控制項：

* `state: State`：讀取與修改目前工作階段（session）的狀態。這裡的變更會被追蹤並持久化。

* `actions: EventActions`：影響工具執行後代理的後續行為（例如：跳過摘要、轉交給其他代理）。

* `function_call_id: str`：框架為這次工具呼叫分配的唯一識別碼。可用於追蹤及與驗證回應關聯。當單一模型回應中呼叫多個工具時也很有用。

* `function_call_event_id: str`：此屬性提供觸發本次工具呼叫的**事件**唯一識別碼。適合用於追蹤與記錄。

* `auth_response: Any`：如果在本次工具呼叫前已完成驗證流程，此屬性會包含驗證回應或憑證。

* 服務存取：可透過方法與已設定的服務（如 Artifacts 與 Memory）互動。

請注意，不應在工具函式的 docstring 中包含 `tool_context` 參數。由於 `ToolContext` 是在大型語言模型 (LLM) 決定呼叫工具函式**之後**，由 ADK 框架自動注入，因此這個參數與 LLM 的決策無關，若包含反而可能讓 LLM 感到困惑。

### **狀態管理**

`tool_context.state` 屬性可讓你直接讀寫與目前 session 相關聯的狀態。它的行為類似字典（dictionary），但會確保所有修改都以差異（delta）方式被追蹤，並由 session 服務持久化。這讓工具能在不同互動與代理步驟間維持與共享資訊。

* **讀取狀態**：可使用標準字典存取方式（`tool_context.state['my_key']`）或 `.get()` 方法（`tool_context.state.get('my_key', default_value)`）。

* **寫入狀態**：可直接指定值（`tool_context.state['new_key'] = 'new_value'`）。這些變更會被記錄在結果事件的 state_delta 中。

* **狀態前綴**：請記住以下標準狀態前綴：

    * `app:*`：所有應用程式使用者共用。

    * `user:*`：針對目前使用者在所有 session 間共用。

    * （無前綴）：僅限於目前 session。

    * `temp:*`：暫存，不會在多次呼叫間持久化（適合於單次 run 呼叫內傳遞資料，但一般在工具上下文中較少用，因其運作於多次 LLM 呼叫之間）。

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/overview/user_preference.py"
    ```

=== "Java"

    ```java
    import com.google.adk.tools.FunctionTool;
    import com.google.adk.tools.ToolContext;

    // Updates a user-specific preference.
    public Map<String, String> updateUserThemePreference(String value, ToolContext toolContext) {
      String userPrefsKey = "user:preferences:theme";
  
      // Get current preferences or initialize if none exist
      String preference = toolContext.state().getOrDefault(userPrefsKey, "").toString();
      if (preference.isEmpty()) {
        preference = value;
      }
  
      // Write the updated dictionary back to the state
      toolContext.state().put("user:preferences", preference);
      System.out.printf("Tool: Updated user preference %s to %s", userPrefsKey, preference);
  
      return Map.of("status", "success", "updated_preference", toolContext.state().get(userPrefsKey).toString());
      // When the LLM calls updateUserThemePreference("dark"):
      // The toolContext.state will be updated, and the change will be part of the
      // resulting tool response event's actions.stateDelta.
    }
    ```

### **控制 Agent 流程**

`tool_context.actions` 屬性（在 Java 中為 `ToolContext.actions()`）儲存了一個 **EventActions** 物件。透過修改此物件的屬性，您的工具可以影響在工具執行完成後，Agent 或框架的後續行為。

* **`skip_summarization: bool`**：（預設值：False）若設為 True，將指示 Agent Development Kit (ADK) 略過通常會對工具輸出進行摘要的大型語言模型 (LLM) 呼叫。如果您的工具回傳值已經是可直接給使用者的訊息，這會非常有用。

* **`transfer_to_agent: str`**：將此屬性設為另一個 agent 的名稱。框架會停止目前 agent 的執行，並**將對話控制權轉交給指定的 agent**。這讓工具能夠動態地將任務交付給更專門的 agent 處理。

* **`escalate: bool`**：（預設值：False）設為 True 時，表示目前的 agent 無法處理該請求，應將控制權傳遞給其父 agent（若有階層結構）。在 LoopAgent 中，若子 agent 的工具設定 **escalate=True**，將會終止該循環。

#### 範例

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/overview/customer_support_agent.py"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/tools/CustomerSupportAgentApp.java:full_code"
    ```

##### 說明

* 我們定義了兩個代理（agent）：`main_agent` 和 `support_agent`。`main_agent` 被設計為最初的聯絡點。
* 當 `main_agent` 呼叫 `check_and_transfer` 工具時，該工具會檢查使用者的查詢內容。
* 如果查詢中包含「urgent」這個詞，該工具會存取 `tool_context`，特別是 **`tool_context.actions`**，並將 transfer\_to\_agent 屬性設為 `support_agent`。
* 此動作會通知框架**將對話控制權轉交給名為 `support_agent` 的代理（agent）**。
* 當 `main_agent` 處理緊急查詢時，`check_and_transfer` 工具會觸發轉交流程。接下來的回應理想上會來自 `support_agent`。
* 對於沒有緊急性的普通查詢，工具則僅進行處理，不會觸發轉交。

這個範例說明了一個工具如何透過其 ToolContext 中的 EventActions，動態地影響對話流程，將控制權轉交給其他專門的代理（agent）。

### **驗證（Authentication）**

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出/即將推出。"}

ToolContext 提供了讓工具與需驗證的 API 互動的機制。如果您的工具需要處理驗證，可以使用以下方法：

* **`auth_response`**：如果驗證在您的工具被呼叫前已由框架處理（常見於 RestApiTool 和 OpenAPI 安全機制），則此處會包含憑證（例如 token）。

* **`request_credential(auth_config: dict)`**：如果您的工具判斷需要驗證但尚未取得憑證，請呼叫此方法。這會通知框架根據提供的 auth_config 啟動驗證流程。

* **`get_auth_response()`**：在後續呼叫（於 request_credential 成功處理後）可呼叫此方法，以取得使用者所提供的憑證。

有關驗證流程、設定及範例的詳細說明，請參閱專門的工具驗證（Tool Authentication）文件頁面。

### **具情境感知的資料存取方法**

這些方法為您的工具提供便利的方式，與由已設定服務管理的 session 或 user 相關的持久性資料互動。

* **`list_artifacts()`**（或 Java 中的 **`listArtifacts()`**）：透過 artifact_service 回傳目前 session 所儲存的所有 artifact 檔案名稱（或 key）清單。artifact 通常是使用者上傳或工具／代理所產生的檔案（如圖片、文件等）。

* **`load_artifact(filename: str)`**：從 **artifact_service** 依檔案名稱取得特定 artifact。您可選擇指定版本，若未指定則回傳最新版本。回傳一個包含 artifact 資料與 mime type 的 `google.genai.types.Part` 物件，若找不到則回傳 None。

* **`save_artifact(filename: str, artifact: types.Part)`**：將 artifact 的新版本儲存至 artifact_service。回傳新版本號（從 0 開始）。

* **`search_memory(query: str)`** ![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出/即將推出。"}

       使用已設定的 `memory_service` 查詢使用者的長期記憶（long-term memory）。這對於從過往互動或已儲存知識中檢索相關資訊非常有用。**SearchMemoryResponse** 的結構取決於具體的記憶服務實作，但通常會包含相關的文字片段或對話摘錄。

#### 範例

=== "Python"

    ```py
    --8<-- "examples/python/snippets/tools/overview/doc_analysis.py"
    ```

=== "Java"

    ```java
    // Analyzes a document using context from memory.
    // You can also list, load and save artifacts using Callback Context or LoadArtifacts tool.
    public static @NonNull Maybe<ImmutableMap<String, Object>> processDocument(
        @Annotations.Schema(description = "The name of the document to analyze.") String documentName,
        @Annotations.Schema(description = "The query for the analysis.") String analysisQuery,
        ToolContext toolContext) {
  
      // 1. List all available artifacts
      System.out.printf(
          "Listing all available artifacts %s:", toolContext.listArtifacts().blockingGet());
  
      // 2. Load an artifact to memory
      System.out.println("Tool: Attempting to load artifact: " + documentName);
      Part documentPart = toolContext.loadArtifact(documentName, Optional.empty()).blockingGet();
      if (documentPart == null) {
        System.out.println("Tool: Document '" + documentName + "' not found.");
        return Maybe.just(
            ImmutableMap.<String, Object>of(
                "status", "error", "message", "Document '" + documentName + "' not found."));
      }
      String documentText = documentPart.text().orElse("");
      System.out.println(
          "Tool: Loaded document '" + documentName + "' (" + documentText.length() + " chars).");
  
      // 3. Perform analysis (placeholder)
      String analysisResult =
          "Analysis of '"
              + documentName
              + "' regarding '"
              + analysisQuery
              + " [Placeholder Analysis Result]";
      System.out.println("Tool: Performed analysis.");
  
      // 4. Save the analysis result as a new artifact
      Part analysisPart = Part.fromText(analysisResult);
      String newArtifactName = "analysis_" + documentName;
  
      toolContext.saveArtifact(newArtifactName, analysisPart);
  
      return Maybe.just(
          ImmutableMap.<String, Object>builder()
              .put("status", "success")
              .put("analysis_artifact", newArtifactName)
              .build());
    }
    // FunctionTool processDocumentTool =
    //      FunctionTool.create(ToolContextArtifactExample.class, "processDocument");
    // In the Agent, include this function tool.
    // LlmAgent agent = LlmAgent().builder().tools(processDocumentTool).build();
    ```

透過運用 **ToolContext**，開發者可以建立更為進階且具備情境感知能力的自訂工具，這些工具能無縫整合至 Agent Development Kit (ADK) 的架構中，並增強其代理人的整體能力。

## 定義有效的工具函式

當你將某個方法或函式作為 ADK 工具時，其定義方式會大幅影響代理人正確使用該工具的能力。代理人所依賴的大型語言模型 (Large Language Model, LLM) 會高度依據函式的 **名稱**、**參數（引數）**、**型別提示**，以及 **docstring** / **原始碼註解** 來理解其用途並產生正確的呼叫。

以下是定義有效工具函式的重點指引：

* **函式名稱：**
    * 使用具描述性、動詞-名詞結構的名稱，明確指出動作（例如：`get_weather`、`searchDocuments`、`schedule_meeting`）。
    * 避免使用像是 `run`、`process`、`handle_data` 這類過於通用的名稱，或像 `doStuff` 這樣過於模糊的名稱。即使有良好的描述，像 `do_stuff` 這樣的名稱也可能讓模型混淆該何時使用這個工具，例如與 `cancelFlight` 相比。
    * LLM 在選擇工具時，會將函式名稱作為主要識別依據。

* **參數（引數）：**
    * 你的函式可以有任意數量的參數。
    * 使用清楚且具描述性的名稱（例如：`city` 而非 `c`，`search_query` 而非 `q`）。
    * **在 Python 中為所有參數提供型別提示**（例如：`city: str`、`user_id: int`、`items: list[str]`）。這對於 ADK 產生正確的 LLM 架構至關重要。
    * 確保所有參數型別皆為 **JSON 可序列化**。所有 Java 原始型別，以及標準 Python 型別如 `str`、`int`、`float`、`bool`、`list`、`dict` 及其組合通常都很安全。除非自訂類別實例有明確的 JSON 表示，否則請避免直接作為參數傳遞複雜的自訂類別實例。
    * **不要為參數設定預設值**。例如：`def my_func(param1: str = "default")`。底層模型在產生函式呼叫時，對預設值的支援並不可靠。所有必要資訊應由 LLM 從情境中推導，或在缺少時明確要求。
    * **`self` / `cls` 自動處理：** 像 `self`（實例方法）或 `cls`（類別方法）這類隱含參數會由 ADK 自動處理，並從提供給 LLM 的架構中排除。你只需為工具實際需要 LLM 提供的邏輯參數定義型別提示與描述即可。

* **回傳型別：**
    * 函式的回傳值在 Python 中**必須是字典（`dict`）**，在 Java 中則必須是 **Map**。
    * 如果你的函式回傳的是非字典型別（如字串、數字、列表），ADK 框架會在將結果回傳給模型前，自動將其包裝成類似 `{'result': your_original_return_value}` 的字典/Map。
    * 設計字典/Map 的鍵和值時，請確保**具描述性且易於 LLM 理解**。請記住，模型會讀取這個輸出來決定下一步行動。
    * 包含有意義的鍵。例如，不要只回傳像 `500` 這樣的錯誤碼，而是回傳 `{'status': 'error', 'error_message': 'Database connection failed'}`。
    * **強烈建議**包含一個 `status` 鍵（例如：`'success'`、`'error'`、`'pending'`、`'ambiguous'`），以明確向模型指出工具執行的結果。

* **Docstring / 原始碼註解：**
    * **這點非常重要。** docstring 是 LLM 取得描述性資訊的主要來源。
    * **明確說明工具的功能。** 具體描述其用途與限制。
    * **說明何時應使用此工具。** 提供情境或範例情境，以引導 LLM 做出決策。
    * **清楚描述每個參數。** 解釋 LLM 需為該引數提供哪些資訊。
    * 描述**預期 `dict` 回傳值的結構與意義**，特別是不同 `status` 值及其關聯資料鍵。
    * **不要描述被注入的 ToolContext 參數。** 請避免在 docstring 描述中提及可選的 `tool_context: ToolContext` 參數，因為這不是 LLM 需要知道的參數。ToolContext 會由 ADK 在 LLM 決定呼叫後自動注入。

    **良好定義的範例：**

=== "Python"
    
    ```python
    def lookup_order_status(order_id: str) -> dict:
      """Fetches the current status of a customer's order using its ID.

      Use this tool ONLY when a user explicitly asks for the status of
      a specific order and provides the order ID. Do not use it for
      general inquiries.

      Args:
          order_id: The unique identifier of the order to look up.

      Returns:
          A dictionary indicating the outcome.
          On success, status is 'success' and includes an 'order' dictionary.
          On failure, status is 'error' and includes an 'error_message'.
          Example success: {'status': 'success', 'order': {'state': 'shipped', 'tracking_number': '1Z9...'}}
          Example error: {'status': 'error', 'error_message': 'Order ID not found.'}
      """
      # ... function implementation to fetch status ...
      if status_details := fetch_status_from_backend(order_id):
        return {
            "status": "success",
            "order": {
                "state": status_details.state,
                "tracking_number": status_details.tracking,
            },
        }
      else:
        return {"status": "error", "error_message": f"Order ID {order_id} not found."}

    ```

=== "Java"

    ```java
    /**
     * Retrieves the current weather report for a specified city.
     *
     * @param city The city for which to retrieve the weather report.
     * @param toolContext The context for the tool.
     * @return A dictionary containing the weather information.
     */
    public static Map<String, Object> getWeatherReport(String city, ToolContext toolContext) {
        Map<String, Object> response = new HashMap<>();
        if (city.toLowerCase(Locale.ROOT).equals("london")) {
            response.put("status", "success");
            response.put(
                    "report",
                    "The current weather in London is cloudy with a temperature of 18 degrees Celsius and a"
                            + " chance of rain.");
        } else if (city.toLowerCase(Locale.ROOT).equals("paris")) {
            response.put("status", "success");
            response.put("report", "The weather in Paris is sunny with a temperature of 25 degrees Celsius.");
        } else {
            response.put("status", "error");
            response.put("error_message", String.format("Weather information for '%s' is not available.", city));
        }
        return response;
    }
    ```

* **簡潔與聚焦：**
    * **保持工具專一：** 每個工具理想上應只執行一個明確定義的任務。
    * **參數越少越好：** 大型語言模型 (LLM) 一般能更可靠地處理參數較少且定義明確的工具，相較於參數繁多或複雜的工具。
    * **使用簡單資料型別：** 優先選用基本型別（如 **Python** 的 `str`、`int`、`bool`、`float`、`List[str]`，或 **Java** 的 `int`、`byte`、`short`、`long`、`float`、`double`、`boolean`、`char`），盡量避免將複雜的自訂類別或深層巢狀結構作為參數。
    * **拆解複雜任務：** 將執行多個不同邏輯步驟的函式拆分為更小、更專注的工具。例如，與其設計一個單一的 `update_user_profile(profile: ProfileObject)` 工具，不如考慮分別建立 `update_user_name(name: str)`、`update_user_address(address: str)`、`update_user_preferences(preferences: list[str])` 等工具。這樣能讓 LLM 更容易選擇並使用正確的功能。

遵循這些指引，可以為 LLM 提供清晰且有結構的自訂函式工具，進而提升代理行為的能力與可靠性。

## 工具集：分組與動態提供工具 ![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出。"}

除了單一工具外，Agent Development Kit (ADK) 引入了 **工具集 (Toolset)** 的概念，透過 `BaseToolset` 介面（定義於 `google.adk.tools.base_toolset`）。工具集讓你能夠管理並動態提供一組 `BaseTool` 實例給代理 (agent)。

這種做法的優點包括：

*   **組織相關工具：** 將具有共同用途的工具分組（例如：所有數學運算工具，或所有與特定 API 互動的工具）。
*   **動態工具可用性：** 讓代理根據當前情境（如使用者權限、工作階段狀態或其他執行時條件）擁有不同的可用工具。工具集的 `get_tools` 方法可決定要暴露哪些工具。
*   **整合外部工具提供者：** 工具集可作為外部系統（如 OpenAPI 規格或 MCP 伺服器）工具的轉接器，將其轉換為 ADK 相容的 `BaseTool` 物件。

### `BaseToolset` 介面

任何作為 ADK 工具集的類別都應實作 `BaseToolset` 抽象基底類別。此介面主要定義了兩個方法：

*   **`async def get_tools(...) -> list[BaseTool]:`**
    這是工具集的核心方法。當 ADK 代理需要知道其可用工具時，會對其 `tools` 清單中的每個 `BaseToolset` 實例呼叫 `get_tools()`。
    *   它會接收一個可選的 `readonly_context`（`ReadonlyContext` 的實例）。此 context 提供唯讀資訊存取，例如目前的工作階段狀態（`readonly_context.state`）、代理名稱、呼叫 ID 等。工具集可利用這個 context 動態決定要回傳哪些工具。
    *   此方法**必須**回傳一個 `list`，內容為多個 `BaseTool` 實例（例如 `FunctionTool`、`RestApiTool`）。

*   **`async def close(self) -> None:`**
    這個非同步方法會在工具集不再需要時由 ADK 框架呼叫，例如代理伺服器關閉或 `Runner` 被關閉時。請在此方法中實作必要的清理作業，例如關閉網路連線、釋放檔案控制代碼，或清理工具集管理的其他資源。

### 在代理中使用工具集

你可以將自訂的 `BaseToolset` 實作實例直接加入 `LlmAgent` 的 `tools` 清單中，與單獨的 `BaseTool` 實例並列。

當代理初始化或需要判斷其可用功能時，ADK 框架會遍歷 `tools` 清單：

*   若項目為 `BaseTool` 實例，則直接使用。
*   若項目為 `BaseToolset` 實例，則會呼叫其 `get_tools()` 方法（帶入目前的 `ReadonlyContext`），並將回傳的 `BaseTool` 清單加入代理的可用工具中。

### 範例：簡易數學工具集

以下將建立一個提供基本算術運算的工具集範例。

```py
--8<-- "examples/python/snippets/tools/overview/toolset_example.py:init"
```

在此範例中：

*   `SimpleMathToolset` 實作了 `BaseToolset`，其 `get_tools()` 方法會針對 `add_numbers` 和 `subtract_numbers` 回傳 `FunctionTool` 實例，並使用前綴字自訂它們的名稱。
*   `calculator_agent` 同時設定了個別的 `greet_tool` 以及一個 `SimpleMathToolset` 實例。
*   當執行 `calculator_agent` 時，Agent Development Kit (ADK) 會呼叫 `math_toolset_instance.get_tools()`。該 agent 的大型語言模型 (LLM) 將能存取 `greet_user`、`calculator_add_numbers` 和 `calculator_subtract_numbers` 來處理使用者請求。
*   `add_numbers` 工具展示了如何寫入 `tool_context.state`，而 agent 的指令則提及了讀取這個狀態。
*   會呼叫 `close()` 方法，以確保釋放 toolset 所持有的任何資源。

Toolset 提供了一種強大的方式，能夠組織、管理並動態地為你的 Agent Development Kit (ADK) agent 提供一系列工具，使 agent 應用程式更加模組化、易於維護且具備高度適應性。
