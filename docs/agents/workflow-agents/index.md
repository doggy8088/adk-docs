# Workflow Agents

本節介紹「*workflow agents*（工作流程 agent）」——**專門用於控制其子 agent 執行流程的特殊 agent**。

Workflow agents（工作流程 agent）是 Agent Development Kit (ADK) 中專為**協調子 agent 執行流程**而設計的專用元件。它們的主要職責是管理其他 agent 的*執行時機*與*方式*，也就是定義一個流程的控制流。

與[LLM Agents](../llm-agents.md)（利用大型語言模型 (Large Language Model, LLM) 進行動態推理與決策）不同，Workflow Agents（工作流程 agent）是根據**預先定義的邏輯**運作。它們會依據自身的類型（例如：順序、迴圈、平行）來決定執行順序，而不會在協調過程中諮詢 LLM。因此，Workflow Agents 能夠實現**可預期且具決定性的執行模式**。

ADK 提供了三種核心的 workflow agent（工作流程 agent）類型，每一種都實現了不同的執行模式：

<div class="grid cards" markdown>

- :material-console-line: **Sequential Agents（順序 agent）**

    ---

    依**順序**逐一執行子 agent。

    [:octicons-arrow-right-24: 進一步了解](sequential-agents.md)

- :material-console-line: **Loop Agents（迴圈 agent）**

    ---

    **重複**執行其子 agent，直到符合特定終止條件為止。

    [:octicons-arrow-right-24: 進一步了解](loop-agents.md)

- :material-console-line: **Parallel Agents（平行 agent）**

    ---

    同時**平行**執行多個子 agent。

    [:octicons-arrow-right-24: 進一步了解](parallel-agents.md)

</div>

## 為什麼要使用 Workflow Agents？

當你需要明確控制一系列任務或 agent 的執行方式時，Workflow agents（工作流程 agent）就顯得不可或缺。它們帶來：

* **可預期性：** 根據 agent 類型與設定，執行流程有明確保證。
* **可靠性：** 確保任務始終以所需的順序或模式執行。
* **結構性：** 透過清晰的控制結構組合 agent，讓你能夠構建複雜的流程。

雖然 workflow agent（工作流程 agent）以決定性方式管理控制流，但其所協調的子 agent 可以是任何類型的 agent，包括智慧型的 LLM Agent 實例。這讓你能將結構化的流程控制與彈性的 LLM 任務執行靈活結合。
