# Agent Development Kit (ADK)

<p style="text-align:center;"> <b> 無縫打造、評估與部署 agent！</b> </p>

Agent Development Kit (ADK) 專為協助開發者打造、管理、評估與部署 AI 驅動的 agent 而設計。ADK 提供一個強大且彈性的環境，讓你能夠建立對話型與非對話型 agent，處理複雜任務與工作流程。

![intro_components.png](../assets/adk-components.png)

## 核心概念

Agent Development Kit (ADK) 圍繞幾個關鍵原語與概念設計，讓其既強大又靈活。以下是重點說明：

* **agent：** 針對特定任務設計的基本工作單元。agent 可以運用大型語言模型 (LLM)（`LlmAgent`）進行複雜推理，或作為執行流程的確定性控制器，這類 agent 稱為「[workflow agent](../agents/workflow-agents/index.md)」（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）。
* **tool：** 讓 agent 擁有超越對話的能力，能與外部 API 互動、搜尋資訊、執行程式碼或呼叫其他服務。
* **Callbacks：** 你可自訂的程式碼片段，於 agent 執行過程中的特定時機點執行，用於檢查、記錄或修改行為。
* **Session Management（`Session` & `State`）：** 負責處理單一對話（`Session`）的上下文，包括其歷史紀錄（`Events`）以及該對話的 agent 工作記憶體（`State`）。
* **Memory：** 讓 agent 能夠在*多個* session 間記住使用者資訊，提供長期上下文（有別於短期 session `State`）。
* **Artifact Management（`Artifact`）：** 允許 agent 儲存、載入與管理與 session 或使用者相關的檔案或二進位資料（如圖片、PDF）。
* **Code Execution：** 讓 agent（通常透過 Tool）能夠產生並執行程式碼，以完成複雜計算或動作。
* **Planning：** 進階功能，agent 能將複雜目標拆解為更小步驟並規劃如何達成，類似 ReAct 規劃器。
* **Models：** 提供 agent 推理與語言理解能力的底層大型語言模型 (LLM)。
* **Event：** 溝通的基本單位，代表 session 過程中發生的事件（如使用者訊息、agent 回覆、工具使用），共同構成對話歷史。
* **Runner：** 管理執行流程的引擎，根據 Event 協調 agent 互動，並與後端服務協作。

***注意：** 多模態串流、評估、部署、除錯與追蹤等功能，也是 ADK 生態系的一部分，支援即時互動與開發生命週期。*

## 主要功能

Agent Development Kit (ADK) 為開發 agent 應用提供多項關鍵優勢：

1. **多 agent 系統設計：** 輕鬆打造由多個專業化 agent 層級組成的應用。agent 可協作處理複雜任務，透過 LLM 驅動的轉移或明確的 `AgentTool` 呼叫分派子任務，實現模組化與可擴展的解決方案。
2. **豐富的工具生態系：** 為 agent 配備多元能力。ADK 支援整合自訂函式（`FunctionTool`）、將其他 agent 作為工具使用（`AgentTool`）、運用內建功能如程式碼執行，並可與外部資料來源與 API（如搜尋、資料庫）互動。對長時間執行工具的支援，亦能有效處理非同步操作。
3. **彈性的協作流程：** 可利用內建 workflow agent（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）與 LLM 驅動的動態路由，定義複雜 agent 工作流程。這同時支援可預測的流程管線與自適應 agent 行為。
4. **整合開發者工具：** 輕鬆於本地開發與迭代。ADK 內建命令列介面 (Command Line Interface, CLI) 與開發者 UI，可用於執行 agent、檢查執行步驟（事件、狀態變更）、除錯互動並視覺化 agent 定義。
5. **原生串流支援：** 以原生雙向串流（文字與語音）打造即時互動體驗。這可無縫整合底層能力，如
   [Gemini Developer API 的 Multimodal Live API](https://ai.google.dev/gemini-api/docs/live)
   （或
   [Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)），
   且通常僅需簡單設定即可啟用。
6. **內建 agent 評估：** 系統性評估 agent 表現。框架內建工具，可建立多輪評測資料集，並於本地（透過 CLI 或開發者 UI）執行評測，量化品質並指引改進方向。
7. **廣泛 LLM 支援：** 框架雖針對 Google 的 Gemini 模型最佳化，但設計上具備彈性，可透過 `BaseLlm` 介面整合各種大型語言模型 (LLM)（包含開源或微調模型）。
8. **Artifact Management：** 讓 agent 能處理檔案與二進位資料。框架提供機制（`ArtifactService`、context 方法），讓 agent 在執行期間可儲存、載入與管理如圖片、文件或產生報告等具版本控制的 artifact。
9. **可擴充性與互通性：** ADK 推動開放生態系。除內建核心工具外，亦允許開發者輕鬆整合與重用其他主流 agent 框架（如 LangChain、CrewAI）的工具。
10. **狀態與記憶體管理：** 自動處理短期對話記憶體（`State` 於 `Session` 內）由 `SessionService` 管理。亦提供長期 `Memory` 服務整合點，讓 agent 能跨多個 session 記住使用者資訊。

![intro_components.png](../assets/adk-lifecycle.png)

## 快速開始

* 準備好打造你的第一個 agent 了嗎？[立即體驗快速開始](./quickstart.md)
