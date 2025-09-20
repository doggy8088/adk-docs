# AI Agents 的安全性與資安

## 概覽

隨著 AI agents 能力日益提升，確保其運作安全、資安無虞並符合您的品牌價值觀變得至關重要。未受控的 agent 可能帶來風險，包括執行不符預期或有害的行為（如資料外洩）、產生不當內容，進而影響品牌聲譽。**風險來源包括指令不明確、模型幻覺、惡意用戶的 jailbreak 與 prompt injection，以及透過工具間接注入的 prompt。**

[Google Cloud Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/overview) 採用多層防護機制來降低這些風險，協助您打造強大且值得信賴的 agent。它提供多種機制來建立嚴格的邊界，確保 agent 只執行您明確允許的行為：

1. **身份與授權（Identity and Authorization）**：透過設定 agent 與用戶的授權，控制 agent 以誰的身份執行行為。
2. **輸入與輸出防護欄（Guardrails）**：精確控管您的模型與工具呼叫 (tool calls)。

    * *工具內防護欄（In-Tool Guardrails）：* 以防禦性思維設計工具，利用開發者設定的 Tool Context 強制執行政策（例如僅允許查詢特定資料表）。
    * *內建 Gemini 安全功能：* 若使用 Gemini 模型，可利用內容過濾器阻擋有害輸出，並透過系統指令引導模型行為與安全準則。
    * *Callbacks 與插件（Plugins）：* 在執行前後驗證模型與工具呼叫 (tool calls)，根據 agent 狀態或外部政策檢查參數。
    * *以 Gemini 作為安全防護欄：* 透過 Callbacks 配置一個廉價且快速的模型（如 Gemini Flash Lite）作為額外的安全層，篩選輸入與輸出。

3. **沙盒化程式碼執行**：將模型產生的程式碼執行於沙盒環境，防止資安問題發生。
4. **評估與追蹤（Evaluation and Tracing）**：利用評估工具檢查 agent 最終輸出的品質、相關性與正確性。透過追蹤功能掌握 agent 行為，分析 agent 解決問題的步驟，包括其工具選擇、策略與效率。
5. **網路控管與 VPC-SC**：將 agent 活動限制於安全邊界（如 VPC Service Controls），防止資料外洩並降低潛在影響範圍。

## 安全性與資安風險

在實施安全措施前，請針對您的 agent 能力、領域及部署情境進行全面的風險評估。

***風險*** **來源** 包括：

* agent 指令不明確
* 惡意用戶進行 prompt injection 與 jailbreak 嘗試
* 透過工具使用間接進行 prompt injection

**風險類型** 包括：

* **目標偏離與目標腐化（Misalignment & goal corruption）**
    * 追求非預期或代理目標，導致有害結果（如「獎勵駭客」reward hacking）
    * 誤解複雜或模糊的指令
* **有害內容產生，包含品牌安全**
    * 產生有毒、仇恨、偏見、色情、歧視或非法內容
    * 品牌安全風險，例如使用違反品牌價值觀的語言或離題對話
* **不安全的行為**
    * 執行損害系統的指令
    * 進行未授權的購買或金融交易
    * 洩漏敏感個資（PII）
    * 資料外洩

## 最佳實踐

### 身份與授權（Identity and Authorization）

從資安角度來看，*工具* 在外部系統執行行為時所使用的身份，是設計上的關鍵考量。即使同一個 agent 內的不同工具可以採用不同策略，討論 agent 設定時仍需謹慎。

#### Agent-Auth

**工具以 agent 自身的身份（例如服務帳戶）與外部系統互動。** 必須在外部系統的存取政策中明確授權該 agent 身份，例如將 agent 的服務帳戶加入資料庫的 IAM 政策以取得讀取權限。這類政策能限制 agent 僅執行開發者預期的行為：例如僅給予資源的唯讀權限，無論模型如何決策，工具都無法執行寫入操作。

這種方式實作簡單，**適合所有用戶存取層級相同的 agent。** 若並非所有用戶都擁有相同存取層級，僅採用此方式並不足以保護，需搭配下述其他技術。在工具實作時，請確保產生日誌以便追蹤行為歸屬，因為所有 agent 行為都會以 agent 身份出現。

#### User Auth

工具以**「控制用戶」的身份**（例如在網頁應用程式前端互動的人類）與外部系統互動。在 Agent Development Kit (ADK) 中，這通常透過 OAuth 實作：agent 與前端互動以取得 OAuth token，然後工具在執行外部行為時使用該 token；若控制用戶本身有權執行該行為，外部系統就會授權。

User auth 的優點在於 agent 只會執行用戶本身可執行的行為，大幅降低惡意用戶濫用 agent 存取額外資料的風險。然而，多數常見的委派實作（如 OAuth scope）僅能委派固定權限範圍，這些範圍通常比 agent 實際需求更寬，因此仍需搭配下述技術進一步限制 agent 行為。

### 輸入與輸出防護欄（Guardrails to screen inputs and outputs）

#### 工具內防護欄（In-tool guardrails）

工具設計時可納入資安考量：我們能打造僅暴露期望模型執行行為的工具，其他行為一律不開放。透過限制 agent 可用的行為範圍，可決定性地消除我們不希望 agent 執行的特定類型行為。

工具內防護欄是一種設計通用且可重複使用工具的方式，這些工具暴露決定性控制項，讓開發者能針對每次工具實例設定限制。

此方法仰賴工具會接收兩種輸入：由模型設定的參數（arguments），以及由開發者可決定性設定的 [**`Tool Context`**](../tools/index.md#tool-context)。我們可以依賴這些決定性資訊來驗證模型行為是否如預期。

例如，一個查詢工具可設計成從 Tool Context 讀取政策。

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

在工具執行期間，[**`Tool Context`**](../tools/index.md#tool-context) 會被傳遞給該工具：

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

* **內容安全過濾器**：[內容過濾器](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-attributes) 可協助阻擋有害內容的輸出。這些過濾器獨立於 Gemini 模型運作，作為多層防禦的一環，用以防範試圖破解模型的威脅行為者。部署於 Vertex AI 的 Gemini 模型使用兩種類型的內容過濾器：  
* **不可設定的安全過濾器** 會自動阻擋包含違禁內容的輸出，例如兒童性虐待材料（CSAM）及個人可識別資訊（PII）。  
* **可設定的內容過濾器** 允許你根據四種傷害類別（仇恨言論、騷擾、露骨性內容與危險內容）的機率與嚴重程度分數，自行定義阻擋門檻。這些過濾器預設為關閉，但你可以依需求進行設定。  
* **安全性系統指令**：[系統指令](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/safety-system-instructions) 可針對 Vertex AI 上的 Gemini 模型，直接指引模型如何行為，以及應產生何種類型的內容。透過明確的指令，你可以主動引導模型避免產生不符合組織需求的不良內容。你可以撰寫系統指令，訂定內容安全規範，例如禁止與敏感主題、免責聲明語句，以及品牌安全指引，確保模型輸出符合你品牌的語調、價值觀與目標受眾。

雖然這些措施對內容安全有強力防護，但你仍需額外檢查，以降低 agent 不符預期行為、不安全操作及品牌安全風險。

#### Callbacks 與插件的安全防護

Callbacks 提供一種簡單、針對 agent 的方法，可為工具與模型的 I/O 增加前置驗證；而插件則能在多個 agent 間實現通用安全政策的可重用解決方案。

當無法直接修改工具以加入防護措施時，可以使用 [**`Before Tool Callback`**](../callbacks/types-of-callbacks.md#before-tool-callback) 函式來為呼叫新增前置驗證。Callback 可存取 agent 的狀態、所請求的工具與參數。這種方式非常通用，甚至可以用來建立可重複使用的工具政策共用程式庫。然而，若強制執行防護措施所需的資訊未直接顯示於參數中，則不一定適用於所有工具。

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

然而，當你要為 agent 應用程式加入安全防護措施時，建議使用插件（Plugin）來實作不特定於單一 agent 的政策。插件設計為自給自足且模組化，讓你可以針對特定安全政策建立獨立的插件，並在 Runner 層級全域套用。這表示安全插件只需設定一次，即可套用到所有使用該 Runner 的 agent，確保整個應用程式的一致安全防護，無需重複撰寫程式碼。

以下是一些範例：

* **Gemini as a Judge Plugin**：此插件使用 Gemini Flash Lite 來評估使用者輸入、工具輸入與輸出，以及 agent 的回應，檢查其適當性、提示詞注入（prompt injection）與越獄（jailbreak）偵測。該插件將 Gemini 配置為安全過濾器，以降低內容安全、品牌安全及 agent 行為偏離的風險。插件會將使用者輸入、工具輸入與輸出、模型輸出傳遞給 Gemini Flash Lite，由其判斷傳給 agent 的輸入是否安全。如果 Gemini 判斷輸入不安全，agent 會回傳預設回應：「很抱歉，我無法協助這個問題。還有其他我可以幫忙的嗎？」

* **Model Armor Plugin**：這個插件會在 agent 執行的特定階段查詢 model armor API，以檢查潛在的內容安全違規。與 _Gemini as a Judge_ 插件類似，若 Model Armor 偵測到有害內容，則會回傳預設回應給使用者。

* **PII Redaction Plugin**：這是一個專為 [Before Tool Callback](/adk-docs/plugins/#tool-callbacks) 設計的插件，專門用於在資料被工具處理或傳送到外部服務前，先將個人可識別資訊（PII）遮蔽。

### 沙箱化程式碼執行（Sandboxed Code Execution）

程式碼執行是一項具有額外安全考量的特殊工具：必須使用沙箱（sandboxing）來防止模型產生的程式碼危及本地環境，避免潛在的安全問題。

Google 與 Agent Development Kit (ADK) 提供多種安全執行程式碼的選項。[Vertex Gemini Enterprise API 程式碼執行功能](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/code-execution-api) 讓 agent 能夠啟用 `tool_execution` 工具，在伺服器端利用沙箱化的程式碼執行。若需進行資料分析的程式碼，你可以使用 ADK 內建的 [Code Executor](../tools/built-in-tools.md#code-execution) 工具來呼叫 [Vertex Code Interpreter Extension](https://cloud.google.com/vertex-ai/generative-ai/docs/extensions/code-interpreter)。

如果上述選項都無法滿足你的需求，你也可以利用 ADK 提供的基礎元件自行建構程式碼執行器。我們建議建立具備密閉性（hermetic）的執行環境：不允許網路連線與 API 呼叫，以避免資料外洩；並且在每次執行後徹底清除資料，避免跨使用者資料外洩的疑慮。

### 評估（Evaluations）

請參閱 [Evaluate Agents](../evaluate/index.md)。

### VPC-SC 邊界與網路管控

如果你在 VPC-SC 邊界內執行 agent，這將確保所有 API 呼叫僅操作邊界內的資源，降低資料外洩的風險。

然而，身份與邊界僅能對 agent 行為提供粗略的控管。工具使用防護措施（tool-use guardrails）可彌補這些限制，讓 agent 開發者能更細緻地控制允許哪些行為。

### 其他安全風險

#### 在 UI 中務必跳脫模型產生的內容

當 agent 輸出內容在瀏覽器中顯示時必須特別小心：如果 HTML 或 JS 內容在 UI 中未正確跳脫，模型回傳的文字可能會被執行，導致資料外洩。例如，間接提示詞注入（indirect prompt injection）可能誘使模型插入 img 標籤，讓瀏覽器將 session 內容傳送到第三方網站；或是構造 URL，若被點擊則將資料送往外部網站。正確跳脫這類內容，必須確保模型產生的文字不會被瀏覽器解讀為程式碼。
