# Parallel agents

`ParallelAgent` 是一種[工作流程 agent](index.md)，能夠*同時*執行其子 agent。這對於可獨立執行的任務來說，能大幅加快工作流程的速度。

當你遇到以下情境時，請使用 `ParallelAgent`：若你的場景以速度為優先，且包含獨立且資源密集的任務，`ParallelAgent` 能有效促進高效的平行執行。**當子 agent 之間沒有相依關係時，這些任務可以同時執行**，大幅縮短整體處理時間。

如同其他[工作流程 agent](index.md)，`ParallelAgent` 並非由大型語言模型 (LLM) 驅動，因此其執行方式是確定性的。不過，工作流程 agent 只負責執行（例如：平行執行子 agent），而不涉及其內部邏輯；工作流程 agent 的工具或子 agent 可能會，也可能不會使用大型語言模型 (LLM)。

### 範例

這種方法特別適合多來源資料擷取或大量運算等操作，在這些情境下，平行化能帶來顯著的效能提升。重要的是，這種策略假設同時執行的 agent 之間**不需要共用狀態或直接資訊交換**。

### 運作方式

當呼叫 `ParallelAgent` 的 `run_async()` 方法時：

1. **同時執行：** 會*同時*啟動 `sub_agents` 清單中*每一個*子 agent 的 `run_async()` 方法。這代表所有 agent 幾乎在同一時間開始執行。
2. **獨立分支：** 每個子 agent 都在自己的執行分支中運作。**在執行期間，這些分支之間*不會自動*共用對話歷史或狀態。**
3. **結果收集：** `ParallelAgent` 會管理平行執行，並通常提供一種方式讓你在所有子 agent 完成後存取各自的結果（例如：透過結果清單或事件）。結果的順序可能不是確定性的。

### 獨立執行與狀態管理

*務必*理解，`ParallelAgent` 內的子 agent 是獨立執行的。如果你*需要*這些 agent 之間進行通訊或資料共享，必須自行實作。可能的做法包括：

* **共用 `InvocationContext`：** 你可以將共用的 `InvocationContext` 物件傳遞給每個子 agent。這個物件可以作為共用的資料儲存區。不過，你需要謹慎管理對這個共用 context 的同時存取（例如：使用鎖定機制），以避免競爭條件。
* **外部狀態管理：** 使用外部資料庫、訊息佇列或其他機制來管理共用狀態，並協助 agent 之間的通訊。
* **後處理：** 收集每個分支的結果，然後實作協調資料的邏輯。

![Parallel Agent](../../assets/parallel-agent.png){: width="600"}

### 完整範例：平行網路研究

想像你要同時研究多個主題：

1. **研究員 Agent 1：** 一個 `LlmAgent`，負責研究「再生能源來源」。
2. **研究員 Agent 2：** 一個 `LlmAgent`，負責研究「電動車技術」。
3. **研究員 Agent 3：** 一個 `LlmAgent`，負責研究「碳捕捉方法」。

    ```py
    ParallelAgent(sub_agents=[ResearcherAgent1, ResearcherAgent2, ResearcherAgent3])
    ```

這些研究任務彼此獨立。使用 `ParallelAgent` 可以讓它們同時執行（平行執行），與依序執行相比，有機會大幅縮短整體研究所需的時間。每個 agent 執行完畢後，其結果會分別被收集。

???+ "Full Code"

    === "Python"
        ```py
         --8<-- "examples/python/snippets/agents/workflow-agents/parallel_agent_web_research.py:init"
        ```
    === "Java"
        ```java
         --8<-- "examples/java/snippets/src/main/java/agents/workflow/ParallelResearchPipeline.java:full_code"
        ```
