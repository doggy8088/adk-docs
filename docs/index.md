---
hide:
  - toc
---

!!! tip "What's new"
    無需撰寫程式碼即可建立 agent。請參考
    [Agent Config](/adk-docs/agents/config/) 功能。

<div style="text-align: center;">
  <div class="centered-logo-text-group">
    <img src="assets/agent-development-kit.png" alt="Agent Development Kit Logo" width="100">
    <h1>Agent Development Kit</h1>
  </div>
</div>

## 什麼是 Agent Development Kit (ADK)？

Agent Development Kit (ADK) 是一個靈活且模組化的框架，用於**開發與部署 AI agent**。雖然 ADK 為 Gemini 與 Google 生態系進行了最佳化，但它本身是**模型無關**、**部署無關**，並且設計上**可與其他框架相容**。ADK 的設計理念是讓 agent 開發更像是一般軟體開發，讓開發者更容易建立、部署與協調從簡單任務到複雜工作流程的 agent 架構。

<div id="centered-install-tabs" class="install-command-container" markdown="1">

<p class="get-started-text" style="text-align: center;">立即開始：</p>

=== "Python"
    <br>
    <p style="text-align: center;">
    <code>pip install google-adk</code>
    </p>

=== "Java"

    ```xml title="pom.xml"
    <dependency>
        <groupId>com.google.adk</groupId>
        <artifactId>google-adk</artifactId>
        <version>0.2.0</version>
    </dependency>
    ```

    ```gradle title="build.gradle"
    dependencies {
        implementation 'com.google.adk:google-adk:0.2.0'
    }
    ```
</div>


<p style="text-align:center;">
  <a href="get-started/quickstart/" class="md-button" style="margin:3px">快速開始</a>
  <a href="tutorials/" class="md-button" style="margin:3px">教學</a>
  <a href="http://github.com/google/adk-samples" class="md-button" target="_blank" style="margin:3px">範例代理</a>
  <a href="api-reference/" class="md-button" style="margin:3px">API 參考</a>
  <a href="contributing-guide/" class="md-button" style="margin:3px">貢獻 ❤️</a>
</p>

---

## 進一步了解

[:fontawesome-brands-youtube:{.youtube-red-icon} 觀看「Introducing Agent Development Kit (ADK)」！](https://www.youtube.com/watch?v=zgrOwow_uTQ target="_blank" rel="noopener noreferrer")

<div class="grid cards" markdown>

-   :material-transit-connection-variant: **彈性協作編排**

    ---

    使用 workflow agent（`Sequential`、`Parallel`、`Loop`）定義可預測的工作流程，或利用大型語言模型 (LLM) 驅動的動態路由
    （`LlmAgent` transfer）實現自適應行為。

    [**深入了解 agent**](agents/index.md)

-   :material-graph: **多 agent 架構**

    ---

    透過組合多個專業化 agent 形成階層式架構，打造模組化且可擴展的應用程式。實現複雜的協同與委派。

    [**探索多 agent 系統**](agents/multi-agents.md)

-   :material-toolbox-outline: **豐富的工具生態系**

    ---

    為 agent 配備多元能力：可使用預建工具（Search、Code Exec）、自訂函式、整合第三方函式庫（如 LangChain、CrewAI），甚至將其他 agent 作為工具來使用。

    [**瀏覽工具**](tools/index.md)

-   :material-rocket-launch-outline: **隨時可部署**

    ---

    將 agent 容器化並部署至任何環境——可於本地執行、透過 Vertex AI Agent Engine 擴展，或結合 Cloud Run、Docker 整合至自訂基礎設施。

    [**部署 agent**](deploy/index.md)

-   :material-clipboard-check-outline: **內建評估機制**

    ---

    系統性評估 agent 的效能，包含最終回應品質與逐步執行過程，並與預先定義的測試案例進行比對。

    [**評估 agent**](evaluate/index.md)

-   :material-console-line: **打造安全可靠的 agent**

    ---

    學習如何將安全性與最佳實踐融入 agent 設計，打造強大且值得信賴的 agent。

    [**安全與防護**](safety/index.md)

</div>
