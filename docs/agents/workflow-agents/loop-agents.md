# Loop agents

## `LoopAgent`

`LoopAgent` 是一種 workflow agent（工作流程代理），會以迴圈（即反覆執行）的方式執行其子代理。它會**_重複執行_ 一系列代理**，直到達到指定的迭代次數，或是符合終止條件為止。

當你的工作流程涉及重複或漸進式優化（例如反覆修訂程式碼）時，可以使用 `LoopAgent`。

### 範例

* 假設你想建立一個能夠產生食物圖片的代理，但有時候你希望產生特定數量的物品（例如 5 根香蕉），卻會產生不同數量（例如圖片中有 7 根香蕉）。你有兩個工具：`Generate Image`、`Count Food Items`。由於你希望持續產生圖片，直到正確產生指定數量的物品，或達到一定迭代次數為止，因此你應該使用 `LoopAgent` 來建立你的代理。

如同其他 [workflow agents](index.md)，`LoopAgent` 並非由大型語言模型 (LLM) 驅動，因此其執行方式是確定性的。不過，workflow agent 只負責執行流程（例如迴圈），而不處理內部邏輯；workflow agent 的工具或子代理可能會使用大型語言模型 (LLM)，也可能不使用。

### 運作方式

當呼叫 `LoopAgent` 的 `Run Async` 方法時，會執行以下動作：

1. **子代理執行：** 會依序遍歷 Sub Agents（子代理）清單。對於_每一個_子代理，會呼叫該代理的 `Run Async` 方法。
2. **終止條件檢查：**

    _關鍵在於_，`LoopAgent` 本身並_不會_自動決定何時停止迴圈。你_必須_實作終止機制，以避免無限迴圈。常見策略包括：

    * **最大迭代次數：** 在 `LoopAgent` 設定最大迭代次數。**迴圈會在達到該次數後終止**。
    * **由子代理升級終止：** 設計一個或多個子代理來判斷條件（例如「文件品質是否足夠好？」「是否已達成共識？」）。如果條件成立，子代理可以發出終止訊號（例如觸發自訂事件、在共用 context 設定旗標，或回傳特定值）。

![Loop Agent](../../assets/loop-agent.png)

### 完整範例：文件漸進式優化

假設有一個情境，你希望反覆優化文件：

* **Writer Agent（撰寫代理）：** `LlmAgent`，負責產生或修訂主題草稿。
* **Critic Agent（評論代理）：** `LlmAgent`，負責評論草稿，指出可改進之處。

    ```py
    LoopAgent(sub_agents=[WriterAgent, CriticAgent], max_iterations=5)
    ```

在這個設定中，`LoopAgent` 將負責管理整個反覆運算的流程。`CriticAgent` 可以**設計為當文件達到令人滿意的品質水準時回傳 "STOP" 訊號**，以防止進一步的反覆運算。或者，也可以透過 `max iterations` 參數來限制流程最多執行固定次數，或是實作外部邏輯來決定何時停止。**此迴圈最多會執行五次**，確保反覆優化不會無止境地進行。

???+ "完整程式碼"

    === "Python"
        ```py
        --8<-- "examples/python/snippets/agents/workflow-agents/loop_agent_doc_improv_agent.py:init"
        ```
    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/workflow/LoopAgentExample.java:init"
        ```

