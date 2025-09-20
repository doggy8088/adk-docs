# ADK 教學 - 漸進式天氣機器人（ADK 工具版本）

本儲存庫包含「打造你的第一個智慧代理團隊：漸進式天氣機器人」教學的程式碼，特別針對搭配 Agent Development Kit (ADK) 內建命令列工具 `adk web`、`adk run` 和 `adk api_server` 使用而設計。

此版本讓你可以直接透過 ADK 工具執行教學的每個步驟，無需手動設定 runner 與 session 服務，這些都會由 ADK 工具自動處理。

**注意：** 如果你偏好在 notebook 環境（如 Colab 或 Jupyter）中自行控制 runner 與 session，請參考[原始 notebook 教學版本](../adk_tutorial.ipynb)。

## 先決條件

*   **Python：** 版本 3.9 - 3.12（請參考 ADK 文件以取得最新相容性資訊）。
*   **Git：** 用於複製本儲存庫。
*   **大型語言模型 (LLM) API 金鑰：** 你需要準備教學步驟中所需服務的 API 金鑰（Google Gemini，可能還有 OpenAI 和 Anthropic）。
    *   Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   OpenAI Platform: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
    *   Anthropic Console: [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

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
    *   **啟用（每次開啟新終端機工作階段時執行）：**
        *   macOS / Linux：
            ```bash
            source .venv/bin/activate
            ```
        *   Windows (Command Prompt):


*   Windows（命令提示字元）：
            ```bash
            .venv\Scripts\activate.bat
            ```
        *   Windows (PowerShell):


*   Windows（PowerShell）：
            ```ps1
            .venv\Scripts\Activate.ps1
            ```
        *(你應該會在終端機提示字元前看到 `(.venv)`)*

3.  **安裝相依套件：**
    安裝 Agent Development Kit (ADK) 與 LiteLLM（用於多模型支援）。
    ```bash
    pip install google-adk
    pip install litellm
    ```

## 設定：API 金鑰

在執行任何 agent 步驟之前，您**必須**先設定您的 API 金鑰。

1.  進入您想要執行的特定步驟目錄（例如：`step_1`、`step_2_anthropic`、`step_3` 等）。
2.  每個步驟目錄中都包含一個 `.env` 檔案。請使用文字編輯器開啟此檔案。
3.  將檔案中的預設占位值替換為您實際的 API 金鑰。

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
5.  **對*每個*你打算執行的步驟目錄中的 `.env` 檔案重複此流程。** 根據該步驟所使用的模型，所需的金鑰可能會略有不同。

## 執行範例

在執行以下指令前，請確保你的虛擬環境已經啟用。每個 `agent.py` 檔案（例如在 `step_1` 目錄中）都包含可用來測試 agent 的範例查詢。

### 使用 `adk web`（建議用於互動式 UI）

1.  **切換到上層的 `adk-tutorial` 目錄**（即包含 `step_1`、`step_2_...` 資料夾的目錄）。
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    cd /path/to/your/adk-tutorial
    ```
2.  **Run the command:**


2.  **執行以下指令：**
    ```bash
    adk web
    ```
3.  這將啟動一個本地網頁伺服器，並很可能自動在您的瀏覽器中開啟新分頁。
4.  在網頁 UI 中，您會看到一個下拉選單（通常位於左側）。請使用這個下拉選單來**選擇您想互動的 agent 步驟**（例如：`step_1`、`step_2_gpt4`、`step_6`）。
5.  選擇後，您可以在聊天介面中輸入訊息，與該步驟的 agent 互動。

### 使用 `adk run`（命令列互動）

`adk run` 指令可讓您直接在終端機與 agent 互動。通常需要指定 agent 檔案的路徑。

*   **範例（執行步驟 1）：**
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    adk run step_1
    ```
*   有關`adk run`的詳細用法與選項，請參考[官方 ADK 文件 - 執行你的 Agent](https://google.github.io/adk-docs/get-started/quickstart/#terminal-adk-run)。

### 使用 `adk api_server`（以 API 形式對外提供服務）

`adk api_server` 指令會啟動一個 FastAPI 伺服器，透過 API 端點對外提供你的 agent 服務。

*   **範例（服務 Step 1）：**
    ```bash
    # Make sure you are in the main 'adk-tutorial' folder
    adk api_server
    ```
*   有關`adk api_server`的詳細使用方式、API 端點結構及選項，請參閱 [官方 Agent Development Kit (ADK) 文件 - 測試你的 Agents](https://google.github.io/adk-docs/get-started/testing/)。

## 目錄結構

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

每個 `step_X` 目錄在代理邏輯（`agent.py`）及所需的 API 金鑰（`.env`）方面都是自給自足的。

## 關於步驟 4（Session State 與個人化）的說明

你可能會注意到，本教學版本（設計用於 `adk web`、`adk api_server` 或 `adk run`）中並未包含「步驟 4：使用 Session State 增加記憶與個人化」。

步驟 4 中展示 Session State 概念，特別是為了說明而直接操作 `InMemorySessionService`，最適合在互動式筆記本環境（如 Google Colab）中體驗。這樣可以立即執行程式碼並檢查狀態變化，而這些操作在使用 Agent Development Kit (ADK) 內建伺服器工具時較不直觀。

## 若要體驗包含步驟 4 的完整教學，請參考 [互動式筆記本版本](https://google.github.io/adk-docs/tutorials/agent-team/#step-4-adding-memory-and-personalization-with-session-state)

本資料夾型教學的後續步驟（步驟 5 之後）是以步驟 1-3 的概念為基礎設計，並可在此正確執行，重點展示如 callback 等功能，這些都能在 `adk web`/`run` 中完整呈現。
