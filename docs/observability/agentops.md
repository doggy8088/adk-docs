# 使用 AgentOps 進行代理（agent）可觀測性

**只需兩行程式碼**，[AgentOps](https://www.agentops.ai) 即可為代理（agent）提供工作階段重播、指標與監控功能。

## 為什麼在 ADK 要用 AgentOps？

可觀測性是開發與部署對話式 AI 代理（agent）的關鍵要素。它能讓開發者了解代理（agent）的運作效能、與使用者的互動方式，以及代理（agent）如何使用外部工具與 API。

透過整合 AgentOps，開發者能深入洞察 ADK 代理（agent）的行為、大型語言模型 (LLM) 互動，以及工具的使用情形。

Google ADK 內建基於 OpenTelemetry 的追蹤系統，主要用於協助開發者追蹤代理（agent）內部的基本執行流程。AgentOps 則進一步提供專屬且更全面的可觀測性平台，具備以下特色：

*   **統一追蹤與重播分析：** 整合來自 ADK 及 AI 技術堆疊其他元件的追蹤資料。
*   **豐富視覺化：** 直覺式儀表板，能視覺化代理（agent）執行流程、LLM 呼叫與工具效能。
*   **詳細除錯：** 可深入檢視特定 span，查看提示詞、回應、Token 數量及錯誤資訊。
*   **LLM 成本與延遲追蹤：** 追蹤延遲、成本（依 Token 使用量計算），並找出瓶頸。
*   **簡化設定：** 只需幾行程式碼即可快速開始。

![AgentOps Agent Observability Dashboard](https://raw.githubusercontent.com/AgentOps-AI/agentops/refs/heads/main/docs/images/external/app_screenshots/overview.png)

![AgentOps Dashboard showing an ADK trace with nested agent, LLM, and tool spans.](../assets/agentops-adk-trace-example.jpg)

*AgentOps 儀表板顯示一個多步驟 ADK 應用程式執行的追蹤。你可以看到 span 的階層結構，包括主要代理（agent）工作流程、各個子代理（agent）、LLM 呼叫與工具執行。請注意清楚的階層關係：主要工作流程代理（agent）的 span 內含各種子代理（agent）操作、LLM 呼叫及工具執行的子 span。*

## 開始在 ADK 中使用 AgentOps

將 AgentOps 整合進你的 ADK 應用程式非常簡單：

1.  **安裝 AgentOps：**
    ```bash
    pip install -U agentops
    ```

2. **建立 API 金鑰**
    請在此處建立使用者 API 金鑰：[Create API Key](https://app.agentops.ai/settings/projects)，並設定您的環境：

    將您的 API 金鑰加入至環境變數：
    ```
    AGENTOPS_API_KEY=<YOUR_AGENTOPS_API_KEY>
    ```

3.  **初始化 AgentOps：**
    請在你的 Agent Development Kit (ADK) 應用程式腳本（例如，你執行 ADK 的主要 Python 檔案 `Runner`）開頭加入以下程式碼：

    ```python
    import agentops
    agentops.init()
    ```

    這將啟動一個 AgentOps 工作階段，並自動追蹤 Agent Development Kit (ADK) 代理（agent）。

    詳細範例：

    ```python
    import agentops
    import os
    from dotenv import load_dotenv

    # Load environment variables (optional, if you use a .env file for API keys)
    load_dotenv()

    agentops.init(
        api_key=os.getenv("AGENTOPS_API_KEY"), # Your AgentOps API Key
        trace_name="my-adk-app-trace"  # Optional: A name for your trace
        # auto_start_session=True is the default.
        # Set to False if you want to manually control session start/end.
    )
    ```

    > 🚨 🔑 你可以在註冊後於你的 [AgentOps Dashboard](https://app.agentops.ai/) 找到你的 AgentOps API 金鑰。建議將其設為環境變數（`AGENTOPS_API_KEY`）。

初始化後，AgentOps 會自動開始對你的 Agent Development Kit (ADK)（ADK）agent 進行自動化監控儀表化（instrumentation）。

**這就是你需要做的全部步驟，即可完整擷取 ADK agent 的所有遙測資料**

## AgentOps 如何對 ADK 進行儀表化

AgentOps 採用先進策略，能無縫提供可觀測性，同時不會與 ADK 原生遙測功能衝突：

1.  **中和 ADK 原生遙測功能：**  
    AgentOps 會偵測 ADK，並智慧地修補 ADK 內部的 OpenTelemetry tracer（通常為 `trace.get_tracer('gcp.vertex.agent')`）。它會將其替換為 `NoOpTracer`，確保 ADK 自身產生遙測 span 的行為被有效靜音。這可避免重複追蹤，並讓 AgentOps 成為唯一權威的可觀測資料來源。

2.  **AgentOps 控制的 Span 建立：**  
    AgentOps 會包裝 ADK 的關鍵方法，建立邏輯階層的 span：

    *   **Agent 執行 Span（例如 `adk.agent.MySequentialAgent`）：**  
        當 ADK agent（如 `BaseAgent`、`SequentialAgent` 或 `LlmAgent`）啟動其 `run_async` 方法時，AgentOps 會為該 agent 的執行建立一個父層 span。

    *   **大型語言模型 (LLM) 互動 Span（例如 `adk.llm.gemini-pro`）：**  
        當 agent 透過 ADK 的 `BaseLlmFlow._call_llm_async` 呼叫 LLM 時，AgentOps 會建立一個專屬的子 span，通常以 LLM 模型名稱命名。此 span 會擷取請求細節（提示詞、模型參數），並在完成時（透過 ADK 的 `_finalize_model_response_event`）記錄回應細節，如完成內容、token 使用量及結束原因。

    *   **工具使用 Span（例如 `adk.tool.MyCustomTool`）：**  
        當 agent 透過 ADK 的 `functions.__call_tool_async` 使用工具時，AgentOps 會建立一個以工具名稱命名的完整子 span。此 span 會包含工具的輸入參數及其回傳結果。

3.  **豐富屬性收集：**  
    AgentOps 會重用 ADK 內部的資料擷取邏輯，並修補 ADK 特定的遙測函式（如 `google.adk.telemetry.trace_tool_call`、`trace_call_llm`）。AgentOps 為這些函式設計的包裝器，會將 ADK 擷取的詳細資訊附加為*目前作用中的 AgentOps span* 的屬性。

## 在 AgentOps 中視覺化你的 ADK agent

當你用 AgentOps 對 ADK 應用程式進行儀表化後，你可以在 AgentOps dashboard 上清楚看到 agent 執行的階層式視圖。

1.  **初始化階段：**  
    當呼叫 `agentops.init()`（例如 `agentops.init(trace_name="my_adk_application")`）時，若初始化參數 `auto_start_session=True` 為 true（預設為 true），會建立一個初始父層 span。這個 span 通常會以類似 `my_adk_application.session` 的名稱出現，並作為該追蹤（trace）中所有操作的根節點。

2.  **ADK Runner 執行：**  
    當 ADK `Runner` 執行頂層 agent（例如協調工作流程的 `SequentialAgent`）時，AgentOps 會在 session trace 下建立對應的 agent span。此 span 會反映你的頂層 ADK agent 名稱（如 `adk.agent.YourMainWorkflowAgent`）。

3.  **子 agent 及 LLM／工具呼叫：**  
    當主 agent 執行其邏輯，包括呼叫子 agent、LLM 或工具時：
    *   每個**子 agent 執行**都會以巢狀子 span 形式出現在其父 agent 之下。
    *   對**大型語言模型 (LLM)** 的呼叫，會產生更深一層的子 span（如 `adk.llm.<model_name>`），詳細記錄提示詞、回應及 token 使用情形。
    *   **工具呼叫**也會產生獨立的子 span（如 `adk.tool.<your_tool_name>`），顯示其參數與結果。

這會形成一個瀑布式的 span 結構，讓你清楚掌握 ADK 應用程式每一步的順序、耗時及細節。所有相關屬性，如 LLM 提示詞、完成內容、token 數量、工具輸入／輸出及 agent 名稱，皆會被擷取並顯示。

如需實際操作示範，你可以參考一個以 Jupyter Notebook 展示、結合 Google ADK 與 AgentOps 的人工審核工作流程範例：  
[Google ADK Human Approval Example on GitHub](https://github.com/AgentOps-AI/agentops/blob/main/examples/google_adk_example/adk_human_approval_example.ipynb)。

此範例展示了多步驟 agent 流程及工具使用，如何在 AgentOps 中被視覺化呈現。

## 優勢

*   **輕鬆設定：** 只需極少程式碼變更，即可完整追蹤 ADK。
*   **深度可視化：** 了解複雜 ADK agent 流程的內部運作。
*   **加速除錯：** 透過詳細追蹤資料，快速定位問題。
*   **效能最佳化：** 分析延遲與 token 使用情形。

整合 AgentOps 後，ADK 開發者能大幅提升建構、除錯與維護強健 AI agent 的能力。

## 進一步資訊

立即 [建立 AgentOps 帳號](http://app.agentops.ai) 開始使用。如有功能需求或錯誤回報，請聯絡 AgentOps 團隊，詳見 [AgentOps Repo](https://github.com/AgentOps-AI/agentops)。

### 其他連結
🐦 [Twitter](http://x.com/agentopsai)   •   📢 [Discord](http://x.com/agentopsai)   •   🖇️ [AgentOps Dashboard](http://app.agentops.ai)   •   📙 [Documentation](http://docs.agentops.ai)
