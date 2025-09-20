# Sequential agents

## `SequentialAgent`

`SequentialAgent` 是一種[工作流程 agent](index.md)，會依照列表中指定的順序執行其子 agent。

當你希望執行順序是固定且嚴格時，請使用 `SequentialAgent`。

### 範例

* 你想建立一個能摘要任意網頁的 agent，並使用兩個工具：`Get Page Contents` 和 `Summarize Page`。由於 agent 必須在呼叫 `Summarize Page` 前先呼叫 `Get Page Contents`（不能無中生有地摘要！），因此你應該使用 `SequentialAgent` 來建立你的 agent。

如同其他[工作流程 agent](index.md)，`SequentialAgent` 並非由大型語言模型 (LLM) 驅動，因此其執行方式是確定性的。需要注意的是，工作流程 agent 只關心執行順序（即依序執行），而不涉及內部邏輯；工作流程 agent 的工具或子 agent 可以使用 LLM，也可以不使用。

### 運作方式

當呼叫 `SequentialAgent` 的 `Run Async` 方法時，會執行以下動作：

1. **迭代：** 依照提供的順序，遍歷子 agent 列表。
2. **子 agent 執行：** 對列表中的每個子 agent，呼叫該子 agent 的 `Run Async` 方法。

![Sequential Agent](../../assets/sequential-agent.png){: width="600"}

### 完整範例：程式碼開發流程

以簡化的程式碼開發流程為例：

* **Code Writer Agent：** 由大型語言模型 (LLM) 驅動的 agent，根據規格產生初始程式碼。
* **Code Reviewer Agent：** 由大型語言模型 (LLM) 驅動的 agent，負責檢查產生的程式碼是否有錯誤、風格問題，以及是否符合最佳實踐。它會接收 Code Writer Agent 的輸出。
* **Code Refactorer Agent：** 由大型語言模型 (LLM) 驅動的 agent，接收經過審查的程式碼（以及審查者的評論），並進行重構以提升品質並解決問題。

`SequentialAgent` 非常適合用於這種情境：

```py
SequentialAgent(sub_agents=[CodeWriterAgent, CodeReviewerAgent, CodeRefactorerAgent])
```

這可確保程式碼會先被撰寫，*接著*進行審查，*最後*再進行重構，並且按照嚴格且可靠的順序執行。**每個子 agent 的輸出會透過 [Output Key](../llm-agents.md#structuring-data-input_schema-output_schema-output_key) 儲存在 state 中，並傳遞給下一個子 agent**。

!!! note "Shared Invocation Context"
    `SequentialAgent` 會將相同的 `InvocationContext` 傳遞給其所有子 agent。這表示它們都共享相同的 session state，包括暫存（`temp:`）命名空間，使得在單一 agent 回合內於各步驟之間傳遞資料變得十分容易。

???+ "Code"

    === "Python"
        ```py
        --8<-- "examples/python/snippets/agents/workflow-agents/sequential_agent_code_development_agent.py:init"
        ```

    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/workflow/SequentialAgentExample.java:init"
        ```

    
