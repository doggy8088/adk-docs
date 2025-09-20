# 順序代理（Sequential agents）

## `SequentialAgent`

`SequentialAgent` 是一種[工作流程代理（workflow agent）](index.md)，會依照清單中指定的順序執行其子代理（sub-agents）。

當你需要讓執行流程以固定且嚴格的順序進行時，請使用 `SequentialAgent`。

### 範例

* 你想要建立一個能夠摘要任何網頁內容的代理，並使用兩個工具：`Get Page Contents` 和 `Summarize Page`。由於代理必須在呼叫 `Summarize Page` 之前先呼叫 `Get Page Contents`（你不能無中生有地摘要！），因此你應該使用 `SequentialAgent` 來建立你的代理。

和其他[工作流程代理（workflow agents）](index.md)一樣，`SequentialAgent` 並不是由大型語言模型（LLM）驅動，因此其執行方式是確定性的。需要注意的是，工作流程代理只關注於其執行流程（例如順序執行），而不涉及其內部邏輯；工作流程代理的工具或子代理可能會使用 LLM，也可能不會。

### 運作方式

當呼叫 `SequentialAgent` 的 `Run Async` 方法時，會執行以下動作：

1. **迭代（Iteration）：** 依照提供的順序，逐一遍歷子代理清單。
2. **子代理執行（Sub-Agent Execution）：** 對於清單中的每個子代理，呼叫該子代理的 `Run Async` 方法。

![Sequential Agent](../../assets/sequential-agent.png){: width="600"}

### 完整範例：程式碼開發流程

以一個簡化的程式碼開發流程為例：

* **程式碼撰寫代理（Code Writer Agent）：** 一個 LLM 代理，根據規格產生初始程式碼。
* **程式碼審查代理（Code Reviewer Agent）：** 一個 LLM 代理，審查產生的程式碼是否有錯誤、風格問題，以及是否符合最佳實踐。它會接收程式碼撰寫代理的輸出。
* **程式碼重構代理（Code Refactorer Agent）：** 一個 LLM 代理，接收經過審查的程式碼（以及審查者的評論），並進行重構以提升品質並解決問題。

`SequentialAgent` 非常適合這類需求：

```py
SequentialAgent(sub_agents=[CodeWriterAgent, CodeReviewerAgent, CodeRefactorerAgent])
```

這確保了程式碼會被撰寫，*然後*進行審查，*最後*再進行重構，並且嚴格依照可靠的順序執行。**每個子 agent 的輸出會透過 [Output Key](../llm-agents.md#structuring-data-input_schema-output_schema-output_key) 儲存在 state 中，並傳遞給下一個子 agent。**

!!! note "共享呼叫情境（Shared Invocation Context）"
    `SequentialAgent` 會將相同的 `InvocationContext` 傳遞給其所有子 agent。這表示它們都共用相同的 session state，包括暫存（`temp:`）命名空間，讓在單一回合內的各步驟之間資料傳遞變得容易。

???+ "程式碼"

    === "Python"
        ```py
        --8<-- "examples/python/snippets/agents/workflow-agents/sequential_agent_code_development_agent.py:init"
        ```

    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/workflow/SequentialAgentExample.java:init"
        ```

    
