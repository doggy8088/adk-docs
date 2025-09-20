# AI Agents 的安全性與保安

## 概覽

隨著 AI agents 能力日益提升，確保其運作安全、保安無虞，並符合您的品牌價值觀變得至關重要。未經控管的 agents 可能帶來風險，包括執行不符預期或有害的行為（如資料外洩），以及產生不當內容，進而影響品牌聲譽。**風險來源包括指令不明確、模型幻覺、惡意用戶的 jailbreak 與提示注入（prompt injection），以及透過工具使用間接發生的提示注入。**

[Google Cloud Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/overview) 提供多層次的風險緩解方案，協助您打造強大且值得信賴的 agents。它提供多種機制來建立嚴格的邊界，確保 agents 只執行您明確允許的行為：

1. **身份與授權**：透過定義 agent 與用戶的授權，控制 agent「以誰的身份」執行動作。
2. **輸入與輸出防護措施（Guardrails）**：精確控管您的模型與工具呼叫。

    * *工具內防護措施（In-Tool Guardrails）：* 以防禦性思維設計工具，利用開發者設定的工具 context 來強制執行政策（例如：僅允許查詢特定資料表）。
    * *內建 Gemini 安全功能：* 若使用 Gemini 模型，可利用內容過濾器阻擋有害輸出，並透過系統指令（system Instructions）引導模型行為與安全準則。
    * *Callbacks 與 Plugins：* 在執行前後驗證模型與工具呼叫，將參數與 agent 狀態或外部政策比對。
    * *以 Gemini 作為安全防護措施：* 透過 callbacks 配置一個廉價且快速的模型（如 Gemini Flash Lite）作為額外安全層，篩選輸入與輸出。

3. **沙箱化程式碼執行**：將模型產生的程式碼執行於沙箱環境，防止產生安全問題。
4. **評估與追蹤**：利用評估工具檢視 agent 最終輸出的品質、相關性與正確性。透過追蹤功能掌握 agent 行為，分析 agent 解決問題的步驟，包括其工具選擇、策略與效率。
5. **網路控管與 VPC-SC**：將 agent 活動限制於安全邊界（如 VPC Service Controls），以防資料外洩並降低潛在影響範圍。

## 安全性與保安風險

在實施安全措施前，請針對您的 agent 能力、應用領域與部署情境進行全面的風險評估。

***風險來源*** 包括：

* agent 指令不明確
* 惡意用戶的提示注入（prompt injection）與 jailbreak 嘗試
* 透過工具使用間接發生的提示注入

**風險類別** 包括：

* **目標偏離與目標腐化（Misalignment & goal corruption）**
    * 追求非預期或代理目標，導致有害結果（如「獎勵駭客」reward hacking）
    * 誤解複雜或模糊的指令
* **有害內容產生，包括品牌安全**
    * 產生有毒、仇恨、偏見、露骨、歧視或非法內容
    * 品牌安全風險，如使用違背品牌價值的語言或離題對話
* **不安全的行為**
    * 執行損害系統的指令
    * 進行未授權購買或金融交易
    * 洩漏敏感個人資料（PII）
    * 資料外洩

## 最佳實踐

### 身份與授權

*工具* 在外部系統執行動作時所使用的身份，從安全角度來看是關鍵的設計考量。同一 agent 的不同工具可以配置不同策略，因此在討論 agent 設定時需特別留意。

#### Agent-Auth

**工具以 agent 自身身份與外部系統互動**（例如：使用服務帳戶）。agent 身份必須在外部系統的存取政策中明確授權，例如將 agent 的服務帳戶加入資料庫的 IAM 政策以取得讀取權限。這類政策限制 agent 僅能執行開發者預期允許的行為：例如僅給予資源唯讀權限，無論模型決策為何，工具都無法執行寫入操作。

此方法實作簡單，**適用於所有用戶擁有相同存取層級的 agents。** 若並非所有用戶權限相同，僅採用此方法不足以提供完整保護，需搭配下述其他技術。在工具實作時，請確保有產生日誌以維持行為可追溯性，因所有 agent 行為都會以 agent 身份出現。

#### User Auth

工具以**「控制用戶」的身份**與外部系統互動（例如：在網頁應用中與前端互動的人類用戶）。在 ADK 中，這通常透過 OAuth 實現：agent 與前端互動以取得 OAuth token，然後工具在執行外部操作時使用該 token；若控制用戶本身有權執行該操作，外部系統就會授權。

User auth 的優點在於 agent 僅能執行用戶本身可執行的操作，大幅降低惡意用戶濫用 agent 取得額外資料的風險。然而，多數常見的委派實作僅能委派固定權限集（即 OAuth scopes），而這些 scopes 通常比 agent 實際需求更寬鬆，因此需搭配下述技術進一步限制 agent 行為。

### 輸入與輸出防護措施（Guardrails）

#### 工具內防護措施（In-tool guardrails）

工具可以以安全為核心設計：我們可以建立僅暴露希望模型執行的動作的工具，其他行為一律不允許。藉由限制 agent 可用的行為範圍，可決定性地消除我們永遠不希望 agent 執行的異常行為。

工具內防護措施是一種建立通用且可重複使用工具的方式，這些工具暴露決定性控制，讓開發者能針對每次工具實例化設定限制。

此方法仰賴工具接收兩種輸入：由模型設定的 arguments，以及 [**`Tool Context`**](../tools/index.md#tool-context)，後者可由 agent 開發者決定性地設定。我們可以依賴這些決定性資訊，驗證模型是否如預期運作。

例如，一個查詢工具可以設計為從 Tool Context 讀取政策。

=== "Python"

    ```py
    # Conceptual example: Setting policy data intended for tool context
    # In a real ADK app, this might be set in InvocationContext.session.state
    # or passed during tool initialization, then retrieved via ToolContext.
    
    policy = {} # Assuming policy is a dictionary
    policy['select_only'] = True
    policy['tables'] = ['mytable1', 'mytable2']
    
    # Conceptual: Storing policy where the tool can access it via ToolContext later.
    # This specific line might look different in practice.
    # For example, storing in session state:
    invocation_context.session.state["query_tool_policy"] = policy
    
    # Or maybe passing during tool init:
    query_tool = QueryTool(policy=policy)
    # For this example, we'll assume it gets stored somewhere accessible.
    ```
=== "Java"

    ```java
    // Conceptual example: Setting policy data intended for tool context
    // In a real ADK app, this might be set in InvocationContext.session.state
    // or passed during tool initialization, then retrieved via ToolContext.
    
    policy = new HashMap<String, Object>(); // Assuming policy is a Map
    policy.put("select_only", true);
    policy.put("tables", new ArrayList<>("mytable1", "mytable2"));
    
    // Conceptual: Storing policy where the tool can access it via ToolContext later.
    // This specific line might look different in practice.
    // For example, storing in session state:
    invocationContext.session().state().put("query_tool_policy", policy);
    
    // Or maybe passing during tool init:
    query_tool = QueryTool(policy);
    // For this example, we'll assume it gets stored somewhere accessible.
    ```

在工具執行期間，[**`Tool Context`**](../tools/index.md#tool-context) 會被傳遞給工具：

=== "Python"

    ```py
    def query(query: str, tool_context: ToolContext) -> str | dict:
      # Assume 'policy' is retrieved from context, e.g., via session state:
      # policy = tool_context.invocation_context.session.state.get('query_tool_policy', {})
    
      # --- Placeholder Policy Enforcement ---
      policy = tool_context.invocation_context.session.state.get('query_tool_policy', {}) # Example retrieval
      actual_tables = explainQuery(query) # Hypothetical function call
    
      if not set(actual_tables).issubset(set(policy.get('tables', []))):
        # Return an error message for the model
        allowed = ", ".join(policy.get('tables', ['(None defined)']))
        return f"Error: Query targets unauthorized tables. Allowed: {allowed}"
    
      if policy.get('select_only', False):
           if not query.strip().upper().startswith("SELECT"):
               return "Error: Policy restricts queries to SELECT statements only."
      # --- End Policy Enforcement ---
    
      print(f"Executing validated query (hypothetical): {query}")
      return {"status": "success", "results": [...]} # Example successful return
    ```

=== "Java"

    ```java
    
    import com.google.adk.tools.ToolContext;
    import java.util.*;
    
    class ToolContextQuery {
    
      public Object query(String query, ToolContext toolContext) {

        // Assume 'policy' is retrieved from context, e.g., via session state:
        Map<String, Object> queryToolPolicy =
            toolContext.invocationContext.session().state().getOrDefault("query_tool_policy", null);
        List<String> actualTables = explainQuery(query);
    
        // --- Placeholder Policy Enforcement ---
        if (!queryToolPolicy.get("tables").containsAll(actualTables)) {
          List<String> allowedPolicyTables =
              (List<String>) queryToolPolicy.getOrDefault("tables", new ArrayList<String>());

          String allowedTablesString =
              allowedPolicyTables.isEmpty() ? "(None defined)" : String.join(", ", allowedPolicyTables);
          
          return String.format(
              "Error: Query targets unauthorized tables. Allowed: %s", allowedTablesString);
        }
    
        if (!queryToolPolicy.get("select_only")) {
          if (!query.trim().toUpperCase().startswith("SELECT")) {
            return "Error: Policy restricts queries to SELECT statements only.";
          }
        }
        // --- End Policy Enforcement ---
    
        System.out.printf("Executing validated query (hypothetical) %s:", query);
        Map<String, Object> successResult = new HashMap<>();
        successResult.put("status", "success");
        successResult.put("results", Arrays.asList("result_item1", "result_item2"));
        return successResult;
      }
    }
    ```

#### 內建 Gemini 安全功能

Gemini 模型內建多項安全機制，可用於提升內容與品牌安全性。

* **內容安全過濾器**：[內容過濾器](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-attributes) 可協助阻擋有害內容的輸出。這些過濾器獨立於 Gemini 模型運作，作為針對試圖破解模型的威脅行為者的多層防禦之一。Vertex AI 上的 Gemini 模型使用兩種類型的內容過濾器：  
* **不可設定的安全過濾器** 會自動阻擋包含違禁內容的輸出，例如兒童性虐待材料（CSAM）和個人可識別資訊（PII）。  
* **可設定的內容過濾器** 允許您根據四種危害類別（仇恨言論、騷擾、色情內容與危險內容）的機率與嚴重程度分數，定義阻擋的門檻。這些過濾器預設為關閉，但您可以根據需求進行設定。  
* **安全性系統指令**：[系統指令](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/safety-system-instructions) 可為 Vertex AI 上的 Gemini 模型提供直接的行為指引，規範模型應如何運作及產生何種類型的內容。透過提供具體指令，您可以主動引導模型避免產生不符合組織需求的不良內容。您可以撰寫系統指令來定義內容安全準則，例如禁止與敏感主題、免責聲明語言，以及品牌安全準則，確保模型輸出符合品牌語調、價值觀與目標受眾。

雖然這些措施在內容安全方面相當完善，但您仍需額外檢查，以降低 agent 不一致、危險行為及品牌安全風險。

#### 安全防護的 Callback 與 Plugin

Callback 提供了一種簡單、針對 agent 的方法，可在工具與模型 I/O 前加入預先驗證；而 plugin 則能在多個 agent 之間實作通用的安全政策，具備可重複使用的特性。

當無法修改工具以新增防護措施時，可以使用 [**`Before Tool Callback`**](../callbacks/types-of-callbacks.md#before-tool-callback) 函式來對呼叫進行預先驗證。Callback 可以存取 agent 的狀態、所請求的工具與參數。這種方式非常通用，甚至可以建立共用的工具政策函式庫以重複使用。不過，若強制執行防護措施所需的資訊未直接顯示於參數中，則未必適用於所有工具。

=== "Python"

    ```py
    # Hypothetical callback function
    def validate_tool_params(
        callback_context: CallbackContext, # Correct context type
        tool: BaseTool,
        args: Dict[str, Any],
        tool_context: ToolContext
        ) -> Optional[Dict]: # Correct return type for before_tool_callback
    
      print(f"Callback triggered for tool: {tool.name}, args: {args}")
    
      # Example validation: Check if a required user ID from state matches an arg
      expected_user_id = callback_context.state.get("session_user_id")
      actual_user_id_in_args = args.get("user_id_param") # Assuming tool takes 'user_id_param'
    
      if actual_user_id_in_args != expected_user_id:
          print("Validation Failed: User ID mismatch!")
          # Return a dictionary to prevent tool execution and provide feedback
          return {"error": f"Tool call blocked: User ID mismatch."}
    
      # Return None to allow the tool call to proceed if validation passes
      print("Callback validation passed.")
      return None
    
    # Hypothetical Agent setup
    root_agent = LlmAgent( # Use specific agent type
        model='gemini-2.0-flash',
        name='root_agent',
        instruction="...",
        before_tool_callback=validate_tool_params, # Assign the callback
        tools = [
          # ... list of tool functions or Tool instances ...
          # e.g., query_tool_instance
        ]
    )
    ```

=== "Java"

    ```java
    // Hypothetical callback function
    public Optional<Map<String, Object>> validateToolParams(
      CallbackContext callbackContext,
      Tool baseTool,
      Map<String, Object> input,
      ToolContext toolContext) {

    System.out.printf("Callback triggered for tool: %s, Args: %s", baseTool.name(), input);
    
    // Example validation: Check if a required user ID from state matches an input parameter
    Object expectedUserId = callbackContext.state().get("session_user_id");
    Object actualUserIdInput = input.get("user_id_param"); // Assuming tool takes 'user_id_param'
    
    if (!actualUserIdInput.equals(expectedUserId)) {
      System.out.println("Validation Failed: User ID mismatch!");
      // Return to prevent tool execution and provide feedback
      return Optional.of(Map.of("error", "Tool call blocked: User ID mismatch."));
    }
    
    // Return to allow the tool call to proceed if validation passes
    System.out.println("Callback validation passed.");
    return Optional.empty();
    }
    
    // Hypothetical Agent setup
    public void runAgent() {
    LlmAgent agent =
        LlmAgent.builder()
            .model("gemini-2.0-flash")
            .name("AgentWithBeforeToolCallback")
            .instruction("...")
            .beforeToolCallback(this::validateToolParams) // Assign the callback
            .tools(anyToolToUse) // Define the tool to be used
            .build();
    }
    ```

然而，當你為 agent 應用程式加入安全防護措施時，建議使用插件（plugin）來實作不特定於單一 agent 的政策。插件設計為自包含且模組化，允許你針對特定安全政策建立獨立插件，並在 Runner 層級全域套用。這代表安全插件只需設定一次，即可套用到所有使用該 Runner 的 agent，確保整個應用程式具備一致的安全防護，無需重複撰寫程式碼。

以下是一些範例：

* **Gemini as a Judge Plugin**：此插件利用 Gemini Flash Lite 來評估使用者輸入、工具輸入與輸出，以及 agent 回應的適當性、提示注入（prompt injection）與越獄（jailbreak）偵測。該插件將 Gemini 配置為安全過濾器，以降低內容安全、品牌安全及 agent 失調的風險。插件會將使用者輸入、工具輸入與輸出、模型輸出傳遞給 Gemini Flash Lite，由其判斷輸入給 agent 的內容是否安全。如果 Gemini 判定輸入不安全，agent 將回傳預設回應：「很抱歉，我無法協助這個問題。請問還有其他我可以幫忙的嗎？」

* **Model Armor Plugin**：此插件會在 agent 執行過程中的指定時機，查詢 Model Armor API 以檢查潛在的內容安全違規。與 _Gemini as a Judge_ 插件類似，若 Model Armor 偵測到有害內容，則會回傳預設回應給使用者。

* **PII Redaction Plugin**：這是一個專為 [Before Tool Callback](/adk-docs/plugins/#tool-callbacks) 設計的插件，專門用於在資料被工具處理或傳送至外部服務前，先去除個人可識別資訊（PII）。

### 沙箱化程式碼執行

程式碼執行是一項具有額外安全考量的特殊工具：必須採用沙箱（sandbox）機制，防止模型產生的程式碼危及本地環境，進而產生安全問題。

Google 及 Agent Development Kit (ADK)（ADK）提供多種安全執行程式碼的選項。[Vertex Gemini Enterprise API 程式碼執行功能](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/code-execution-api) 讓 agent 能在伺服器端利用沙箱化程式碼執行，方法是啟用 `tool_execution` 工具。若需進行資料分析的程式碼，你可以使用 ADK 內建的 [Code Executor](../tools/built-in-tools.md#code-execution) 工具，呼叫 [Vertex Code Interpreter Extension](https://cloud.google.com/vertex-ai/generative-ai/docs/extensions/code-interpreter)。

如果上述選項都無法滿足你的需求，你可以利用 ADK 提供的基礎元件自行建構程式碼執行器。我們建議建立具備完全隔離（hermetic）的執行環境：不允許網路連線與 API 呼叫，以避免資料外洩；並且在每次執行後徹底清除資料，避免跨使用者的資料外洩風險。

### 評估

請參閱 [Evaluate Agents](../evaluate/index.md)。

### VPC-SC 周界與網路控制

如果你將 agent 執行於 VPC-SC 周界內，這將確保所有 API 呼叫僅操作周界內的資源，降低資料外洩的機率。

然而，身份與周界僅能對 agent 行為提供粗略的控制。工具使用的安全防護措施（guardrails）可補足這些限制，讓 agent 開發者能更細緻地控制允許哪些行為。

### 其他安全風險

#### 在 UI 中務必跳脫模型產生的內容

當 agent 輸出內容在瀏覽器中顯示時，必須特別注意：若 HTML 或 JS 內容未在 UI 中正確跳脫，模型回傳的文字可能會被執行，導致資料外洩。例如，間接提示注入（indirect prompt injection）可能誘使模型插入一個 img 標籤，讓瀏覽器將 session 內容傳送到第三方網站；或是構造 URL，若被點擊則會將資料送往外部網站。正確跳脫這類內容，必須確保模型產生的文字不會被瀏覽器當作程式碼解讀執行。
