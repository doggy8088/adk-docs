# Agent Development Kit (ADK)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/pypi/v/google-adk)](https://pypi.org/project/google-adk/)
[![Maven Central](https://img.shields.io/maven-central/v/com.google.adk/google-adk)](https://search.maven.org/artifact/com.google.adk/google-adk)

<html>
  <h2 align="center">
    <img src="docs/assets/agent-development-kit.png" width="150"/>
  </h2>
</html>

**一個開源、以程式碼為核心的工具包，讓您能靈活且可控地建構、評估與部署高階 AI agent。**

Agent Development Kit (ADK) 是一個靈活且模組化的框架，專為**開發與部署 AI agent**而設計。雖然 ADK 針對 Gemini 及 Google 生態系進行了最佳化，但它本身具備**模型無關性**、**部署無關性**，並且**可與其他框架相容**。ADK 的設計理念是讓 agent 開發更像軟體開發，讓開發者能更輕鬆地建立、部署與協調從簡單任務到複雜工作流程的 agent 架構。

---

## ✨ 主要特色

- **豐富的工具生態系**：可利用預建工具、自訂函式、OpenAPI 規格，或整合現有工具，賦予 agent 多元能力，並與 Google 生態系緊密整合。

- **以程式碼為核心的開發體驗**：直接在 Python 與 Java 中定義 agent 邏輯、工具與協作流程，實現極致彈性、可測試性與版本控管。

- **模組化多 agent 系統**：可將多個專業化 agent 組合成彈性的階層架構，設計具擴展性的應用程式。

- **追蹤與監控**：內建 agent 可觀察性，方便除錯與優化工作流程，並支援 [AgentOps](https://www.agentops.ai) 等外部服務。

- **隨處部署**：可輕鬆將 agent 容器化並部署於 Cloud Run，或透過 Vertex AI Agent Engine 無縫擴展。

## 🚀 安裝方式

您可以使用偏好的 Python 套件管理工具或 Java 建構工具來安裝 Agent Development Kit (ADK)。

### 適用於 Python（pip）

```bash
pip install google-adk
```

### 適用於 Java（Maven）

```xml
<dependency>
    <groupId>com.google.adk</groupId>
    <artifactId>google-adk</artifactId>
    <version>0.1.0</version>
</dependency>
```

### 適用於 Java（Gradle）

```groovy
dependencies {
    implementation 'com.google.adk:google-adk:0.1.0'
}
```

## 📚 文件說明

請參閱完整文件，獲取有關建構、評估與部署 agent 的詳細指南：

* **[文件說明](https://google.github.io/adk-docs)**

## 🤝 貢獻指南

我們歡迎社群的各種貢獻！無論是錯誤回報、功能請求、文件改進，或是程式碼貢獻，請參考我們的[**貢獻指南**](./CONTRIBUTING.md)以開始參與。

## 📄 授權條款

本專案採用 Apache 2.0 授權條款，詳情請參閱 [LICENSE](LICENSE) 檔案。

---

*祝您順利打造 Agent！*
