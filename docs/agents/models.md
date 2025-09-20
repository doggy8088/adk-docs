# 在 ADK 中使用不同的模型

!!! Note
    Java ADK 目前支援 Gemini 與 Anthropic 模型。更多模型支援即將推出。

Agent Development Kit (ADK)（ADK）設計上強調彈性，讓你可以將各種大型語言模型 (Large Language Model, LLM) 整合到你的代理（agent）中。雖然 Google Gemini 模型的設定已在 [Setup Foundation Models](../get-started/installation.md) 指南中說明，本頁將進一步介紹如何有效運用 Gemini，並整合其他熱門模型，包括外部託管或本地執行的模型。

ADK 主要透過兩種機制來整合模型：

1. **直接字串／註冊表（Registry）：** 適用於與 Google Cloud 深度整合的模型（例如透過 Google AI Studio 或 Vertex AI 存取的 Gemini 模型），或是部署於 Vertex AI 端點的模型。你通常只需將模型名稱或端點資源字串直接提供給 `LlmAgent`。ADK 內部的註冊表會將這個字串解析為對應的後端 client，通常會使用 `google-genai` 函式庫。
2. **包裝類別（Wrapper Classes）：** 為了更廣泛的相容性，特別是針對 Google 生態系統以外，或需要特定 client 設定的模型（例如透過 LiteLLM 存取的模型）。你可以實例化特定的包裝類別（例如 `LiteLlm`），並將此物件作為 `model` 參數傳遞給你的 `LlmAgent`。

以下章節將依你的需求，指引你如何使用這些方法。

## 使用 Google Gemini 模型

本節說明如何與 Google 的 Gemini 模型進行驗證，無論是透過 Google AI Studio 進行快速開發，或是透過 Google Cloud Vertex AI 滿足企業應用需求。這是於 ADK 中使用 Google 旗艦模型最直接的方式。

**整合方式：** 完成下述任一驗證方法後，你可以直接將模型的識別字串傳遞給 `LlmAgent` 的 `model` 參數。

!!!tip 

    The `google-genai` library, used internally by ADK for Gemini models, can connect
    through either Google AI Studio or Vertex AI.

    **Model support for voice/video streaming**

    In order to use voice/video streaming in ADK, you will need to use Gemini
    models that support the Live API. You can find the **model ID(s)** that
    support the Gemini Live API in the documentation:

    - [Google AI Studio: Gemini Live API](https://ai.google.dev/gemini-api/docs/models#live-api)
    - [Vertex AI: Gemini Live API](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api)

### Google AI Studio

這是最簡單的方法，建議用於快速開始。

*   **驗證方式：** API KEY
*   **設定步驟：**
    1.  **取得 API KEY：** 從 [Google AI Studio](https://aistudio.google.com/apikey) 取得您的金鑰。
    2.  **設定環境變數：** 在您的專案根目錄下建立 `.env` 檔案（Python）或 `.properties`（Java），並加入以下內容。Agent Development Kit (ADK) 會自動載入此檔案。

        ```shell
        export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
        export GOOGLE_GENAI_USE_VERTEXAI=FALSE
        ```

        （或）

        在模型初始化時，透過 `Client` 傳遞這些變數（請參考下方範例）。

* **模型：** 請至 [Google AI for Developers site](https://ai.google.dev/gemini-api/docs/models) 查詢所有可用模型。

### Google Cloud Vertex AI

對於可擴展且以生產環境為導向的使用情境，建議使用 Vertex AI 平台。Gemini on Vertex AI 支援企業級功能、安全性與合規性控管。根據您的開發環境與使用情境，*請選擇下列其中一種方式進行驗證*。

**先決條件：** 需有一個已[啟用 Vertex AI 的 Google Cloud 專案](https://console.cloud.google.com/apis/enableflow;apiid=aiplatform.googleapis.com)。

### **方法 A：使用者憑證（適用於本機開發）**

1.  **安裝 gcloud 命令列介面 (CLI)：** 請依照官方[安裝說明](https://cloud.google.com/sdk/docs/install)操作。
2.  **使用 ADC 登入：** 此指令會開啟瀏覽器，讓您驗證本機開發所需的使用者帳戶。
    ```bash
    gcloud auth application-default login
    ```
3.  **Set environment variables:**


3.  **設定環境變數：**
    ```shell
    export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
    export GOOGLE_CLOUD_LOCATION="YOUR_VERTEX_AI_LOCATION" # e.g., us-central1
    ```     
    
    明確告訴函式庫使用 Vertex AI：

    ```shell
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

4. **Models：** 請參閱 [Vertex AI documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models) 以查詢可用的模型 ID。

### **方法 B：Vertex AI Express Mode**
[Vertex AI Express Mode](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview) 提供簡化的、基於 API 金鑰的設定方式，適合快速原型開發。

1.  **註冊 Express Mode** 以取得您的 API 金鑰。
2.  **設定環境變數：**
    ```shell
    export GOOGLE_API_KEY="PASTE_YOUR_EXPRESS_MODE_API_KEY_HERE"
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

### **方法 C：服務帳戶（適用於正式環境與自動化）**

對於已部署的應用程式，服務帳戶是標準做法。

1.  [**建立服務帳戶**](https://cloud.google.com/iam/docs/service-accounts-create#console) 並賦予其 `Vertex AI User` 角色。
2.  **將憑證提供給你的應用程式：**
    *   **在 Google Cloud 上：** 如果你在 Cloud Run、GKE、VM 或其他 Google Cloud 服務上執行 agent，環境可以自動提供服務帳戶憑證。你無需建立金鑰檔案。
    *   **在其他環境：** 建立一個 [服務帳戶金鑰檔案](https://cloud.google.com/iam/docs/keys-create-delete#console)，並使用環境變數指向該檔案：
        ```bash
        export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
        ```
    除了使用金鑰檔案之外，你也可以透過 Workload Identity 來驗證 service account。不過，這超出了本指南的範圍。

**範例：**

=== "Python"

    ```python
    from google.adk.agents import LlmAgent
    
    # --- Example using a stable Gemini Flash model ---
    agent_gemini_flash = LlmAgent(
        # Use the latest stable Flash model identifier
        model="gemini-2.0-flash",
        name="gemini_flash_agent",
        instruction="You are a fast and helpful Gemini assistant.",
        # ... other agent parameters
    )
    
    # --- Example using a powerful Gemini Pro model ---
    # Note: Always check the official Gemini documentation for the latest model names,
    # including specific preview versions if needed. Preview models might have
    # different availability or quota limitations.
    agent_gemini_pro = LlmAgent(
        # Use the latest generally available Pro model identifier
        model="gemini-2.5-pro-preview-03-25",
        name="gemini_pro_agent",
        instruction="You are a powerful and knowledgeable Gemini assistant.",
        # ... other agent parameters
    )
    ```

=== "Java"

    ```java
    // --- Example #1: using a stable Gemini Flash model with ENV variables---
    LlmAgent agentGeminiFlash =
        LlmAgent.builder()
            // Use the latest stable Flash model identifier
            .model("gemini-2.0-flash") // Set ENV variables to use this model
            .name("gemini_flash_agent")
            .instruction("You are a fast and helpful Gemini assistant.")
            // ... other agent parameters
            .build();

    // --- Example #2: using a powerful Gemini Pro model with API Key in model ---
    LlmAgent agentGeminiPro =
        LlmAgent.builder()
            // Use the latest generally available Pro model identifier
            .model(new Gemini("gemini-2.5-pro-preview-03-25",
                Client.builder()
                    .vertexAI(false)
                    .apiKey("API_KEY") // Set the API Key (or) project/ location
                    .build()))
            // Or, you can also directly pass the API_KEY
            // .model(new Gemini("gemini-2.5-pro-preview-03-25", "API_KEY"))
            .name("gemini_pro_agent")
            .instruction("You are a powerful and knowledgeable Gemini assistant.")
            // ... other agent parameters
            .build();

    // Note: Always check the official Gemini documentation for the latest model names,
    // including specific preview versions if needed. Preview models might have
    // different availability or quota limitations.
    ```

!!!warning "保護您的憑證"
    服務帳戶憑證或 API 金鑰屬於高權限憑證。切勿將其公開暴露。請使用像是 [Google Secret Manager](https://cloud.google.com/secret-manager) 這類的秘密管理工具，在正式環境中安全地儲存與存取這些憑證。

## 使用 Anthropic 模型

![java_only](https://img.shields.io/badge/Supported_in-Java-orange){ title="此功能目前僅支援 Java。Python 版本若需直接串接 Anthropic API（非 Vertex），請透過 LiteLLM。"}

您可以直接透過 Anthropic 的 API 金鑰，或是從 Vertex AI 後端，將 Anthropic 的 Claude 模型整合至您的 Java Agent Development Kit (ADK) 應用程式，方法是使用 ADK 的 `Claude` 包裝類別。

若需使用 Vertex AI 後端，請參閱 [Third-Party Models on Vertex AI](#third-party-models-on-vertex-ai-eg-anthropic-claude) 章節。

**先決條件：**

1.  **相依套件：**
    *   **Anthropic SDK 類別（傳遞式相依套件）：** Java ADK 的 `com.google.adk.models.Claude` 包裝類別會依賴 Anthropic 官方 Java SDK 的相關類別。這些通常會作為**傳遞式相依套件**一併安裝。

2.  **Anthropic API 金鑰：**
    *   向 Anthropic 申請 API 金鑰。請使用秘密管理工具安全管理此金鑰。

**整合方式：**

建立 `com.google.adk.models.Claude` 實例，並提供欲使用的 Claude 模型名稱，以及一個已設定 API 金鑰的 `AnthropicOkHttpClient`。接著，將此 `Claude` 實例傳入您的 `LlmAgent`。

**範例：**

```java
import com.anthropic.client.AnthropicClient;
import com.google.adk.agents.LlmAgent;
import com.google.adk.models.Claude;
import com.anthropic.client.okhttp.AnthropicOkHttpClient; // From Anthropic's SDK

public class DirectAnthropicAgent {
  
  private static final String CLAUDE_MODEL_ID = "claude-3-7-sonnet-latest"; // Or your preferred Claude model

  public static LlmAgent createAgent() {

    // It's recommended to load sensitive keys from a secure config
    AnthropicClient anthropicClient = AnthropicOkHttpClient.builder()
        .apiKey("ANTHROPIC_API_KEY")
        .build();

    Claude claudeModel = new Claude(
        CLAUDE_MODEL_ID,
        anthropicClient
    );

    return LlmAgent.builder()
        .name("claude_direct_agent")
        .model(claudeModel)
        .instruction("You are a helpful AI assistant powered by Anthropic Claude.")
        // ... other LlmAgent configurations
        .build();
  }

  public static void main(String[] args) {
    try {
      LlmAgent agent = createAgent();
      System.out.println("Successfully created direct Anthropic agent: " + agent.name());
    } catch (IllegalStateException e) {
      System.err.println("Error creating agent: " + e.getMessage());
    }
  }
}
```



## 透過 LiteLLM 使用雲端與專有模型

![python_only](https://img.shields.io/badge/Supported_in-Python-blue)

為了存取來自 OpenAI、Anthropic（非 Vertex AI）、Cohere 及其他眾多供應商的各式大型語言模型 (LLM)，Agent Development Kit (ADK)（ADK）提供了與 LiteLLM 函式庫的整合。

**整合方式：** 實例化 `LiteLlm` 包裝類別，並將其傳遞給 `LlmAgent` 的 `model` 參數。

**LiteLLM 簡介：** [LiteLLM](https://docs.litellm.ai/) 作為轉譯層，為超過 100 種大型語言模型 (LLM) 提供標準化、相容於 OpenAI 的介面。

**設定步驟：**

1. **安裝 LiteLLM：**
        ```shell
        pip install litellm
        ```
2. **設定提供者的 API 金鑰：** 將 API 金鑰設定為你打算使用的特定提供者的環境變數。

    * *以 OpenAI 為例：*

        ```shell
        export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        ```

    * *Anthropic（非 Vertex AI）範例：*

        ```shell
        export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
        ```

    * *請參閱
      [LiteLLM Providers Documentation](https://docs.litellm.ai/docs/providers)
      以取得其他提供者正確的環境變數名稱。*

        **範例：**

        ```python
        from google.adk.agents import LlmAgent
        from google.adk.models.lite_llm import LiteLlm

        # --- Example Agent using OpenAI's GPT-4o ---
        # (Requires OPENAI_API_KEY)
        agent_openai = LlmAgent(
            model=LiteLlm(model="openai/gpt-4o"), # LiteLLM model string format
            name="openai_agent",
            instruction="You are a helpful assistant powered by GPT-4o.",
            # ... other agent parameters
        )

        # --- Example Agent using Anthropic's Claude Haiku (non-Vertex) ---
        # (Requires ANTHROPIC_API_KEY)
        agent_claude_direct = LlmAgent(
            model=LiteLlm(model="anthropic/claude-3-haiku-20240307"),
            name="claude_direct_agent",
            instruction="You are an assistant powered by Claude Haiku.",
            # ... other agent parameters
        )
        ```

!!!warning "LiteLLM 的 Windows 編碼注意事項"

    When using ADK agents with LiteLLM on Windows, you might encounter a `UnicodeDecodeError`. This error occurs because LiteLLM may attempt to read cached files using the default Windows encoding (`cp1252`) instead of UTF-8.

    To prevent this, we recommend setting the `PYTHONUTF8` environment variable to `1`. This forces Python to use UTF-8 for all file I/O.

    **Example (PowerShell):**
    ```powershell
    # Set for the current session
    $env:PYTHONUTF8 = "1"

    # Set persistently for the user
    [System.Environment]::SetEnvironmentVariable('PYTHONUTF8', '1', [System.EnvironmentVariableTarget]::User)
    ```


## 透過 LiteLLM 使用開源與本地模型

![python_only](https://img.shields.io/badge/Supported_in-Python-blue)

為了獲得最大的控制權、節省成本、提升隱私，或支援離線使用情境，你可以在本地端運行開源模型，或自行架設模型伺服器，並透過 LiteLLM 進行整合。

**整合方式：** 實例化 `LiteLlm` 包裝類別，並設定指向你的本地模型伺服器。

### Ollama 整合

[Ollama](https://ollama.com/) 讓你能夠輕鬆在本地端運行開源模型。

#### 模型選擇

如果你的 agent 需要依賴 tools，請務必從 [Ollama 網站](https://ollama.com/search?c=tools) 選擇支援 tools 的模型。

為了獲得穩定可靠的結果，我們建議選用具備 tools 支援的中大型模型。

你可以使用以下指令來檢查模型是否支援 tools：

```bash
ollama show mistral-small3.1
  Model
    architecture        mistral3
    parameters          24.0B
    context length      131072
    embedding length    5120
    quantization        Q4_K_M

  Capabilities
    completion
    vision
    tools
```

你應該會在 capabilities（功能）下看到 `tools` 被列出。

你也可以查看該模型所使用的 template（範本），並根據你的需求進行調整。

```bash
ollama show --modelfile llama3.2 > model_file_to_modify
```

例如，上述模型的預設模板本身就暗示該模型會一直呼叫函式。這可能導致函式呼叫產生無限迴圈。

```
Given the following functions, please respond with a JSON for a function call
with its proper arguments that best answers the given prompt.

Respond in the format {"name": function name, "parameters": dictionary of
argument name and its value}. Do not use variables.
```

你可以將這類提示詞（prompt）替換為更具描述性的內容，以避免出現無限的工具呼叫迴圈。

例如：

```
Review the user's prompt and the available functions listed below.
First, determine if calling one of these functions is the most appropriate way to respond. A function call is likely needed if the prompt asks for a specific action, requires external data lookup, or involves calculations handled by the functions. If the prompt is a general question or can be answered directly, a function call is likely NOT needed.

If you determine a function call IS required: Respond ONLY with a JSON object in the format {"name": "function_name", "parameters": {"argument_name": "value"}}. Ensure parameter values are concrete, not variables.

If you determine a function call IS NOT required: Respond directly to the user's prompt in plain text, providing the answer or information requested. Do not output any JSON.
```

然後你可以使用以下指令來建立新的模型：

```bash
ollama create llama3.2-modified -f model_file_to_modify
```

#### 使用 ollama_chat provider

我們的 LiteLLM 包裝器可用於搭配 Ollama 模型建立 agent。

```py
root_agent = Agent(
    model=LiteLlm(model="ollama_chat/mistral-small3.1"),
    name="dice_agent",
    description=(
        "hello world agent that can roll a dice of 8 sides and check prime"
        " numbers."
    ),
    instruction="""
      You roll dice and answer questions about the outcome of the dice rolls.
    """,
    tools=[
        roll_die,
        check_prime,
    ],
)
```

**請務必設定 provider 為 `ollama_chat`，而非 `ollama`。若使用 `ollama`，將會導致非預期行為，例如無限的工具呼叫迴圈，以及忽略先前的上下文。**

雖然可以在 LiteLLM 內部提供 `api_base` 來進行生成，但自 v1.65.5 版起，LiteLLM 函式庫在完成後會依賴環境變數來呼叫其他 API。因此，目前我們建議將環境變數 `OLLAMA_API_BASE` 設定為指向 ollama 伺服器。

```bash
export OLLAMA_API_BASE="http://localhost:11434"
adk web
```

#### 使用 openai provider

另外，也可以將 `openai` 作為 provider 名稱。但這同時需要設定 `OPENAI_API_BASE=http://localhost:11434/v1` 和 `OPENAI_API_KEY=anything` 這兩個環境變數，而不是 `OLLAMA_API_BASE`。**請注意，api base 現在的結尾有 `/v1`。**

```py
root_agent = Agent(
    model=LiteLlm(model="openai/mistral-small3.1"),
    name="dice_agent",
    description=(
        "hello world agent that can roll a dice of 8 sides and check prime"
        " numbers."
    ),
    instruction="""
      You roll dice and answer questions about the outcome of the dice rolls.
    """,
    tools=[
        roll_die,
        check_prime,
    ],
)
```

請提供原文、初始譯文、品質分析與改進建議，我才能根據您的要求進行翻譯改進。
```bash
export OPENAI_API_BASE=http://localhost:11434/v1
export OPENAI_API_KEY=anything
adk web
```

#### 除錯

你可以在 agent 程式碼中，於 import 之後加入以下內容，即可查看發送到 Ollama 伺服器的請求。

```py
import litellm
litellm._turn_on_debug()
```

請尋找如下所示的行：

```bash
Request Sent from LiteLLM:
curl -X POST \
http://localhost:11434/api/chat \
-d '{'model': 'mistral-small3.1', 'messages': [{'role': 'system', 'content': ...
```

### 自行架設端點（例如 vLLM）

![python_only](https://img.shields.io/badge/Supported_in-Python-blue)

像是 [vLLM](https://github.com/vllm-project/vllm) 這類工具可以讓你高效地自行架設模型，並且通常會提供相容於 OpenAI 的 API 端點。

**設定步驟：**

1. **部署模型：** 使用 vLLM（或類似工具）部署你選擇的模型。
   請記下 API base URL（例如：`https://your-vllm-endpoint.run.app/v1`）。
    * *針對 Agent Development Kit (ADK) 工具的重要提醒：* 部署時，請確保所使用的服務工具支援並啟用相容於 OpenAI 的工具／函式呼叫。對於 vLLM，這可能需要加上像是 `--enable-auto-tool-choice` 的旗標，並且根據模型不同，可能還需要指定 `--tool-call-parser`。詳細請參考 vLLM 的 Tool Use 文件。
2. **驗證機制：** 確認你的端點如何處理驗證（例如：API key、bearer token）。

    **整合範例：**

    ```python
    import subprocess
    from google.adk.agents import LlmAgent
    from google.adk.models.lite_llm import LiteLlm

    # --- Example Agent using a model hosted on a vLLM endpoint ---

    # Endpoint URL provided by your vLLM deployment
    api_base_url = "https://your-vllm-endpoint.run.app/v1"

    # Model name as recognized by *your* vLLM endpoint configuration
    model_name_at_endpoint = "hosted_vllm/google/gemma-3-4b-it" # Example from vllm_test.py

    # Authentication (Example: using gcloud identity token for a Cloud Run deployment)
    # Adapt this based on your endpoint's security
    try:
        gcloud_token = subprocess.check_output(
            ["gcloud", "auth", "print-identity-token", "-q"]
        ).decode().strip()
        auth_headers = {"Authorization": f"Bearer {gcloud_token}"}
    except Exception as e:
        print(f"Warning: Could not get gcloud token - {e}. Endpoint might be unsecured or require different auth.")
        auth_headers = None # Or handle error appropriately

    agent_vllm = LlmAgent(
        model=LiteLlm(
            model=model_name_at_endpoint,
            api_base=api_base_url,
            # Pass authentication headers if needed
            extra_headers=auth_headers
            # Alternatively, if endpoint uses an API key:
            # api_key="YOUR_ENDPOINT_API_KEY"
        ),
        name="vllm_agent",
        instruction="You are a helpful assistant running on a self-hosted vLLM endpoint.",
        # ... other agent parameters
    )
    ```

## 在 Vertex AI 上使用託管與微調模型

若需企業級的擴展性、可靠性，以及與 Google Cloud MLOps 生態系統的整合，您可以使用部署到 Vertex AI Endpoint 的模型。這包含來自 Model Garden 的模型，或您自行微調的模型。

**整合方式：** 將完整的 Vertex AI Endpoint 資源字串（`projects/PROJECT_ID/locations/LOCATION/endpoints/ENDPOINT_ID`）直接傳遞給 `LlmAgent` 的 `model` 參數。

**Vertex AI 設定（整合步驟）：**

請確保您的環境已正確設定以使用 Vertex AI：

1. **驗證（Authentication）：** 使用 Application Default Credentials（ADC）：

    ```shell
    gcloud auth application-default login
    ```

2. **Environment Variables:** Set your project and location:


2. **環境變數：**請設定您的專案與位置 (Location)：

    ```shell
    export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
    export GOOGLE_CLOUD_LOCATION="YOUR_VERTEX_AI_LOCATION" # e.g., us-central1
    ```

3. **啟用 Vertex 後端：** 最重要的是，請確保 `google-genai` 函式庫
   以 Vertex AI 為目標：

    ```shell
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

### Model Garden 部署

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出／即將推出。"}

您可以將各種開放式與專有模型，從
[Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
部署到端點（endpoint）。

**範例：**

```python
from google.adk.agents import LlmAgent
from google.genai import types # For config objects

# --- Example Agent using a Llama 3 model deployed from Model Garden ---

# Replace with your actual Vertex AI Endpoint resource name
llama3_endpoint = "projects/YOUR_PROJECT_ID/locations/us-central1/endpoints/YOUR_LLAMA3_ENDPOINT_ID"

agent_llama3_vertex = LlmAgent(
    model=llama3_endpoint,
    name="llama3_vertex_agent",
    instruction="You are a helpful assistant based on Llama 3, hosted on Vertex AI.",
    generate_content_config=types.GenerateContentConfig(max_output_tokens=2048),
    # ... other agent parameters
)
```

### 微調模型端點

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將推出。"}

部署您所微調的模型（無論是基於 Gemini 或其他 Vertex AI 支援的架構），都會產生一個可直接使用的端點。

**範例：**

```python
from google.adk.agents import LlmAgent

# --- Example Agent using a fine-tuned Gemini model endpoint ---

# Replace with your fine-tuned model's endpoint resource name
finetuned_gemini_endpoint = "projects/YOUR_PROJECT_ID/locations/us-central1/endpoints/YOUR_FINETUNED_ENDPOINT_ID"

agent_finetuned_gemini = LlmAgent(
    model=finetuned_gemini_endpoint,
    name="finetuned_gemini_agent",
    instruction="You are a specialized assistant trained on specific data.",
    # ... other agent parameters
)
```

### 在 Vertex AI 上使用第三方模型（例如 Anthropic Claude）

部分供應商，如 Anthropic，會直接透過 Vertex AI 提供其模型。

=== "Python"

    **Integration Method:** Uses the direct model string (e.g.,
    `"claude-3-sonnet@20240229"`), *but requires manual registration* within ADK.
    
    **Why Registration?** ADK's registry automatically recognizes `gemini-*` strings
    and standard Vertex AI endpoint strings (`projects/.../endpoints/...`) and
    routes them via the `google-genai` library. For other model types used directly
    via Vertex AI (like Claude), you must explicitly tell the ADK registry which
    specific wrapper class (`Claude` in this case) knows how to handle that model
    identifier string with the Vertex AI backend.
    
    **Setup:**
    
    1. **Vertex AI Environment:** Ensure the consolidated Vertex AI setup (ADC, Env
       Vars, `GOOGLE_GENAI_USE_VERTEXAI=TRUE`) is complete.
    
    2. **Install Provider Library:** Install the necessary client library configured
       for Vertex AI.
    
        ```shell
        pip install "anthropic[vertex]"
        ```
    
    3. **Register Model Class:** Add this code near the start of your application,
       *before* creating an agent using the Claude model string:
    
        ```python
        # Required for using Claude model strings directly via Vertex AI with LlmAgent
        from google.adk.models.anthropic_llm import Claude
        from google.adk.models.registry import LLMRegistry
    
        LLMRegistry.register(Claude)
        ```
    
       **Example:**

       ```python
       from google.adk.agents import LlmAgent
       from google.adk.models.anthropic_llm import Claude # Import needed for registration
       from google.adk.models.registry import LLMRegistry # Import needed for registration
       from google.genai import types
        
       # --- Register Claude class (do this once at startup) ---
       LLMRegistry.register(Claude)
        
       # --- Example Agent using Claude 3 Sonnet on Vertex AI ---
        
       # Standard model name for Claude 3 Sonnet on Vertex AI
       claude_model_vertexai = "claude-3-sonnet@20240229"
        
       agent_claude_vertexai = LlmAgent(
           model=claude_model_vertexai, # Pass the direct string after registration
           name="claude_vertexai_agent",
           instruction="You are an assistant powered by Claude 3 Sonnet on Vertex AI.",
           generate_content_config=types.GenerateContentConfig(max_output_tokens=4096),
           # ... other agent parameters
       )
       ```

=== "Java"

    **Integration Method:** Directly instantiate the provider-specific model class (e.g., `com.google.adk.models.Claude`) and configure it with a Vertex AI backend.
    
    **Why Direct Instantiation?** The Java ADK's `LlmRegistry` primarily handles Gemini models by default. For third-party models like Claude on Vertex AI, you directly provide an instance of the ADK's wrapper class (e.g., `Claude`) to the `LlmAgent`. This wrapper class is responsible for interacting with the model via its specific client library, configured for Vertex AI.
    
    **Setup:**
    
    1.  **Vertex AI Environment:**
        *   Ensure your Google Cloud project and region are correctly set up.
        *   **Application Default Credentials (ADC):** Make sure ADC is configured correctly in your environment. This is typically done by running `gcloud auth application-default login`. The Java client libraries will use these credentials to authenticate with Vertex AI. Follow the [Google Cloud Java documentation on ADC](https://cloud.google.com/java/docs/reference/google-auth-library/latest/com.google.auth.oauth2.GoogleCredentials#com_google_auth_oauth2_GoogleCredentials_getApplicationDefault__) for detailed setup.
    
    2.  **Provider Library Dependencies:**
        *   **Third-Party Client Libraries (Often Transitive):** The ADK core library often includes the necessary client libraries for common third-party models on Vertex AI (like Anthropic's required classes) as **transitive dependencies**. This means you might not need to explicitly add a separate dependency for the Anthropic Vertex SDK in your `pom.xml` or `build.gradle`.

    3.  **Instantiate and Configure the Model:**
        When creating your `LlmAgent`, instantiate the `Claude` class (or the equivalent for another provider) and configure its `VertexBackend`.
    
    **Example:**

    ```java
    import com.anthropic.client.AnthropicClient;
    import com.anthropic.client.okhttp.AnthropicOkHttpClient;
    import com.anthropic.vertex.backends.VertexBackend;
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.models.Claude; // ADK's wrapper for Claude
    import com.google.auth.oauth2.GoogleCredentials;
    import java.io.IOException;

    // ... other imports

    public class ClaudeVertexAiAgent {

        public static LlmAgent createAgent() throws IOException {
            // Model name for Claude 3 Sonnet on Vertex AI (or other versions)
            String claudeModelVertexAi = "claude-3-7-sonnet"; // Or any other Claude model

            // Configure the AnthropicOkHttpClient with the VertexBackend
            AnthropicClient anthropicClient = AnthropicOkHttpClient.builder()
                .backend(
                    VertexBackend.builder()
                        .region("us-east5") // Specify your Vertex AI region
                        .project("your-gcp-project-id") // Specify your GCP Project ID
                        .googleCredentials(GoogleCredentials.getApplicationDefault())
                        .build())
                .build();

            // Instantiate LlmAgent with the ADK Claude wrapper
            LlmAgent agentClaudeVertexAi = LlmAgent.builder()
                .model(new Claude(claudeModelVertexAi, anthropicClient)) // Pass the Claude instance
                .name("claude_vertexai_agent")
                .instruction("You are an assistant powered by Claude 3 Sonnet on Vertex AI.")
                // .generateContentConfig(...) // Optional: Add generation config if needed
                // ... other agent parameters
                .build();
            
            return agentClaudeVertexAi;
        }

        public static void main(String[] args) {
            try {
                LlmAgent agent = createAgent();
                System.out.println("Successfully created agent: " + agent.name());
                // Here you would typically set up a Runner and Session to interact with the agent
            } catch (IOException e) {
                System.err.println("Failed to create agent: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
    ```
