# Agents

在 Agent Development Kit (ADK) 中，**Agent**（代理）是一個自包含的執行單元，設計用於自主行動以達成特定目標。Agent 可以執行任務、與使用者互動、運用外部工具，並與其他 agent 協作。

所有 ADK 中 agent 的基礎是 `BaseAgent` 類別。它作為最基本的藍圖。要建立可運作的 agent，通常會以三種主要方式之一擴充 `BaseAgent`，以滿足不同需求——從智慧推理到結構化流程控制。

<img src="../assets/agent-types.png" alt="Types of agents in ADK">

## 核心 Agent 分類

ADK 提供多種明確的 agent 分類，協助你打造複雜的應用：

1. [**LLM Agents（`LlmAgent`、`Agent`）**](llm-agents.md)：這些 agent 以大型語言模型 (LLM) 作為核心引擎，能理解自然語言、推理、規劃、生成回應，並動態決定後續步驟或選擇使用哪些工具，非常適合彈性且以語言為中心的任務。[深入了解 LLM Agents...](llm-agents.md)

2. [**Workflow Agents（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）**](workflow-agents/index.md)：這類專用 agent 以預先定義、可預測的模式（序列、平行或迴圈）來控制其他 agent 的執行流程，本身不使用 LLM 進行流程控制，特別適用於需要可預期執行的結構化流程。[探索 Workflow Agents...](workflow-agents/index.md)

3. [**Custom Agents**](custom-agents.md)：直接繼承 `BaseAgent` 所建立的 agent，讓你能實作獨特的操作邏輯、特定控制流程，或進行標準類型未涵蓋的特殊整合，滿足高度客製化的應用需求。[了解如何打造 Custom Agents...](custom-agents.md)

## 如何選擇合適的 Agent 類型

下表提供了高層次的比較，協助你區分各種 agent 類型。隨著你在後續章節深入探索每種類型，這些差異會更加明確。

| 功能                | LLM Agent (`LlmAgent`)                | Workflow Agent                              | Custom Agent (`BaseAgent` 子類別)           |
| :------------------- | :---------------------------------- | :------------------------------------------ |:-----------------------------------------|
| **主要功能**         | 推理、生成、工具運用               | 控制 agent 執行流程                        | 實作獨特邏輯／整合                     |
| **核心引擎**         | 大型語言模型 (LLM)                 | 預設邏輯（序列、平行、迴圈）               | 自訂程式碼                              |
| **決定性**           | 非決定性（彈性）                   | 決定性（可預測）                           | 依實作而定，皆可                        |
| **主要用途**         | 語言任務、動態決策                 | 結構化流程、協調執行                       | 客製化需求、特定工作流程                |

## Agents 協作：多 Agent 系統

雖然每種 agent 類型各有其用途，真正的強大之處往往來自於它們的組合。複雜的應用經常採用[多 agent 架構](multi-agents.md)，其中：

* **LLM Agents** 負責智慧、語言相關的任務執行。
* **Workflow Agents** 以標準模式管理整體流程。
* **Custom Agents** 提供特殊能力或規則，滿足獨特整合需求。

理解這些核心類型，是你使用 ADK 打造高階、強大 AI 應用的第一步。

---

## 下一步？

現在你已經了解 ADK 提供的各種 agent 類型，接下來可以深入學習它們的運作方式及有效使用方法：

* [**LLM Agents：**](llm-agents.md) 探索如何設定以大型語言模型為核心的 agent，包括指令設置、工具提供，以及啟用進階功能如規劃與程式碼執行。
* [**Workflow Agents：**](workflow-agents/index.md) 學習如何利用 `SequentialAgent`、`ParallelAgent` 和 `LoopAgent` 來協調結構化且可預測的流程。
* [**Custom Agents：**](custom-agents.md) 了解如何擴充 `BaseAgent`，打造具備獨特邏輯與整合能力的 agent，滿足你的專屬需求。
* [**Multi-Agents：**](multi-agents.md) 理解如何組合不同 agent 類型，建立能協同解決複雜問題的高階系統。
* [**Models：**](models.md) 認識各種 LLM 整合方式，並學會如何為你的 agent 選擇合適的模型。
