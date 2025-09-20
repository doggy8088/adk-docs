# Workflow Agents（工作流程代理）

本節介紹「*Workflow Agents（工作流程代理）*」——**專門用於控制其子代理（sub-agents）執行流程的特殊代理**。

Workflow Agents（工作流程代理）是 Agent Development Kit (ADK)（ADK）中專為**協調子代理執行流程**而設計的特殊元件。它們的主要角色是管理其他代理如何（how）以及何時（when）執行，並定義整個流程的控制邏輯。

與[LLM Agents（大型語言模型代理）](../llm-agents.md)不同，LLM Agents 會利用大型語言模型（Large Language Model, LLM）進行動態推理與決策，Workflow Agents 則是根據**預先定義的邏輯**運作。它們會依據自身類型（例如：順序、平行、迴圈）來決定執行順序，流程協調本身不會諮詢 LLM，因此具有**可預測且確定性的執行模式**。

ADK 提供三種核心的 Workflow Agent（工作流程代理）類型，每一種都實現了不同的執行模式：

<div class="grid cards" markdown>

- :material-console-line: **Sequential Agents（順序代理）**

    ---

    依**順序**一個接一個地執行子代理。

    [:octicons-arrow-right-24: 進一步了解](sequential-agents.md)

- :material-console-line: **Loop Agents（迴圈代理）**

    ---

    **重複**執行其子代理，直到符合特定終止條件為止。

    [:octicons-arrow-right-24: 進一步了解](loop-agents.md)

- :material-console-line: **Parallel Agents（平行代理）**

    ---

    以**平行**方式同時執行多個子代理。

    [:octicons-arrow-right-24: 進一步了解](parallel-agents.md)

</div>

## 為什麼要使用 Workflow Agents（工作流程代理）？

當你需要明確控制一系列任務或代理的執行方式時，Workflow Agents（工作流程代理）就顯得非常重要。它們提供：

* **可預測性：** 根據代理類型與設定，執行流程有明確保證。
* **可靠性：** 確保任務始終依照所需的順序或模式執行。
* **結構性：** 讓你能在清楚的控制結構下，組合多個代理以建構複雜流程。

雖然 Workflow Agent（工作流程代理）以確定性方式管理控制流程，但其協調的子代理可以是任何類型的代理，包括智慧型的 LLM Agent（大型語言模型代理）實例。這讓你能將結構化的流程控制與靈活、由 LLM 驅動的任務執行結合起來。
