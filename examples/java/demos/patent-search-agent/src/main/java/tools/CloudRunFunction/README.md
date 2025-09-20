### 建立資料庫物件

為了執行此 Cloud Run Function，您應該事先在 AlloyDB 端建立好相關的資料庫物件。
我們將建立一個 AlloyDB 叢集、實例和資料表，並將電子商務資料集載入其中。

#### 建立叢集與實例
1. 在 Cloud Console 中前往 AlloyDB 頁面。最快的方式是利用 Console 的搜尋列搜尋 AlloyDB 頁面。

2. 在該頁面選擇「CREATE CLUSTER」（建立叢集）：

3. 您會看到如下圖的畫面。請使用以下設定建立叢集與實例（若您是從 repo 複製應用程式程式碼，請確保設定值一致）：
   - cluster id: “vector-cluster”
   - password:  “alloydb”
   - PostgreSQL 15 / 最新建議版本
   - Region: “us-central1”
   - Networking: “default”

4. 當您選擇預設網路時，會看到如下畫面。
   請選擇「SET UP CONNECTION」（設定連線）。

5. 接著，選擇「Use an automatically allocated IP range」（使用自動分配的 IP 範圍）並點選繼續。檢查資訊後，選擇「CREATE CONNECTION」（建立連線）。

6. 網路設定完成後，即可繼續建立叢集。點選「CREATE CLUSTER」完成叢集設定，如下圖所示：

7. 請確保將 instance id 改為 vector-instance。
   若無法修改，請記得在後續所有參考處都同步修改 instance id。

請注意，叢集建立約需 10 分鐘。建立成功後，您應該會看到剛建立的叢集總覽畫面。

#### 資料匯入
現在是時候新增一個包含商店資料的資料表了。前往 AlloyDB，選擇主要叢集，然後進入 AlloyDB Studio。
1. 您可能需要等待實例建立完成。完成後，請使用建立叢集時設定的帳號密碼登入 AlloyDB。登入 PostgreSQL 時請使用以下資訊：

   - Username : “postgres”
   - Database : “postgres”
   - Password : “alloydb”

2. 成功登入 AlloyDB Studio 後，可以在 Editor 輸入 SQL 指令。您可以點選右側的加號新增多個 Editor 視窗。
   啟用擴充套件

   為了建置此應用程式，我們會使用 pgvector 與 google_ml_integration 這兩個擴充套件。pgvector 可用於儲存與搜尋向量嵌入（vector embeddings）；google_ml_integration 則提供存取 Vertex AI 預測端點、在 SQL 中取得預測結果的函式。請執行以下 DDL 指令來啟用這些擴充套件：

   ```
   CREATE EXTENSION IF NOT EXISTS google_ml_integration CASCADE;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. 若想查詢資料庫已啟用哪些擴充套件，請執行下列 SQL 指令：

   ```
   select extname, extversion from pg_extension;
   ```

4. 建立資料表
   您可以在 AlloyDB Studio 以以下 DDL 指令建立資料表：

   ```
   CREATE TABLE patents_data ( id VARCHAR(25), type VARCHAR(25), number VARCHAR(20), country VARCHAR(2), date VARCHAR(20), abstract VARCHAR(300000), title VARCHAR(100000), kind VARCHAR(5), num_claims BIGINT, filename VARCHAR(100), withdrawn BIGINT, abstract_embeddings vector(768)) ;
   ```

   其中 `abstract_embeddings` 欄位將用於儲存文字的向量值。

5. 權限授予
   執行以下指令，授權「embedding」函式的執行權限：

   ```
   GRANT EXECUTE ON FUNCTION embedding TO postgres;
   ```

6. 將 Vertex AI User 角色授予 AlloyDB 服務帳戶

   在 Google Cloud IAM 控制台，將 AlloyDB 服務帳戶（格式類似：service-<<PROJECT_NUMBER>>@gcp-sa-alloydb.iam.gserviceaccount.com）授予「Vertex AI User」角色。PROJECT_NUMBER 請替換為您的專案編號。

   ```
   PROJECT_ID=$(gcloud config get-value project)

   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:service-$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")@gcp-sa-alloydb.iam.gserviceaccount.com" \
   --role="roles/aiplatform.user"
   ```

7. 將專利資料載入資料庫。
   我們將使用 BigQuery 上的 [Google Patents Public Datasets](https://console.cloud.google.com/marketplace/product/google_patents_public_datasets/google-patents-public-data) 作為資料集。

   會使用 AlloyDB Studio 來執行查詢。可參考 [alloydb-pgvector](https://github.com/AbiramiSukumaran/alloydb-pgvector) repository 內的
   [insert_scripts.sql](https://github.com/AbiramiSukumaran/alloydb-pgvector/blob/main/insert_scripts.sql) 腳本來載入專利資料：
   https://github.com/AbiramiSukumaran/alloydb-pgvector/blob/main/insert_scripts.sql

   a. 在 Google Cloud console 開啟 AlloyDB 頁面。
   b. 選擇您剛建立的叢集並點選實例。
   c. 在 AlloyDB 導覽選單中，點選 AlloyDB Studio，並以您的帳號密碼登入。
   d. 點選右側的「New tab」圖示開啟新分頁。
   e. 將上述 insert_scripts.sql 腳本中的 insert 指令複製到編輯器中。為了快速展示此案例，您可以只複製 40-50 筆（或更少）的 insert 指令。
   f. 點選「Run」。查詢結果會顯示於 Results 表格。

### 建立 Cloud Run Function

準備好將這些資料串接到 Cloud Run Function 了嗎？請依照下列步驟操作：

1. 前往 Google Cloud Console 的 Cloud Run Functions 頁面建立新的 Cloud Run Function，或使用此連結：https://console.cloud.google.com/functions/add.

2. 選擇 Environment 為「Cloud Run function」。設定 Function Name 為「patent-search」，Region 選「us-central1」。Authentication 設為「Allow unauthenticated invocations」，然後點選 NEXT。Runtime 選擇 Java 17，Source code 選 Inline Editor。

3. 預設 Entry Point 會是「gcfv2.HelloHttpFunction」。請將 Cloud Run Function 的 HelloHttpFunction.java 及 pom.xml 內容，分別替換為「PatentSearch.java」及「pom.xml」的程式碼。並將類別檔案名稱改為 PatentSearch.java。

4. 請記得將 Java 檔案中的 ********* 佔位符及 AlloyDB 連線憑證改為您的設定值。這些 AlloyDB 憑證就是本教學一開始所設定的。如果您使用了不同的值，請在 Java 檔案中一併修改。

5. 點選 Deploy（部署）。

#### 重要步驟：

部署完成後，為了讓 Cloud Function 能存取我們的 AlloyDB 資料庫實例，需要建立 VPC 連接器。

部署完成後，您應該可以在 Google Cloud Run Functions 控制台看到該 Function。搜尋剛建立的 function（patent-search），點選進入後，再點選 EDIT 並修改以下設定：

1. 前往「Runtime, build, connections and security settings」（執行階段、建置、連線與安全性設定）

2. 將逾時時間（timeout）調整為 180 秒

3. 進入 CONNECTIONS 分頁：
   - 在 Ingress 設定下，請確保選擇「Allow all traffic」（允許所有流量）。

   - 在 Egress 設定下，點選 Network 下拉選單，選擇「Add New VPC Connector」（新增 VPC 連接器），並依照彈出對話框的指示操作：

     請為 VPC Connector 命名，並確保區域（region）與您的實例相同。Network 保持預設，Subnet 設為 Custom IP Range，IP 範圍可設為 10.8.0.0 或其他可用範圍。

   - 展開「SHOW SCALING SETTINGS」（顯示擴展設定），並確保設定如下：
     - Minimum instances* 2
     - Maximum instances* 3
     - instance type* fi-micro

4. 點選 CREATE，該連接器應會出現在 egress 設定中。

6. 選擇剛建立的連接器。

8. 選擇所有流量皆經由此 VPC 連接器路由。

10. 點選 NEXT，然後 DEPLOY。

    當 Cloud Function 更新部署完成後，您應該會看到產生的 endpoint。請複製該 endpoint 並替換到以下指令中：

    ```
    PROJECT_ID=$(gcloud config get-value project)

    curl -X POST <<YOUR_ENDPOINT>> \
      -H 'Content-Type: application/json' \
      -d '{"search":"Sentiment Analysis"}' \
      | jq .
    ```

大功告成！就是這麼簡單，您已能在 AlloyDB 資料上，利用 Embeddings 模型執行進階的語境相似度向量搜尋（Contextual Similarity Vector Search）。
