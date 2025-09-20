# 部署到 Google Kubernetes Engine (GKE)

[GKE](https://cloud.google.com/gke) 是 Google Cloud 所提供的受管 Kubernetes 服務。它讓你可以使用 Kubernetes 來部署與管理容器化應用程式。

要部署你的 agent，你需要在 GKE 上運行一個 Kubernetes 叢集。你可以透過 Google Cloud Console 或 `gcloud` 命令列工具來建立叢集。

在本範例中，我們將部署一個簡單的 agent 到 GKE。這個 agent 會是一個 FastAPI 應用程式，並使用 `Gemini 2.0 Flash` 作為大型語言模型 (LLM)。我們可以透過設定環境變數 `GOOGLE_GENAI_USE_VERTEXAI`，選擇 Vertex AI 或 AI Studio 作為 LLM 提供者。

## 環境變數

請依照 [Setup and Installation](../get-started/installation.md) 指南所述設定你的環境變數。你還需要安裝 `kubectl` 命令列工具。相關安裝說明可參考 [Google Kubernetes Engine Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl)。

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id # Your GCP project ID
export GOOGLE_CLOUD_LOCATION=us-central1 # Or your preferred location
export GOOGLE_GENAI_USE_VERTEXAI=true # Set to true if using Vertex AI
export GOOGLE_CLOUD_PROJECT_NUMBER=$(gcloud projects describe --format json $GOOGLE_CLOUD_PROJECT | jq -r ".projectNumber")
```

如果你尚未安裝`jq`，可以使用以下指令來取得專案編號：

```bash
gcloud projects describe $GOOGLE_CLOUD_PROJECT
```

並從輸出結果中複製專案編號（project number）。

```bash
export GOOGLE_CLOUD_PROJECT_NUMBER=YOUR_PROJECT_NUMBER
```



## 啟用 API 與權限

請確保你已經完成 Google Cloud 的驗證（`gcloud auth login` 和 `gcloud config set project <your-project-id>`）。

為你的專案啟用必要的 API。你可以使用 `gcloud` 命令列工具來完成這個步驟。

```bash
gcloud services enable \
    container.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    aiplatform.googleapis.com
```

將執行 `gcloud builds submit` 指令所需的必要角色授予預設的 Compute Engine 服務帳戶。



```bash
ROLES_TO_ASSIGN=(
    "roles/artifactregistry.writer"
    "roles/storage.objectViewer"
    "roles/logging.viewer"
    "roles/logging.logWriter"
)

for ROLE in "${ROLES_TO_ASSIGN[@]}"; do
    gcloud projects add-iam-policy-binding "${GOOGLE_CLOUD_PROJECT}" \
        --member="serviceAccount:${GOOGLE_CLOUD_PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
        --role="${ROLE}"
done
```

## 部署內容（Deployment payload） {#payload}

當你將 Agent Development Kit (ADK)（ADK）agent 工作流程部署到 Google Cloud GKE 時，下列內容會被上傳到服務：

- 你的 ADK agent 程式碼
- 你在 ADK agent 程式碼中宣告的所有相依套件
- 你的 agent 所使用的 ADK API server 程式碼版本

預設部署*不會*包含 ADK 網頁 UI 函式庫，除非你在部署設定中指定，例如在 `adk deploy gke` 指令中使用 `--with_ui` 選項。

## 部署選項（Deployment options）

你可以選擇**使用 Kubernetes manifests 手動部署**，或是**使用 `adk deploy gke` 指令自動部署**你的 agent 到 GKE。請依據你的工作流程選擇最合適的方式。

## 選項 1：使用 gcloud 與 kubectl 進行手動部署

### 建立 GKE 叢集

你可以使用 `gcloud` 命令列工具建立 GKE 叢集。以下範例會在 `us-central1` 區域建立一個名為 `adk-cluster` 的 Autopilot 叢集。

> 如果你要建立 GKE Standard 叢集，請確保已啟用 [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)。在 AutoPilot 叢集中，Workload Identity 預設即為啟用狀態。

```bash
gcloud container clusters create-auto adk-cluster \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

建立叢集後，您需要使用 `kubectl` 來連線至該叢集。此指令會將 `kubectl` 設定為使用新叢集的認證資訊。

```bash
gcloud container clusters get-credentials adk-cluster \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

### 建立您的代理（agent）

我們將參考 [大型語言模型 (LLM) 代理](../agents/llm-agents.md) 頁面中定義的 `capital_agent` 範例。

接下來，請將您的專案檔案組織如下：

```txt
your-project-directory/
├── capital_agent/
│   ├── __init__.py
│   └── agent.py       # Your agent code (see "Capital Agent example" below)
├── main.py            # FastAPI application entry point
├── requirements.txt   # Python dependencies
└── Dockerfile         # Container build instructions
```



### 程式碼檔案

請在 `your-project-directory/` 的根目錄下建立以下檔案（`main.py`、`requirements.txt`、`Dockerfile`、`capital_agent/agent.py`、`capital_agent/__init__.py`）。

1. 這是在 `capital_agent` 目錄下的 Capital Agent 範例

    ```python title="capital_agent/agent.py"
    from google.adk.agents import LlmAgent 

    # Define a tool function
    def get_capital_city(country: str) -> str:
      """Retrieves the capital city for a given country."""
      # Replace with actual logic (e.g., API call, database lookup)
      capitals = {"france": "Paris", "japan": "Tokyo", "canada": "Ottawa"}
      return capitals.get(country.lower(), f"Sorry, I don't know the capital of {country}.")

    # Add the tool to the agent
    capital_agent = LlmAgent(
        model="gemini-2.0-flash",
        name="capital_agent", #name of your agent
        description="Answers user questions about the capital city of a given country.",
        instruction="""You are an agent that provides the capital city of a country... (previous instruction text)""",
        tools=[get_capital_city] # Provide the function directly
    )

    # ADK will discover the root_agent instance
    root_agent = capital_agent
    ```
    
    將你的目錄標記為 Python 套件

    ```python title="capital_agent/__init__.py"

    from . import agent
    ```

2. This file sets up the FastAPI application using `get_fast_api_app()` from ADK:


譯文：
2. 此檔案使用 Agent Development Kit (ADK) 的 `get_fast_api_app()` 來建立 FastAPI 應用程式：

    ```python title="main.py"
    import os

    import uvicorn
    from fastapi import FastAPI
    from google.adk.cli.fast_api import get_fast_api_app

    # Get the directory where main.py is located
    AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
    # Example session service URI (e.g., SQLite)
    SESSION_SERVICE_URI = "sqlite:///./sessions.db"
    # Example allowed origins for CORS
    ALLOWED_ORIGINS = ["http://localhost", "http://localhost:8080", "*"]
    # Set web=True if you intend to serve a web interface, False otherwise
    SERVE_WEB_INTERFACE = True

    # Call the function to get the FastAPI app instance
    # Ensure the agent directory name ('capital_agent') matches your agent folder
    app: FastAPI = get_fast_api_app(
        agents_dir=AGENT_DIR,
        session_service_uri=SESSION_SERVICE_URI,
        allow_origins=ALLOWED_ORIGINS,
        web=SERVE_WEB_INTERFACE,
    )

    # You can add more FastAPI routes or configurations below if needed
    # Example:
    # @app.get("/hello")
    # async def read_root():
    #     return {"Hello": "World"}

    if __name__ == "__main__":
        # Use the PORT environment variable provided by Cloud Run, defaulting to 8080
        uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
    ```

    *注意：我們將 `agent_dir` 指定為 `main.py` 所在的目錄，並使用 `os.environ.get("PORT", 8080)` 以確保 Cloud Run 相容性。*

3. 列出所需的 Python 套件：

    ```txt title="requirements.txt"
    google-adk
    # Add any other dependencies your agent needs
    ```

4. Define the container image:


4. 定義容器映像檔：

    ```dockerfile title="Dockerfile"
    FROM python:3.13-slim
    WORKDIR /app

    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    RUN adduser --disabled-password --gecos "" myuser && \
        chown -R myuser:myuser /app

    COPY . .

    USER myuser

    ENV PATH="/home/myuser/.local/bin:$PATH"

    CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
    ```

### 建立容器映像檔

你需要建立一個 Google Artifact Registry 儲存庫來儲存你的容器映像檔。你可以使用 `gcloud` 命令列工具來完成這個操作。

```bash
gcloud artifacts repositories create adk-repo \
    --repository-format=docker \
    --location=$GOOGLE_CLOUD_LOCATION \
    --description="ADK repository"
```

使用 `gcloud` 命令列工具來建置容器映像檔。此範例會建置映像檔並將其標記為 `adk-repo/adk-agent:latest`。

```bash
gcloud builds submit \
    --tag $GOOGLE_CLOUD_LOCATION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/adk-repo/adk-agent:latest \
    --project=$GOOGLE_CLOUD_PROJECT \
    .
```

驗證映像檔已經建置並推送到 Artifact Registry：

```bash
gcloud artifacts docker images list \
  $GOOGLE_CLOUD_LOCATION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/adk-repo \
  --project=$GOOGLE_CLOUD_PROJECT
```

### 為 Vertex AI 設定 Kubernetes Service Account

如果你的 agent 使用 Vertex AI，你需要建立一個具有必要權限的 Kubernetes service account。以下範例會建立一個名為 `adk-agent-sa` 的 service account，並將其綁定到 `Vertex AI User` 角色。

> 如果你使用的是 AI Studio，並且透過 API KEY 存取模型，可以跳過此步驟。

```bash
kubectl create serviceaccount adk-agent-sa
```

請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。
```bash
gcloud projects add-iam-policy-binding projects/${GOOGLE_CLOUD_PROJECT} \
    --role=roles/aiplatform.user \
    --member=principal://iam.googleapis.com/projects/${GOOGLE_CLOUD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GOOGLE_CLOUD_PROJECT}.svc.id.goog/subject/ns/default/sa/adk-agent-sa \
    --condition=None
```

### 建立 Kubernetes manifest 檔案

在你的專案目錄中建立一個名為 `deployment.yaml` 的 Kubernetes 部署 manifest 檔案。此檔案用於定義如何在 GKE 上部署你的應用程式。

```yaml title="deployment.yaml"
cat <<  EOF > deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adk-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: adk-agent
  template:
    metadata:
      labels:
        app: adk-agent
    spec:
      serviceAccount: adk-agent-sa
      containers:
      - name: adk-agent
        imagePullPolicy: Always
        image: $GOOGLE_CLOUD_LOCATION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/adk-repo/adk-agent:latest
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
            ephemeral-storage: "128Mi"
          requests:
            memory: "128Mi"
            cpu: "500m"
            ephemeral-storage: "128Mi"
        ports:
        - containerPort: 8080
        env:
          - name: PORT
            value: "8080"
          - name: GOOGLE_CLOUD_PROJECT
            value: $GOOGLE_CLOUD_PROJECT
          - name: GOOGLE_CLOUD_LOCATION
            value: $GOOGLE_CLOUD_LOCATION
          - name: GOOGLE_GENAI_USE_VERTEXAI
            value: "$GOOGLE_GENAI_USE_VERTEXAI"
          # If using AI Studio, set GOOGLE_GENAI_USE_VERTEXAI to false and set the following:
          # - name: GOOGLE_API_KEY
          #   value: $GOOGLE_API_KEY
          # Add any other necessary environment variables your agent might need
---
apiVersion: v1
kind: Service
metadata:
  name: adk-agent
spec:       
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: adk-agent
EOF
```

### 部署應用程式

使用 `kubectl` 命令列工具（CLI）來部署應用程式。此指令會將部署與服務的 manifest 檔案套用到你的 GKE 叢集。

```bash
kubectl apply -f deployment.yaml
```

在幾秒鐘後，您可以使用以下指令來檢查您的部署狀態：

```bash
kubectl get pods -l=app=adk-agent
```

此指令會列出與您的部署相關聯的 pod。您應該會看到一個狀態為 `Running` 的 pod。

當 pod 執行中後，您可以使用以下指令檢查 service 的狀態：

```bash
kubectl get service adk-agent
```

如果輸出顯示`External IP`，表示您的服務已可從網際網路存取。指派外部 IP 可能需要幾分鐘的時間。

您可以使用以下指令取得服務的外部 IP 位址：

```bash
kubectl get svc adk-agent -o=jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

## 選項 2：使用 `adk deploy gke` 進行自動化部署

Agent Development Kit (ADK) 提供了一個命令列介面 (CLI) 指令，可簡化 GKE 部署流程。這樣可以避免手動建置映像檔、撰寫 Kubernetes 清單，或將映像推送到 Artifact Registry。

#### 先決條件

在開始之前，請確保已完成以下設定：

1. **已運作的 GKE 叢集：** 你需要在 Google Cloud 上有一個啟用中的 Kubernetes 叢集。

2. **必要的命令列介面 (CLI)：** 
    * **`gcloud` CLI：** 必須安裝 Google Cloud 命令列介面 (CLI)，並已驗證身份且設定為使用目標專案。請執行 `gcloud auth login` 和 `gcloud config set project [YOUR_PROJECT_ID]`。
    * **kubectl：** 必須安裝 Kubernetes 命令列介面 (CLI)，才能將應用程式部署到你的叢集。

3. **已啟用 Google Cloud API：** 請確認你的 Google Cloud 專案已啟用下列 API：
    * Kubernetes Engine API (`container.googleapis.com`)
    * Cloud Build API (`cloudbuild.googleapis.com`)
    * Container Registry API (`containerregistry.googleapis.com`)

4. **必要的 IAM 權限：** 執行指令的使用者或 Compute Engine 預設服務帳戶，至少需要以下角色：

   * **Kubernetes Engine Developer** (`roles/container.developer`)：用於與 GKE 叢集互動。

   * **Storage Object Viewer** (`roles/storage.objectViewer`)：允許 Cloud Build 從 Cloud Storage 儲存貯體下載原始碼，該原始碼是由 gcloud builds submit 上傳的。

   * **Artifact Registry Create on Push Writer** (`roles/artifactregistry.createOnPushWriter`)：允許 Cloud Build 將建置完成的容器映像推送至 Artifact Registry。此角色也允許在首次推送時，於 Artifact Registry 中即時建立特殊的 gcr.io 儲存庫（repository）。

   * **Logs Writer**  (`roles/logging.logWriter`)：允許 Cloud Build 將建置日誌寫入 Cloud Logging。

### `deploy gke` 指令

此指令會接收你的 agent 路徑及目標 GKE 叢集的相關參數。

#### 語法

```bash
adk deploy gke [OPTIONS] AGENT_PATH
```

### 參數與選項

| 參數        | 說明 | 是否必填 |
| -------- | ------- | ------  |
| AGENT_PATH  | 你的 agent 根目錄在本機的檔案路徑。    |是 |
| --project | 你的 GKE 叢集所屬的 Google Cloud 專案 ID。     | 是 | 
| --cluster_name   | 你的 GKE 叢集名稱。    | 是 |
| --region    | 叢集所在的 Google Cloud 區域（例如：us-central1）。    | 是 |
| --with_ui   | 同時部署 agent 的後端 API 以及配套的前端網頁 UI。    | 否 |
| --log_level   | 設定部署流程的日誌等級。可選項目：debug、info、warning、error。     | 否 |


### 運作方式說明
當你執行 `adk deploy gke` 指令時，Agent Development Kit (ADK)（ADK）會自動執行以下步驟：

- 容器化（Containerization）：從你的 agent 原始碼建構 Docker 容器映像檔。

- 映像檔推送（Image Push）：標記該容器映像檔，並推送到你的專案 Artifact Registry。

- 清單產生（Manifest Generation）：動態產生所需的 Kubernetes 清單檔案（`Deployment` 與 `Service`）。

- 叢集部署（Cluster Deployment）：將這些清單套用到你指定的 GKE 叢集，觸發以下動作：

`Deployment` 會指示 GKE 從 Artifact Registry 拉取容器映像檔，並在一個或多個 Pod 中執行。

`Service` 會為你的 agent 建立一個穩定的網路端點。預設情況下，這是一個 LoadBalancer 服務，會配置一個公開 IP 位址，讓你的 agent 能對外網路開放存取。


### 使用範例
以下是一個將位於 `~/agents/multi_tool_agent/` 的 agent 部署到名為 test 的 GKE 叢集的實用範例。

```bash
adk deploy gke \
    --project myproject \
    --cluster_name test \
    --region us-central1 \
    --with_ui \
    --log_level info \
    ~/agents/multi_tool_agent/
```

### 驗證您的部署

如果您使用了`adk deploy gke`，請使用`kubectl`來驗證部署：

1. 檢查 Pods：確保您的 agent 的 pods 處於 Running 狀態。

```bash
kubectl get pods
```
你應該會在預設命名空間中看到類似 `adk-default-service-name-xxxx-xxxx ... 1/1 Running` 的輸出。

2. 查找 External IP：取得你的 agent 服務的公開 IP 位址。

```bash
kubectl get service
NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
adk-default-service-name   LoadBalancer   34.118.228.70   34.63.153.253   80:32581/TCP   5d20h
```

我們可以前往 external IP，並透過 UI 與 agent 互動  
![alt text](../assets/agent-gke-deployment.png)

## 測試你的 agent

當你的 agent 部署到 GKE 後，你可以透過已部署的 UI（如果已啟用）或使用像是 `curl` 這類工具，直接與其 API 端點互動。你將需要在部署後提供的服務 URL。

=== "UI 測試"

    ### UI Testing

    If you deployed your agent with the UI enabled:

    You can test your agent by simply navigating to the kubernetes service URL in your web browser.

    The ADK dev UI allows you to interact with your agent, manage sessions, and view execution details directly in the browser.

    To verify your agent is working as intended, you can:

    1. Select your agent from the dropdown menu.
    2. Type a message and verify that you receive an expected response from your agent.

    If you experience any unexpected behavior, check the pod logs for your agent using:

    ```bash
    kubectl logs -l app=adk-agent
    ```

=== "API Testing (curl)"


=== "API 測試（curl）"

    ### API Testing (curl)

    You can interact with the agent's API endpoints using tools like `curl`. This is useful for programmatic interaction or if you deployed without the UI.

    #### Set the application URL

    Replace the example URL with the actual URL of your deployed Cloud Run service.

    ```bash
    export APP_URL=$(kubectl get service adk-agent -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    ```

    #### List available apps

    Verify the deployed application name.

    ```bash
    curl -X GET $APP_URL/list-apps
    ```

    *(Adjust the `app_name` in the following commands based on this output if needed. The default is often the agent directory name, e.g., `capital_agent`)*.

    #### Create or Update a Session

    Initialize or update the state for a specific user and session. Replace `capital_agent` with your actual app name if different. The values `user_123` and `session_abc` are example identifiers; you can replace them with your desired user and session IDs.

    ```bash
    curl -X POST \
        $APP_URL/apps/capital_agent/users/user_123/sessions/session_abc \
        -H "Content-Type: application/json" \
        -d '{"state": {"preferred_language": "English", "visit_count": 5}}'
    ```

    #### Run the Agent

    Send a prompt to your agent. Replace `capital_agent` with your app name and adjust the user/session IDs and prompt as needed.

    ```bash
    curl -X POST $APP_URL/run_sse \
        -H "Content-Type: application/json" \
        -d '{
        "app_name": "capital_agent",
        "user_id": "user_123",
        "session_id": "session_abc",
        "new_message": {
            "role": "user",
            "parts": [{
            "text": "What is the capital of Canada?"
            }]
        },
        "streaming": false
        }'
    ```

    * Set `"streaming": true` if you want to receive Server-Sent Events (SSE).
    * The response will contain the agent's execution events, including the final answer.

## 疑難排解

以下是將您的 agent 部署到 GKE 時，可能會遇到的一些常見問題：

### `Gemini 2.0 Flash` 出現 403 Permission Denied

這通常表示 Kubernetes 服務帳戶沒有存取 Vertex AI API 所需的權限。請確認您已依照 [Configure Kubernetes Service Account for Vertex AI](#configure-kubernetes-service-account-for-vertex-ai) 章節的說明，建立服務帳戶並將其綁定到 `Vertex AI User` 角色。如果您使用的是 AI Studio，請確保已在部署 manifest 中設定 `GOOGLE_API_KEY` 環境變數，且該值有效。

### 404 或 Not Found 回應

這通常表示您的請求有錯誤。請檢查應用程式日誌以診斷問題。 

```bash

export POD_NAME=$(kubectl get pod -l app=adk-agent -o jsonpath='{.items[0].metadata.name}')
kubectl logs $POD_NAME
```

### 嘗試寫入唯讀資料庫

你可能會發現在網頁 UI 中沒有建立 session id，且 agent 不會回應任何訊息。這通常是因為 SQLite 資料庫為唯讀所導致。這種情況可能發生在你先在本機執行 agent，然後建立容器映像檔，將 SQLite 資料庫複製進容器時。此時，資料庫在容器內會變成唯讀狀態。

```bash
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) attempt to write a readonly database
[SQL: UPDATE app_states SET state=?, update_time=CURRENT_TIMESTAMP WHERE app_states.app_name = ?]
```

為了解決這個問題，您可以採取以下其中一種方式：

在建立容器映像檔之前，從本機刪除 SQLite 資料庫檔案。這樣當容器啟動時，會自動建立一個新的 SQLite 資料庫。

```bash
rm -f sessions.db
```

或者（建議做法）你可以在你的專案目錄中新增一個 `.dockerignore` 檔案，以排除將 SQLite 資料庫複製到容器映像檔中。

```txt title=".dockerignore"
sessions.db
```

建置容器映像檔並再次部署應用程式。

### 沒有足夠權限串流日誌 `ERROR: (gcloud.builds.submit)`

當您沒有足夠的權限來串流建置日誌，或您的 VPC-SC 安全性政策限制了對預設日誌儲存桶的存取時，可能會出現此錯誤。

若要檢查建置進度，請依照錯誤訊息中提供的連結，或前往 Google Cloud Console 的 Cloud Build 頁面。

您也可以使用 [Build the container image](#build-the-container-image) 章節下的指令，驗證映像檔是否已建置並推送至 Artifact Registry。

### Gemini-2.0-Flash 不支援於 Live API

當您在已部署的 agent 上使用 Agent Development Kit (ADK) Dev UI 時，文字聊天功能可以正常運作，但語音（例如點擊麥克風按鈕）會失敗。您可能會在 pod 日誌中看到 `websockets.exceptions.ConnectionClosedError`，指出您的模型「not supported in the live api」。

此錯誤發生的原因是 agent 設定使用了不支援 Gemini Live API 的模型（如範例中的 `gemini-2.0-flash`）。Live API 是實現即時、雙向音訊與視訊串流所必須的。

## 清理資源

若要刪除 GKE 叢集及所有相關資源，請執行：

```bash
gcloud container clusters delete adk-cluster \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

要刪除 Artifact Registry 儲存庫，請執行：

```bash
gcloud artifacts repositories delete adk-repo \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

您也可以在不再需要時刪除該專案。這將會刪除與該專案相關的所有資源，包括 GKE 叢集、Artifact Registry 儲存庫，以及您所建立的其他所有資源。

```bash
gcloud projects delete $GOOGLE_CLOUD_PROJECT
```
