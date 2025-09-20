# ADK 中的 Bidi-streaming（即時串流）

!!! warning

    This is an experimental feature. Currrently available in Python.

!!! info

    This is different from server-side streaming or token-level streaming. 
    Token-level streaming is a one-way process where a language model generates a response and sends it back to the user one token at a time. This creates a "typing" effect, giving the impression of an immediate response and reducing the time it takes to see the start of the answer. The user sends their full prompt, the model processes it, and then the model begins to generate and send back the response piece by piece. This section is for bidi-streaming (live).
    
ADK 的 Bidi-streaming（即時雙向串流）功能，為 AI agent 增加了 [Gemini Live API](https://ai.google.dev/gemini-api/docs/live) 的低延遲雙向語音與視訊互動能力。

透過 Bidi-streaming（即時）模式，您可以為終端使用者提供自然且類似真人的語音對話體驗，包括讓使用者能夠以語音指令中斷 agent 回應的能力。具備串流功能的 agent 能夠處理文字、音訊與視訊輸入，並可輸出文字與語音。

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

-   :material-console-line: **快速入門（Bidi-streaming）**

    ---

    在本快速入門中，您將建立一個簡單的 agent，並使用 ADK 的串流功能來實現低延遲且雙向的語音與視訊通訊。

    - [快速入門（Bidi-streaming）](../get-started/streaming/quickstart-streaming.md)

-   :material-console-line: **自訂音訊串流應用程式範例**

    ---

    本文概述了使用 ADK Streaming 與 FastAPI 所建構的自訂非同步網頁應用程式的伺服器與用戶端程式碼，實現了同時支援 Server Sent Events（SSE）與 WebSockets 的即時雙向音訊與文字通訊。

    - [自訂音訊串流應用程式範例（SSE）](custom-streaming.md)
    - [自訂音訊串流應用程式範例（WebSockets）](custom-streaming-ws.md)

-   :material-console-line: **Bidi-streaming 開發指南系列**

    ---

    一系列深入介紹 ADK Bidi-streaming 開發的文章。您可以學習基本概念與應用情境、核心 API，以及端到端應用程式設計。

    - [Bidi-streaming 開發指南系列：第一部分 - 簡介](dev-guide/part1.md)

-   :material-console-line: **串流工具（Streaming Tools）**

    ---

    串流工具允許工具（函式）將中間結果即時串流回 agent，agent 也能對這些中間結果做出回應。例如，我們可以利用串流工具監控股價變化，並讓 agent 及時回應；或者讓 agent 監控視訊串流，當視訊內容發生變化時，agent 可以即時回報。

    - [串流工具（Streaming Tools）](streaming-tools.md)

-   :material-console-line: **自訂音訊串流應用程式範例**

    ---

    本文概述了使用 ADK Streaming 與 FastAPI 所建構的自訂非同步網頁應用程式的伺服器與用戶端程式碼，實現了同時支援 Server Sent Events（SSE）與 WebSockets 的即時雙向音訊與文字通訊。

    - [串流設定（Streaming Configurations）](configuration.md)

-   :material-console-line: **部落格文章：Google ADK + Vertex AI Live API**

    ---

    本文介紹如何在 ADK 中使用 Bidi-streaming（即時）進行即時音訊／視訊串流，並提供一個利用 LiveRequestQueue 建立自訂互動式 AI agent 的 Python 伺服器範例。

    - [部落格文章：Google ADK + Vertex AI Live API](https://medium.com/google-cloud/google-adk-vertex-ai-live-api-125238982d5e)

</div>
