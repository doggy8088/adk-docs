# A2A 介紹

隨著你建立越來越複雜的代理（agent）系統，你會發現單一 agent 往往無法滿足需求。你可能希望建立專門化的 agent，讓它們能夠協作解決問題。[**Agent2Agent (A2A) Protocol**](https://a2a-protocol.org) 就是一套標準，讓這些 agent 能夠彼此通訊。

## 何時使用 A2A 與本地子代理（Local Sub-Agents）

- **本地子代理（Local Sub-Agents）：** 這些 agent *在與你的主 agent 相同的應用程式程序內* 執行。它們就像內部模組或函式庫一樣，用來將你的程式碼組織成有邏輯、可重複使用的元件。主 agent 與本地子代理之間的通訊非常快速，因為它們直接在記憶體中運作，沒有網路負擔。

- **遠端代理（Remote Agents，A2A）：** 這些是作為獨立服務運行的 agent，透過網路進行通訊。A2A 定義了這種通訊的標準協議。

當你遇到以下情境時，建議考慮使用 **A2A**：

- 你需要溝通的 agent 是**獨立、可單獨運作的服務**（例如：專門的財務建模 agent）。
- 該 agent 由**不同的團隊或組織**維護。
- 你需要連接**使用不同程式語言或 agent 框架**編寫的 agent。
- 你希望在系統元件間強制執行**嚴謹、正式的合約**（即 A2A 協議）。

### 何時使用 A2A：具體範例

- **整合第三方服務：** 你的主 agent 需要從外部金融資料供應商即時取得股價。該供應商透過支援 A2A 的 agent 提供資料。
- **微服務架構：** 你的大型系統被拆分為多個小型、獨立服務（例如：訂單處理 agent、庫存管理 agent、出貨 agent）。A2A 非常適合讓這些服務跨網路邊界彼此通訊。
- **跨語言通訊：** 你的核心商業邏輯在 Python agent 中，但你有一個舊系統或專門元件是用 Java 編寫，想要以 agent 方式整合。A2A 提供標準化的通訊層。
- **正式 API 合約：** 你正在建立一個平台，不同團隊會貢獻 agent，你需要嚴格規範這些 agent 如何互動，以確保相容性與穩定性。

### 何時**不**要使用 A2A：具體範例（建議使用本地子代理）

- **內部程式碼組織：** 你將單一 agent 內的複雜任務拆分為較小、易於管理的函式或模組（例如：`DataValidator` 子代理負責在處理前清理輸入資料）。這類情境為了效能與簡單性，建議使用本地子代理。
- **效能關鍵的內部操作：** 某個子代理負責高頻率、低延遲且與主 agent 執行緊密耦合的操作（例如：`RealTimeAnalytics` 子代理在同一應用程式中處理資料流）。這類操作適合本地子代理。
- **共用記憶體／上下文：** 當子代理需要直接存取主 agent 的內部狀態或共用記憶體以提升效率時，A2A 的網路負擔與序列化／反序列化反而會造成反效果。
- **簡單輔助函式：** 對於不需要獨立部署或複雜狀態管理的小型、可重複使用邏輯，直接在同一 agent 中實作函式或類別會比建立獨立的 A2A agent 更合適。

## ADK 中的 A2A 工作流程：簡化說明

Agent Development Kit (ADK)（ADK）簡化了使用 A2A 協議建立與連接 agent 的流程。以下是其運作方式的簡明說明：

1. **讓 agent 可被存取（暴露）：** 你有一個現有的 ADK agent，希望其他 agent 能與之互動。ADK 提供簡單的方法來「暴露」這個 agent，將其轉換為 **A2AServer**。這個 server 就像公開介面，允許其他 agent 透過網路向你的 agent 發送請求。你可以把它想像成為你的 agent 架設一個網頁伺服器。

2. **連接到可存取的 agent（消費）：** 在另一個 agent（可以在同一台機器或不同機器上運行）中，你會使用一個特殊的 ADK 元件 `RemoteA2aAgent`。這個 `RemoteA2aAgent` 會作為 client，知道如何與你先前暴露的 **A2AServer** 通訊。它會在背後處理所有網路通訊、認證與資料格式化的複雜細節。

從開發者的角度來看，一旦你設置好這個連線，與遠端 agent 的互動就像操作本地工具或函式一樣簡單。ADK 幫你抽象掉網路層，讓分散式 agent 系統的使用體驗就像本地系統一樣容易。

## A2A 工作流程視覺化

為了進一步說明 A2A 的工作流程，我們來看看「暴露」與「消費」 agent 前後的狀態，以及它們組合成的系統。

### 暴露 agent

**暴露前：**
你的 agent 程式碼以獨立元件運行，但在這個情境下，你希望將它暴露出來，讓其他遠端 agent 能夠與你的 agent 互動。

```text
+-------------------+
| Your Agent Code   |
|   (Standalone)    |
+-------------------+
```

**對外公開後：**
您的 agent 程式碼已與`A2AServer`（一個 Agent Development Kit (ADK) 元件）整合，使其能夠透過網路被其他遠端 agent 存取。

```text
+-----------------+
|   A2A Server    |
| (ADK Component) |<--------+
+-----------------+         |
        |                   |
        v                   |
+-------------------+       |
| Your Agent Code   |       |
| (Now Accessible)  |       |
+-------------------+       |
                            |
                            | (Network Communication)
                            v
+-----------------------------+
|       Remote Agent(s)       |
|    (Can now communicate)    |
+-----------------------------+
```

### 使用 agent

**開始使用前：**
你的 agent（在此情境下稱為「Root Agent」）是你正在開發、需要與遠端 agent 互動的應用程式。在開始使用前，它尚未具備直接互動的機制。

```text
+----------------------+         +-------------------------------------------------------------+
|      Root Agent      |         |                        Remote Agent                         |
| (Your existing code) |         | (External Service that you want your Root Agent to talk to) |
+----------------------+         +-------------------------------------------------------------+
```

**消費後：**
您的 Root Agent 會使用 `RemoteA2aAgent`（一個作為遠端 agent 用戶端代理的 Agent Development Kit (ADK) 元件）來建立與遠端 agent 的通訊。

```text
+----------------------+         +-----------------------------------+
|      Root Agent      |         |         RemoteA2aAgent            |
| (Your existing code) |<------->|         (ADK Client Proxy)        |
+----------------------+         |                                   |
                                 |  +-----------------------------+  |
                                 |  |         Remote Agent        |  |
                                 |  |      (External Service)     |  |
                                 |  +-----------------------------+  |
                                 +-----------------------------------+
      (Now talks to remote agent via RemoteA2aAgent)
```

### 最終系統（整合視圖）

此圖說明了消費端與公開端如何連接，形成一個完整的 A2A 系統。

```text
Consuming Side:
+----------------------+         +-----------------------------------+
|      Root Agent      |         |         RemoteA2aAgent            |
| (Your existing code) |<------->|         (ADK Client Proxy)        |
+----------------------+         |                                   |
                                 |  +-----------------------------+  |
                                 |  |         Remote Agent        |  |
                                 |  |      (External Service)     |  |
                                 |  +-----------------------------+  |
                                 +-----------------------------------+
                                                 |
                                                 | (Network Communication)
                                                 v
Exposing Side:
                                               +-----------------+
                                               |   A2A Server    |
                                               | (ADK Component) |
                                               +-----------------+
                                                       |
                                                       v
                                               +-------------------+
                                               | Your Agent Code   |
                                               | (Exposed Service) |
                                               +-------------------+
```

## 具體使用案例：客服代理與產品目錄代理

我們來看一個實際範例：一個**客服代理（Customer Service Agent）**需要從另一個**產品目錄代理（Product Catalog Agent）**取得產品資訊。

### 在 A2A 之前

一開始，您的客服代理可能沒有直接且標準化的方式來查詢產品目錄代理，特別是當它是一個獨立服務或由不同團隊管理時。

```text
+-------------------------+         +--------------------------+
| Customer Service Agent  |         |  Product Catalog Agent   |
| (Needs Product Info)    |         | (Contains Product Data)  |
+-------------------------+         +--------------------------+
      (No direct, standardized communication)
```

### A2A 之後

透過使用 A2A Protocol，Product Catalog Agent 可以將其功能作為 A2A 服務對外提供。您的 Customer Service Agent 便能輕鬆地透過 Agent Development Kit (ADK) 的 `RemoteA2aAgent` 來存取此服務。

```text
+-------------------------+         +-----------------------------------+
| Customer Service Agent  |         |         RemoteA2aAgent            |
| (Your Root Agent)       |<------->|         (ADK Client Proxy)        |
+-------------------------+         |                                   |
                                    |  +-----------------------------+  |
                                    |  |     Product Catalog Agent   |  |
                                    |  |      (External Service)     |  |
                                    |  +-----------------------------+  |
                                    +-----------------------------------+
                                                 |
                                                 | (Network Communication)
                                                 v
                                               +-----------------+
                                               |   A2A Server    |
                                               | (ADK Component) |
                                               +-----------------+
                                                       |
                                                       v
                                               +------------------------+
                                               | Product Catalog Agent  |
                                               | (Exposed Service)      |
                                               +------------------------+
```

在這個設定中，首先需要透過 A2A Server 將 Product Catalog Agent 對外公開。接著，Customer Service Agent 就可以像使用工具一樣，直接呼叫 `RemoteA2aAgent` 上的方法，而所有與 Product Catalog Agent 的底層通訊都由 Agent Development Kit (ADK) 處理。這樣可以明確區分各自的職責，並且讓專業代理（agent）的整合變得簡單。

## 下一步

現在你已經了解 A2A 的「為什麼」，接下來讓我們深入「如何做」。

- **繼續閱讀下一份指南：**
  [快速開始：公開你的代理](./quickstart-exposing.md)
