# 平行代理（Parallel agents）

`ParallelAgent` 是一種[工作流程代理（workflow agent）](index.md)，能夠*同時*執行其子代理（sub-agent）。這對於可獨立執行任務的流程來說，能大幅提升速度。

當你需要優先考慮速度，且任務彼此獨立且資源密集時，建議使用 `ParallelAgent`。`ParallelAgent` 能有效促進平行執行（parallel execution）。**只要子代理之間沒有相依關係，其任務就能同時進行**，大幅縮短整體處理時間。

如同其他[工作流程代理（workflow agent）](index.md)一樣，`ParallelAgent` 並非由大型語言模型 (LLM) 驅動，因此其執行方式是確定性的。不過，工作流程代理僅負責執行（例如：平行執行子代理），而不涉及子代理的內部邏輯；至於工具或子代理本身，則可能會或不會使用大型語言模型 (LLM)。

### 範例

這種方式特別適合多來源資料擷取或大量運算等操作，能透過平行化獲得顯著效能提升。需要注意的是，這種策略假設同時執行的代理之間**不需要共享狀態或直接交換資訊**。

### 運作方式

當呼叫 `ParallelAgent` 的 `run_async()` 方法時：

1. **同時執行（Concurrent Execution）：** 會*同時*啟動 `sub_agents` 清單中*每一個*子代理的 `run_async()` 方法。這表示所有代理會（大致上）在同一時間開始執行。
2. **獨立分支（Independent Branches）：** 每個子代理都在自己的執行分支中運作。**在執行過程中，這些分支之間*不會自動*共享對話歷史或狀態。**
3. **結果收集（Result Collection）：** `ParallelAgent` 會管理平行執行，並通常提供方式讓你在所有子代理完成後存取各自的結果（例如：透過結果清單或事件）。結果的順序可能不是確定性的。

### 獨立執行與狀態管理

*務必*理解，`ParallelAgent` 內的子代理是獨立執行的。如果你*需要*這些代理之間進行溝通或資料共享，必須自行實作。可行的方法包括：

* **共享 `InvocationContext`：** 你可以將同一個 `InvocationContext` 物件傳遞給每個子代理，讓它作為共享資料儲存區。不過，必須謹慎管理對這個共享 context 的同時存取（例如：使用鎖定機制），以避免競爭條件（race conditions）。
* **外部狀態管理：** 使用外部資料庫、訊息佇列或其他機制來管理共享狀態，並協助代理之間的溝通。
* **後處理（Post-Processing）：** 收集每個分支的結果，然後實作協調資料的邏輯。

![Parallel Agent](../../assets/parallel-agent.png){: width="600"}

### 完整範例：平行網路研究

想像你要同時研究多個主題：

1. **研究員代理 1：** `LlmAgent`，負責研究「再生能源來源」。
2. **研究員代理 2：** `LlmAgent`，負責研究「電動車技術」。
3. **研究員代理 3：** `LlmAgent`，負責研究「碳捕捉方法」。

    ```py
    ParallelAgent(sub_agents=[ResearcherAgent1, ResearcherAgent2, ResearcherAgent3])
    ```

這些研究任務彼此獨立。使用`ParallelAgent`可以讓它們同時執行（平行執行），與依序執行相比，有機會大幅縮短整體研究所需時間。每個代理（agent）完成後，其結果會分別被收集。

???+ "Full Code"

    === "Python"
        ```py
         --8<-- "examples/python/snippets/agents/workflow-agents/parallel_agent_web_research.py:init"
        ```
    === "Java"
        ```java
         --8<-- "examples/java/snippets/src/main/java/agents/workflow/ParallelResearchPipeline.java:full_code"
        ```
