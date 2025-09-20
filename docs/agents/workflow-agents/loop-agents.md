# Loop agents

## `LoopAgent`

`LoopAgent` 是一種 workflow agent（工作流程 agent），能夠以迴圈（即反覆執行）的方式執行其子 agent。它會**_重複執行_ 一連串的 agent**，直到達到指定的迭代次數，或滿足終止條件為止。

當你的工作流程需要重複執行或逐步優化（例如反覆修訂程式碼）時，請使用 `LoopAgent`。

### 範例

* 假設你想建立一個能夠產生食物圖片的 agent，但有時當你希望產生特定數量的物品（例如 5 根香蕉）時，產生的圖片卻出現不同數量的物品（例如出現 7 根香蕉）。你有兩個工具：`Generate Image`、`Count Food Items`。由於你希望持續產生圖片，直到正確產生指定數量的物品，或達到一定的迭代次數為止，因此你應該使用 `LoopAgent` 來建構你的 agent。

如同其他[workflow agent](index.md)，`LoopAgent` 並非由大型語言模型 (LLM) 驅動，因此其執行方式是可預期且具決定性的。不過，workflow agent 只負責執行流程（例如在迴圈中），而不涉及內部邏輯；workflow agent 的工具或子 agent 可以選擇是否使用大型語言模型 (LLM)。

### 運作方式

當呼叫 `LoopAgent` 的 `Run Async` 方法時，會執行以下動作：

1. **子 agent 執行：** 依序遍歷子 agent 清單。對於_每一個_子 agent，會呼叫該 agent 的 `Run Async` 方法。
2. **終止條件檢查：**

    _關鍵在於_，`LoopAgent` 本身_不會_自動決定何時停止迴圈。你_必須_實作終止機制，以避免無限迴圈。常見策略包括：

    * **最大迭代次數：** 在 `LoopAgent` 中設定最大迭代次數。**當達到該次數時，迴圈會自動終止**。
    * **由子 agent 升級終止：** 設計一個或多個子 agent 來判斷條件（例如：「文件品質是否足夠好？」「是否已達成共識？」）。如果條件達成，子 agent 可以發出終止訊號（例如透過觸發自訂事件、在共用 context 設定旗標，或回傳特定值）。

![Loop Agent](../../assets/loop-agent.png)

### 完整範例：文件逐步優化

想像一個你希望反覆優化文件的情境：

* **Writer Agent：** `LlmAgent`，負責產生或修訂主題草稿。
* **Critic Agent：** `LlmAgent`，負責評論草稿並指出可改進之處。

    ```py
    LoopAgent(sub_agents=[WriterAgent, CriticAgent], max_iterations=5)
    ```

在這個設定中，`LoopAgent` 會負責管理整個反覆執行（迭代）的流程。`CriticAgent` 可以**設計為當文件達到滿意的品質水準時回傳 "STOP" 訊號**，以避免進行更多次的迭代。或者，也可以利用 `max iterations` 參數來限制流程最多執行固定次數，或是實作外部邏輯來決定何時停止。**此迴圈最多會執行五次**，確保反覆優化不會無限持續下去。

???+ "完整程式碼"

    === "Python"
        ```py
        --8<-- "examples/python/snippets/agents/workflow-agents/loop_agent_doc_improv_agent.py:init"
        ```
    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/workflow/LoopAgentExample.java:init"
        ```

