# 部署你的 agent

當你使用 Agent Development Kit (ADK)（ADK）建置並測試好你的 agent 之後，
下一步就是將它部署，讓它可以被存取、查詢，並在
正式環境中使用，或整合到其他應用程式中。部署的過程會將你的 agent
從本機開發機器移轉到一個可擴展且可靠的環境中。

<img src="../assets/deploy-agent.png" alt="Deploying your agent">

## 部署選項

你的 ADK agent 可以根據你對正式環境準備度或自訂彈性的需求，
部署到各種不同的環境：

### Vertex AI Agent Engine

[Agent Engine](agent-engine.md) 是 Google Cloud 上一個全託管、可自動擴展的服務，
專為部署、管理及擴展以 ADK 等框架建置的 AI agent 而設計。

進一步了解[如何將你的 agent 部署到 Vertex AI Agent Engine](agent-engine.md)。

### Cloud Run

[Cloud Run](https://cloud.google.com/run) 是 Google Cloud 上一個託管的自動擴展運算平台，
讓你可以將 agent 以容器化應用程式的方式執行。

進一步了解[如何將你的 agent 部署到 Cloud Run](cloud-run.md)。

### Google Kubernetes Engine (GKE)

[Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 是 Google Cloud 的託管 Kubernetes 服務，
可讓你在容器化環境中執行 agent。如果你需要對部署有更多控制權，
或需要執行 Open Models，GKE 是不錯的選擇。

進一步了解[如何將你的 agent 部署到 GKE](gke.md)。

### 其他支援容器的基礎設施

你可以手動將你的 agent 打包成容器映像檔，然後在任何支援容器映像的環境中執行。
例如，你可以在本機的 Docker 或 Podman 上執行。這是適合離線、
斷線或無法連接 Google Cloud 等系統的選項。

請參考[將 agent 部署到 Cloud Run](cloud-run.md)的說明，
特別是其中關於如何使用自訂 Dockerfile 的部分。

