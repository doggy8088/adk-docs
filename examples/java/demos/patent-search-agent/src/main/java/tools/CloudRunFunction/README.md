### 建立資料庫物件

為了執行此 Cloud Run Function（CRF），你應該事先在 AlloyDB 端建立好相關的資料庫物件。
我們將建立一個 AlloyDB 叢集、實例與資料表，並將電商資料集載入其中。

#### 建立叢集與實例
1. 前往 Google Cloud Console 的 AlloyDB 頁面。最快找到大多數頁面的方法，是直接在 Console 的搜尋列中搜尋。

2. 在該頁面選擇「CREATE CLUSTER」（建立叢集）：

3. 你會看到如下畫面。請依下列設定建立叢集與實例（如果你是從 repo 複製應用程式程式碼，請確保設定值一致）：
   - cluster id: “vector-cluster”
   - password:  “alloydb”
   - PostgreSQL 15 / 最新建議版本
   - Region: “us-central1”
   - Networking: “default”

4. 當你選擇預設網路時，會看到如下畫面。
   請選擇「SET UP CONNECTION」（設定連線）。

5. 接著，選擇「Use an automatically allocated IP range」（使用自動分配的 IP 範圍），然後點選「Continue」（繼續）。檢查資訊後，點選「CREATE CONNECTION」（建立連線）。

6. 網路設定完成後，即可繼續建立叢集。點選「CREATE CLUSTER」完成叢集設定，如下圖所示：

7. 請確保將 instance id 改為 vector-instance。
   如果無法更改，請記得在後續所有相關參考處都要修改 instance id。

請注意，叢集建立大約需要 10 分鐘。建立成功後，你應該會看到剛建立的叢集總覽畫面。

#### 資料匯入
現在要新增一個資料表，儲存商店相關資料。前往 AlloyDB，選擇主要叢集，然後進入 AlloyDB Studio。
1. 你可能需要等待實例建立完成。完成後，請使用建立叢集時設定的認證登入 AlloyDB。請使用以下資料登入 PostgreSQL：

   - Username : “postgres”
   - Database : “postgres”
   - Password : “alloydb”

2. 成功登入 AlloyDB Studio 後，可在 Editor 輸入 SQL 指令。你可以透過最右側的加號新增多個 Editor 視窗。
   啟用擴充套件

   為了建構本應用程式，我們將使用 pgvector（向量擴充套件）與 google_ml_integration（Google 機器學習整合擴充套件）這兩個擴充套件。pgvector 可用於儲存與搜尋向量嵌入（embeddings）；google_ml_integration 則提供可在 SQL 中存取 Vertex AI 預測端點的函式。請執行下列 DDL 指令啟用這些擴充套件：

   ```
   CREATE EXTENSION IF NOT EXISTS google_ml_integration CASCADE;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. 若想查詢目前資料庫已啟用哪些擴充套件，可執行下列 SQL 指令：

   ```
   select extname, extversion from pg_extension;
   ```

4. 建立資料表
   你可以在 AlloyDB Studio 使用下列 DDL 指令建立資料表：

   ```
   CREATE TABLE patents_data (
     id VARCHAR(25),
     type VARCHAR(25),
     number VARCHAR(20),
     country VARCHAR(2),
     date VARCHAR(20),
     abstract VARCHAR(300000),
     title VARCHAR(100000),
     kind VARCHAR(5),
     num_claims BIGINT,
     filename VARCHAR(100),
     withdrawn BIGINT,
     abstract_embeddings vector(768)
   );
   ```

   其中 `abstract_embeddings` 欄位將用於儲存文本的向量值。

5. 權限授予
   執行下列指令，授予「embedding」函式的執行權限：

   ```
   GRANT EXECUTE ON FUNCTION embedding TO postgres;
   ```

6. 將 Vertex AI User 角色授予 AlloyDB 服務帳戶

   在 Google Cloud IAM 控制台，將 AlloyDB 服務帳戶（格式類似：service-<<PROJECT_NUMBER>>@gcp-sa-alloydb.iam.gserviceaccount.com）授予「Vertex AI User」角色。PROJECT_NUMBER 請填入你的專案編號。

   ```
   PROJECT_ID=$(gcloud config get-value project)

   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:service-$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")@gcp-sa-alloydb.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

7. 將專利資料載入資料庫。
   我們將使用 BigQuery 上的 [Google Patents Public Datasets](https://console.cloud.google.com/marketplace/product/google_patents_public_datasets/google-patents-public-data) 作為資料集。

   我們會在 AlloyDB Studio 執行查詢。你可以在 [alloydb-pgvector](https://github.com/AbiramiSukumaran/alloydb-pgvector) repository 取得
   [insert_scripts.sql](https://github.com/AbiramiSukumaran/alloydb-pgvector/blob/main/insert_scripts.sql) 腳本，並用來載入專利資料：
   https://github.com/AbiramiSukumaran/alloydb-pgvector/blob/main/insert_scripts.sql

   a. 在 Google Cloud Console 開啟 AlloyDB 頁面。
   b. 選擇你新建立的叢集並點選實例。
   c. 在 AlloyDB 導覽選單中，點選 AlloyDB Studio，並使用你的認證登入。
   d. 點選右側的「New tab」圖示開啟新分頁。
   e. 將上述 insert_scripts.sql 腳本中的 insert 指令複製到編輯器。你可以複製 40-50 筆，或更少的 insert 指令，快速示範本案例。
   f. 點選「Run」。查詢結果會顯示在下方的 Results 表格中。

### 建立 Cloud Run Function（CRF）

準備好將這些資料串接到 Cloud Run Function 了嗎？請依照下列步驟操作：

1. 前往 Google Cloud Console 的 Cloud Run Functions 頁面，建立新的 Cloud Run Function，或使用此連結：https://console.cloud.google.com/functions/add.

2. 將 Environment（環境）設為「Cloud Run function」。Function Name（函式名稱）填寫「patent-search」，Region（區域）選擇「us-central1」。Authentication（驗證）設為「Allow unauthenticated invocations」（允許未驗證呼叫），然後點選 NEXT。Runtime（執行環境）選擇 Java 17，Source code（原始碼）選擇 Inline Editor。

3. 預設 Entry Point 會設為「gcfv2.HelloHttpFunction」。請將 Cloud Run Function 中 HelloHttpFunction.java 與 pom.xml 的範例程式碼，分別替換為「PatentSearch.java」與「pom.xml」的內容，並將類別檔案名稱改為 PatentSearch.java。

4. 請記得將 Java 檔案中的 ********* 佔位符，以及 AlloyDB 連線憑證，替換為你自己的值。這些 AlloyDB 憑證就是本教學一開始所設定的。如果你使用了不同的值，請在 Java 檔案中一併修改。

5. 點選 Deploy（部署）。

#### 重要步驟：

部署完成後，為了讓 Cloud Function 能存取我們的 AlloyDB 資料庫實例，需建立 VPC 連接器。

當你準備部署時，應可在 Google Cloud Run Functions 控制台看到已建立的函式。搜尋新建立的函式（patent-search），點擊進入，然後點選 EDIT 並進行以下設定：

1. 前往「Runtime, build, connections and security settings」（執行環境、建置、連線與安全性設定）

2. 將 timeout（逾時時間）增加至 180 秒

3. 前往 CONNECTIONS 分頁：
   - 在 Ingress 設定下，請確保選擇「Allow all traffic」（允許所有流量）。
   - 在 Egress 設定下，點選 Network 下拉選單，選擇「Add New VPC Connector」（新增 VPC 連接器），並依照彈出對話框的指示操作：

     - 輸入 VPC 連接器名稱，並確保區域與你的實例相同。Network 保持預設，Subnet 設為 Custom IP Range，IP 範圍建議設為 10.8.0.0 或其他可用範圍。

   - 展開「SHOW SCALING SETTINGS」（顯示擴展設定），並確保設定如下：
     - Minimum instances* 2
     - Maximum instances* 3
     - instance type* fi-micro

4. 點選 CREATE，該連接器即會出現在 egress 設定中。

6. 選擇新建立的連接器。

8. 選擇所有流量皆經由此 VPC 連接器路由。

10. 點選 NEXT，然後點選 DEPLOY。

    當 Cloud Function 更新部署完成後，你會看到產生的 endpoint。請複製該 endpoint，並替換到下列指令中：

    ```
    PROJECT_ID=$(gcloud config get-value project)

    curl -X POST <<YOUR_ENDPOINT>> \
      -H 'Content-Type: application/json' \
      -d '{"search":"Sentiment Analysis"}' \
      | jq .
    ```

完成了！就是這麼簡單，透過 Embeddings 模型，你就能在 AlloyDB 資料上執行進階的語境相似度向量搜尋（Contextual Similarity Vector Search）。
