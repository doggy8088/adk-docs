# ADK 教學 - 漸進式天氣機器人（ADK 工具版）

本儲存庫包含「打造你的第一個智慧型代理團隊：漸進式天氣機器人」教學的程式碼，特別針對搭配 Agent Development Kit (ADK) 內建命令列工具 `adk web`、`adk run` 和 `adk api_server` 使用而設計。

此版本讓你可以在不需手動設定 Runner 和 session 服務的情況下，直接執行教學的每個步驟，這些都由 ADK 工具自動處理。

**注意：** 如果你偏好使用筆記本環境（如 Colab 或 Jupyter），並希望手動控制 Runner 和 session，請參考[原始筆記本教學版本](../adk_tutorial.ipynb)。

## 先決條件

*   **Python：** 版本 3.9 - 3.12（請參閱 ADK 文件說明以取得最新相容性資訊）。
*   **Git：** 用於複製本儲存庫。
*   **大型語言模型 (LLM) API 金鑰：** 你需要為教學步驟中使用的服務準備 API 金鑰（Google Gemini，可能還有 OpenAI 和 Anthropic）。
    *   Google AI Studio：[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   OpenAI Platform：[https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
    *   Anthropic Console：[https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

## 安裝說明

1.  **複製儲存庫：**
    ```bash
    git clone https://github.com/google/adk-docs.git
    cd adk-docs/examples/python/tutorial/agent_team/adk-tutorial/ # Navigate into the cloned directory
    ```

2.  **建立並啟用虛擬環境（建議）：**
    這可以隔離專案的相依套件。

    *   **建立：**
        ```bash
        python -m venv .venv
        ```
    *   **啟用（在每個新的終端機工作階段執行）：**
        *   macOS / Linux：
            ```bash
            source .venv/bin/activate
            ```
        *   Windows（命令提示字元）：
            ```bash
            .venv\Scripts\activate.bat
            ```
        *   Windows（PowerShell）:
            ```ps1
            .venv\Scripts\Activate.ps1
            ```
        *(你應該會看到 `(.venv)` 出現在終端機提示字元前面)*

3.  **安裝相依套件：**  
    安裝 Agent Development Kit (ADK) 與 LiteLLM（支援多大型語言模型 (LLM)）。
    ```bash
    pip install google-adk
    pip install litellm
    ```

## 設定：API 金鑰

在執行任何 agent 步驟之前，您**必須**先設定您的 API 金鑰。

1.  進入您想要執行的特定步驟資料夾（例如：`step_1`、`step_2_anthropic`、`step_3` 等）。
2.  每個步驟的資料夾中都包含一個 `.env` 檔案。請使用文字編輯器開啟此檔案。
3.  將檔案中的預設值替換為您實際的 API 金鑰。

    **範例 `.env` 內容：**
    ```dotenv
    # Set to False to use API keys directly (required for multi-model)
    GOOGLE_GENAI_USE_VERTEXAI=FALSE

    # --- Replace with your actual keys ---
    GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_GOOGLE_API_KEY_HERE
    ANTHROPIC_API_KEY=PASTE_YOUR_ACTUAL_ANTHROPIC_API_KEY_HERE
    OPENAI_API_KEY=PASTE_YOUR_ACTUAL_OPENAI_API_KEY_HERE
    # --- End of keys ---
    ```
4.  **儲存 `.env` 檔案。**
5. 針對*每一個*你打算執行的步驟資料夾中的 `.env` 檔案，**重複上述流程**。所需的金鑰可能會根據該步驟所使用的模型略有不同。

## 執行範例

在執行以下指令前，請確保你的虛擬環境已啟用。每個 `agent.py` 檔案（例如在 `step_1` 中）都包含可用來測試 agent 的範例查詢。

### 使用 `adk web`（建議用於互動式 UI）

1.  **切換到上層的 `adk-tutorial` 資料夾**（即包含 `step_1`、`step_2_...` 資料夾的那個）。
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    cd /path/to/your/adk-tutorial
    ```
2.  **執行以下指令：**
    ```bash
    adk web
    ```
3.  這會啟動一個本機開發伺服器，並很可能自動在瀏覽器中開啟新分頁。
4.  在網頁 UI 中，你會看到一個下拉選單（通常位於左側）。請使用這個下拉選單來**選擇你想互動的 agent 步驟**（例如：`step_1`、`step_2_gpt4`、`step_6`）。
5.  選擇後，你可以在聊天介面中輸入訊息，與該步驟的 agent 互動。

### 使用 `adk run`（命令列互動）

`adk run` 指令可讓你直接從終端機與 agent 互動。你通常需要指定 agent 檔案的路徑。

*   **範例（執行步驟 1）：**
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    adk run step_1
    ```
*   有關 `adk run` 的詳細用法與選項，請參閱 [官方 Agent Development Kit (ADK) 文件說明 - 執行你的 agent](https://doggy8088.github.io/adk-docs/get-started/quickstart/#terminal-adk-run)。

### 使用 `adk api_server`（以 API 形式對外提供服務）

`adk api_server` 指令會啟動一個 FastAPI 伺服器，透過 API 端點對外提供你的 agent 服務。

*   **範例（服務 Step 1）：**
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    adk api_server
    ```
*   有關`adk api_server`的詳細使用方式、API 端點結構及選項，請參閱 [Official ADK Documentation - Testing your Agents](https://doggy8088.github.io/adk-docs/get-started/testing/)。

## 資料夾結構

```
adk-tutorial/
├── step_1/
│   ├── __init__.py
│   ├── agent.py      # Agent definition for Step 1
│   └── .env          # API Key configuration for Step 1
├── step_2_anthropic/
│   ├── __init__.py
│   ├── agent.py      # Agent definition for Step 2 (Anthropic)
│   └── .env          # API Key configuration for Step 2 (Anthropic)
├── step_2_gpt4/
│   ├── __init__.py
│   ├── agent.py      # Agent definition for Step 2 (GPT-4)
│   └── .env          # API Key configuration for Step 2 (GPT-4)
├── step_3/
│   ├── __init__.py
│   ├── agent.py      # Agent definition for Step 3
│   └── .env          # API Key configuration for Step 3
├── step_5/
│   # ...
└── step_6/
    # ...
└── README.md         # This file
```

每個 `step_X` 資料夾在其 agent 邏輯（`agent.py`）及所需的 API 金鑰（`.env`）方面，都是自給自足的。

## 關於步驟 4（session state 與個人化）的說明

你可能會注意到，本教學版本（設計用於 `adk web`、`adk api_server` 或 `adk run`）中，並未包含「步驟 4：使用 session state 增加記憶與個人化」。

步驟 4 中所展示的 session state 概念，特別是為了說明而直接操作 `InMemorySessionService`，最適合在互動式 notebook 環境（如 Google Colab）中體驗。這樣可以立即執行程式碼並觀察狀態變化，而這在使用 Agent Development Kit (ADK) 內建伺服器工具時較不直觀。

## 若要體驗包含步驟 4 的完整教學，請參考[這裡的互動式 notebook 版本](https://doggy8088.github.io/adk-docs/tutorials/agent-team/#step-4-adding-memory-and-personalization-with-session-state)

本資料夾式教學後續的步驟（步驟 5 起）是基於步驟 1-3 的概念設計，並可在此正確執行，重點在於如 Callbacks 等功能，這些都能在 `adk web`/`run` 中完整展示。
