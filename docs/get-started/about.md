# Agent Development Kit (ADK)

<p style="text-align:center;"> <b> 無縫打造、評估與部署 agent！</b> </p>

Agent Development Kit (ADK) 旨在協助開發者
建構、管理、評估與部署 AI 驅動的 agent。它提供一個強大且彈性的環境，
可用於建立對話式與非對話式 agent，能夠處理複雜的任務與工作流程。

![intro_components.png](../assets/adk-components.png)

## 核心概念

Agent Development Kit (ADK) 圍繞幾個關鍵原語與概念設計，
讓其既強大又靈活。以下是核心要點：

* **agent：** 針對特定任務設計的基本工作單元。agent 可以
  使用大型語言模型 (LLM)（`LlmAgent`）進行複雜推理，或作為執行流程的確定性控制器，
  這類 agent 稱為「[workflow agent](../agents/workflow-agents/index.md)」（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）。
* **tool：** 賦予 agent 超越對話的能力，讓其能與外部 API 互動、搜尋資訊、執行程式碼或呼叫其他服務。
* **callbacks：** 由你提供的自訂程式碼片段，可在 agent 流程的特定階段執行，
  用於檢查、記錄或修改行為。
* **Session Management（`Session` & `State`）：** 管理單一
  conversation（`Session`）的上下文，包括其歷史紀錄（`Events`）以及 agent
  在該 conversation 的工作記憶體（`State`）。
* **Memory：** 讓 agent 能夠在*多個* session 間記住使用者資訊，
  提供長期上下文（不同於短期 session `State`）。
* **Artifact Management（`Artifact`）：** 允許 agent 儲存、載入及管理
  與 session 或使用者相關的檔案或二進位資料（如圖片、PDF）。
* **Code Execution：** agent（通常透過 Tool）產生並執行程式碼，
  以完成複雜運算或動作的能力。
* **Planning：** 進階能力，讓 agent 能將複雜目標拆解為小步驟，
  並規劃如何達成，類似 ReAct 規劃器。
* **Models：** 支撐 `LlmAgent` 的底層大型語言模型 (LLM)，
  賦予其推理與語言理解能力。
* **Event：** 溝通的基本單位，代表 session 過程中發生的事件
  （如使用者訊息、agent 回覆、tool 使用），共同構成對話歷史。
* **Runner：** 管理執行流程的引擎，根據 Event 協調 agent 互動，
  並與後端服務協作。

***注意：** 多模態串流、評估、部署、除錯與追蹤等功能也是 ADK 生態系的一部分，支援即時互動與開發生命週期。*

## 主要功能

Agent Development Kit (ADK) 為開發 agent 應用提供多項關鍵優勢：

1. **多代理系統設計：** 輕鬆打造由多個專業 agent 組成的應用，並可階層式排列。
   agent 能協作處理複雜任務，透過 LLM 驅動的任務轉移或明確的 `AgentTool` 呼叫分派子任務，
   實現模組化與可擴展的解決方案。
2. **豐富的工具生態系：** 為 agent 配備多元能力。ADK
   支援整合自訂函式（`FunctionTool`）、將其他 agent 作為 tool 使用（`AgentTool`）、
   利用內建功能如程式碼執行，以及與外部資料源與 API（如搜尋、資料庫）互動。
   支援長時間執行的 tool，能有效處理非同步操作。
3. **彈性協作流程：** 可利用內建 workflow agent（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）
   搭配 LLM 驅動的動態路由，定義複雜 agent 工作流程。這同時支援可預測的處理管線與
   自適應 agent 行為。
4. **整合式開發工具：** 輕鬆在本地開發與反覆調整。
   ADK 提供命令列介面 (CLI) 與 Developer UI，可用於執行 agent、檢查執行步驟
   （event、狀態變更）、除錯互動，以及視覺化 agent 定義。
5. **原生串流支援：** 以原生雙向串流（文字與語音）打造即時互動體驗。
   這可無縫整合底層能力，如
   [Gemini Developer API 的 Multimodal Live API](https://ai.google.dev/gemini-api/docs/live)
   （或
   [Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)），
   通常僅需簡單設定即可啟用。
6. **內建 agent 評估：** 系統化評估 agent 表現。
   框架內建工具，可建立多輪評測資料集，並於本地（透過 CLI 或 dev UI）執行評估，
   以衡量品質並指引改進方向。
7. **廣泛的大型語言模型 (LLM) 支援：** 框架雖針對 Google 的 Gemini 模型最佳化，
   但設計上具高度彈性，可透過 `BaseLlm` 介面整合各種 LLM
   （包含開源或微調模型）。
8. **Artifact 管理：** 讓 agent 能處理檔案與二進位資料。
   框架提供機制（`ArtifactService`、context 方法），
   讓 agent 在執行過程中儲存、載入與管理版本化 artifact，如圖片、文件或產生的報告。
9. **可擴充性與互通性：** ADK 推動開放生態系。
   除了提供核心工具，也讓開發者能輕鬆整合與重用其他主流 agent 框架（如 LangChain、CrewAI）的工具。
10. **狀態與記憶體管理：** 自動處理短期對話記憶體（`State`，於 `Session` 內）
    由 `SessionService` 管理。亦提供長期 `Memory` 服務的整合點，
    讓 agent 能跨多個 session 記住使用者資訊。

![intro_components.png](../assets/adk-lifecycle.png)

## 開始使用

* 準備好打造你的第一個 agent 了嗎？[立即體驗快速開始](./quickstart.md)
