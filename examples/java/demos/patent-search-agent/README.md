# Patent Search Agent

使用 Agent Development Kit (ADK) Java SDK 來執行常見的專利搜尋（情境式搜尋，Contextual Search）應用情境。

1. 從 Google AI Studio 取得您目前 Google Cloud 專案的 API KEY
   
2. 設定環境變數：
```
export GOOGLE_GENAI_USE_VERTEXAI=FALSE
export GOOGLE_API_KEY="<your-api-key>"
```
3. 將程式碼中的占位符（如 PROJECT_ID 等）替換為你專案中的實際值。

4. 依照下方的 codelab 設定 AlloyDB 以儲存專利資料：
   https://codelabs.developers.google.com/patent-search-java-adk
   
5. 建立 Cloud Run Function（CRF），以存取 AlloyDB 中的專利資料（程式碼位於本儲存庫）
   此步驟請依照 codelab 操作：https://codelabs.developers.google.com/patent-search-java-adk

6. 部署並取得 CRF 的 endpoint

7. 在 Cloud Shell 終端機中，切換到專案資料夾

8. 執行以下指令以啟動 agent 互動：
```
   mvn compile exec:java -Dexec.mainClass="agents.App"
```

9. 部署到 Cloud Run：
    請切換到你的根目錄，並執行以下指令：
```
    gcloud run deploy --source . --set-env-vars GOOGLE_API_KEY=<<YOUR_API_KEY>>
```

10. 前往已部署的 agent 的 CR Endpoint，以查看網頁 UI。

測試：

**開始與 agent 互動，輸入內容例如：**

    Hi.
    >>
    I want to search about NLP related patents.
    >>
    Can you give more details about this patent #*****
   

   
