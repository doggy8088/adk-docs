# 雙向串流 (bidi-streaming, live) 在 Agent Development Kit (ADK)

!!! warning

    這是一項實驗性功能。目前僅支援 Python。

!!! info

    這與伺服器端串流 (server-side streaming) 或逐字元串流 (token-level streaming) 不同。  
逐字元串流 (token-level streaming) 是一種單向流程，大型語言模型 (Large Language Model, LLM) 會一次產生一個字元（token）並回傳給使用者。這會產生「打字」的效果，讓使用者感覺回應即時，並縮短看到答案開頭所需的時間。使用者會先送出完整的提示，模型處理後，便開始逐步產生並傳回回應。本節說明的是雙向串流 (bidi-streaming, live)。

Agent Development Kit (ADK) 的雙向串流 (bidi-streaming, live) 功能，將 [Gemini Live API](https://ai.google.dev/gemini-api/docs/live) 的低延遲雙向語音與視訊互動能力，帶入 AI agent。

透過雙向串流 (bidi-streaming, live) 模式，您可以為終端使用者提供自然且類似真人的語音對話體驗，包括讓使用者能以語音指令中斷 agent 回應的能力。支援串流的 agent 可處理文字、語音與視訊輸入，並能輸出文字與語音。

<div class="video-grid">
  <div class="video-item">
    <div class="video-container">
      <iframe src="https://www.youtube-nocookie.com/embed/Tu7-voU7nnw?si=RKs7EWKjx0bL96i5" title="Shopper's Concierge" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
  </div>

  <div class="video-item">
    <div class="video-container">
      <iframe src="https://www.youtube-nocookie.com/embed/LwHPYyw7u6U?si=xxIEhnKBapzQA6VV" title="Shopper's Concierge" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
  </div>
</div>

<div class="grid cards" markdown>

-   :material-console-line: **快速開始（雙向串流）**

    ---

    在這個快速開始教學中，您將建立一個簡單的 agent，並在 ADK 中使用串流功能，實作低延遲、雙向的語音與視訊通訊。

    - [Quickstart (Bidi-streaming)](../get-started/streaming/quickstart-streaming.md)

-   :material-console-line: **自訂音訊串流應用程式範例**

    ---

    本文概述了使用 ADK 串流與 FastAPI 所建構的自訂非同步 Web 應用程式的伺服器與用戶端程式碼，實現即時、雙向的音訊與文字通訊，並同時支援 Server Sent Events (SSE) 與 WebSockets。

    - [Custom Audio Streaming app sample (SSE)](custom-streaming.md)
    - [Custom Audio Streaming app sample (WebSockets)](custom-streaming-ws.md)

-   :material-console-line: **雙向串流開發指南系列**

    ---

    一系列深入介紹 ADK 雙向串流開發的文章。您可以學習基本概念與應用場景、核心 API，以及端到端應用設計。

    - [Bidi-streaming development guide series: Part 1 - Introduction](dev-guide/part1.md)

-   :material-console-line: **串流工具**

    ---

    串流工具允許工具（functions）將中間結果串流回 agent，agent 也可以根據這些中間結果做出回應。例如，我們可以利用串流工具監控股價變化，並讓 agent 及時反應。另一個例子是 agent 可監控視訊串流，當視訊內容有變化時，agent 會回報這些變化。

    - [Streaming Tools](streaming-tools.md)

-   :material-console-line: **自訂音訊串流應用程式範例**

    ---

    本文概述了使用 ADK 串流與 FastAPI 所建構的自訂非同步 Web 應用程式的伺服器與用戶端程式碼，實現即時、雙向的音訊與文字通訊，並同時支援 Server Sent Events (SSE) 與 WebSockets。

    - [Streaming Configurations](configuration.md)

-   :material-console-line: **部落格文章：Google ADK + Vertex AI Live API**

    ---

    本文說明如何在 ADK 中使用雙向串流 (bidi-streaming, live) 進行即時音訊／視訊串流。內容包含使用 LiveRequestQueue 建立自訂、互動式 AI agent 的 Python 伺服器範例。

    - [Blog post: Google ADK + Vertex AI Live API](https://medium.com/google-cloud/google-adk-vertex-ai-live-api-125238982d5e)

</div>
