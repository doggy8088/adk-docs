# 快速開始

本快速開始將引導你安裝 Agent Development Kit (ADK)，
建立一個包含多個工具的基本 agent，並在本機端以終端機或互動式瀏覽器開發 UI 執行。

<!-- <img src="../../assets/quickstart.png" alt="Quickstart setup"> -->

本快速開始假設你已在本機 IDE（如 VS Code、PyCharm、IntelliJ IDEA 等）中
安裝 Python 3.9+ 或 Java 17+，並可存取終端機。此方法會讓
應用程式完全在你的機器上運行，建議用於內部開發。

## 1. 建立環境並安裝 ADK { #set-up-environment-install-adk }

=== "Python"

    Create & Activate Virtual Environment (Recommended):

    ```bash
    # Create
    python -m venv .venv
    # Activate (each new terminal)
    # macOS/Linux: source .venv/bin/activate
    # Windows CMD: .venv\Scripts\activate.bat
    # Windows PowerShell: .venv\Scripts\Activate.ps1
    ```

    Install ADK:

    ```bash
    pip install google-adk
    ```

=== "Java"

    To install ADK and setup the environment, proceed to the following steps.

## 2. 建立 Agent 專案 { #create-agent-project }

### 專案結構

=== "Python"

    You will need to create the following project structure:

    ```console
    parent_folder/
        multi_tool_agent/
            __init__.py
            agent.py
            .env
    ```

    Create the folder `multi_tool_agent`:

    ```bash
    mkdir multi_tool_agent/
    ```

    !!! info "Note for Windows users"

        When using ADK on Windows for the next few steps, we recommend creating
        Python files using File Explorer or an IDE because the following commands
        (`mkdir`, `echo`) typically generate files with null bytes and/or incorrect
        encoding.

    ### `__init__.py`

    Now create an `__init__.py` file in the folder:

    ```shell
    echo "from . import agent" > multi_tool_agent/__init__.py
    ```

    Your `__init__.py` should now look like this:

    ```python title="multi_tool_agent/__init__.py"
    --8<-- "examples/python/snippets/get-started/multi_tool_agent/__init__.py"
    ```

    ### `agent.py`

    Create an `agent.py` file in the same folder:

    === "OS X &amp; Linux"
        ```shell
        touch multi_tool_agent/agent.py
        ```

    === "Windows"
        ```shell
        type nul > multi_tool_agent/agent.py
        ```

    Copy and paste the following code into `agent.py`:

    ```python title="multi_tool_agent/agent.py"
    --8<-- "examples/python/snippets/get-started/multi_tool_agent/agent.py"
    ```

    ### `.env`

    Create a `.env` file in the same folder:

    === "OS X &amp; Linux"
        ```shell
        touch multi_tool_agent/.env
        ```

    === "Windows"
        ```shell
        type nul > multi_tool_agent\.env
        ```

    More instructions about this file are described in the next section on [Set up the model](#set-up-the-model).

=== "Java"

    Java projects generally feature the following project structure:

    ```console
    project_folder/
    ├── pom.xml (or build.gradle)
    ├── src/
    ├── └── main/
    │       └── java/
    │           └── agents/
    │               └── multitool/
    └── test/
    ```

    ### Create `MultiToolAgent.java`

    Create a `MultiToolAgent.java` source file in the `agents.multitool` package
    in the `src/main/java/agents/multitool/` directory.

    Copy and paste the following code into `MultiToolAgent.java`:

    ```java title="agents/multitool/MultiToolAgent.java"
    --8<-- "examples/java/cloud-run/src/main/java/agents/multitool/MultiToolAgent.java:full_code"
    ```

![intro_components.png](../assets/quickstart-flow-tool.png)

## 3. 設定模型 { #set-up-the-model }

你的 agent 能夠理解使用者請求並產生回應，是由大型語言模型 (Large Language Model, LLM) 所驅動。你的 agent 需要安全地呼叫這個外部的 LLM 服務，而這**需要驗證憑證**。如果沒有有效的驗證，LLM 服務將會拒絕 agent 的請求，導致 agent 無法運作。

!!!tip "模型驗證指南"
    如需有關不同模型驗證的詳細說明，請參閱 [Authentication guide](../agents/models.md#google-ai-studio)。
    這是確保你的 agent 能夠呼叫 LLM 服務的關鍵步驟。

=== "Gemini - Google AI Studio"
    1. 從 [Google AI Studio](https://aistudio.google.com/apikey) 取得 API KEY。
    2. 使用 Python 時，請開啟位於 (`multi_tool_agent/`) 內的 **`.env`** 檔案，
       並將以下程式碼複製貼上。

        ```env title="multi_tool_agent/.env"
        GOOGLE_GENAI_USE_VERTEXAI=FALSE
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

請提供原文、初始譯文、品質分析與改進建議，我才能協助改進翻譯。
        When using Java, define environment variables:

        ```console title="terminal"
        export GOOGLE_GENAI_USE_VERTEXAI=FALSE
        export GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

    3. Replace `PASTE_YOUR_ACTUAL_API_KEY_HERE` with your actual `API KEY`.

=== "Gemini - Google Cloud Vertex AI"
    1. 建立一個 [Google Cloud 專案](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp)，並[啟用 Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)。
    2. 設定 [gcloud 命令列介面 (CLI)](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local)。
    3. 在終端機中執行 `gcloud auth application-default login`，以驗證 Google Cloud 身份。
    4. 若使用 Python，請開啟 (`multi_tool_agent/`) 目錄下的 **`.env`** 檔案。複製並貼上下列程式碼，並更新 Google Cloud 專案 ID 與位置 (Location)。

        ```env title="multi_tool_agent/.env"
        GOOGLE_GENAI_USE_VERTEXAI=TRUE
        GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
        GOOGLE_CLOUD_LOCATION=LOCATION
        ```

請提供原文、初始譯文、品質分析與改進建議內容，我才能協助改進翻譯。
        When using Java, define environment variables:

        ```console title="terminal"
        export GOOGLE_GENAI_USE_VERTEXAI=TRUE
        export GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
        export GOOGLE_CLOUD_LOCATION=LOCATION
        ```

=== "Gemini - Google Cloud Vertex AI with Express Mode"
    1. 你可以註冊一個免費的 Google Cloud 專案，並使用符合資格的帳戶免費體驗 Gemini！
        * 設定
          [Google Cloud 專案並啟用 Vertex AI Express Mode](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview)
        * 從你的 Express mode 專案取得 API 金鑰。這個金鑰可以搭配 Agent Development Kit (ADK) 使用，免費存取 Gemini 模型，以及 Agent Engine 服務。
    2. 使用 Python 時，請開啟 (`multi_tool_agent/`) 目錄下的 **`.env`** 檔案。複製並貼上下方程式碼，並更新你的專案 ID 與位置 (Location)。

        ```env title="multi_tool_agent/.env"
        GOOGLE_GENAI_USE_VERTEXAI=TRUE
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_EXPRESS_MODE_API_KEY_HERE
        ```

請提供原文、初始譯文、品質分析與改進建議，這樣我才能根據品質分析意見改進翻譯。
        When using Java, define environment variables:

        ```console title="terminal"
        export GOOGLE_GENAI_USE_VERTEXAI=TRUE
        export GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_EXPRESS_MODE_API_KEY_HERE
        ```

## 4. 執行你的 agent { #run-your-agent }

=== "Python"

    Using the terminal, navigate to the parent directory of your agent project
    (e.g. using `cd ..`):

    ```console
    parent_folder/      <-- navigate to this directory
        multi_tool_agent/
            __init__.py
            agent.py
            .env
    ```

    There are multiple ways to interact with your agent:

    === "Dev UI (adk web)"

        !!! success "Authentication Setup for Vertex AI Users"
            If you selected **"Gemini - Google Cloud Vertex AI"** in the previous step, you must authenticate with Google Cloud before launching the dev UI.
            
            Run this command and follow the prompts:
            ```bash
            gcloud auth application-default login
            ```
            
            **Note:** Skip this step if you're using "Gemini - Google AI Studio".

        Run the following command to launch the **dev UI**.

        ```shell
        adk web
        ```
        
        !!!info "Note for Windows users"

            When hitting the `_make_subprocess_transport NotImplementedError`, consider using `adk web --no-reload` instead.


        **Step 1:** Open the URL provided (usually `http://localhost:8000` or
        `http://127.0.0.1:8000`) directly in your browser.

        **Step 2.** In the top-left corner of the UI, you can select your agent in
        the dropdown. Select "multi_tool_agent".

        !!!note "Troubleshooting"

            If you do not see "multi_tool_agent" in the dropdown menu, make sure you
            are running `adk web` in the **parent folder** of your agent folder
            (i.e. the parent folder of multi_tool_agent).

        **Step 3.** Now you can chat with your agent using the textbox:

        ![adk-web-dev-ui-chat.png](../assets/adk-web-dev-ui-chat.png)


        **Step 4.**  By using the `Events` tab at the left, you can inspect
        individual function calls, responses and model responses by clicking on the
        actions:

        ![adk-web-dev-ui-function-call.png](../assets/adk-web-dev-ui-function-call.png)

        On the `Events` tab, you can also click the `Trace` button to see the trace logs for each event that shows the latency of each function calls:

        ![adk-web-dev-ui-trace.png](../assets/adk-web-dev-ui-trace.png)

        **Step 5.** You can also enable your microphone and talk to your agent:

        !!!note "Model support for voice/video streaming"

            In order to use voice/video streaming in ADK, you will need to use Gemini models that support the Live API. You can find the **model ID(s)** that supports the Gemini Live API in the documentation:

            - [Google AI Studio: Gemini Live API](https://ai.google.dev/gemini-api/docs/models#live-api)
            - [Vertex AI: Gemini Live API](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api)

            You can then replace the `model` string in `root_agent` in the `agent.py` file you created earlier ([jump to section](#agentpy)). Your code should look something like:

            ```py
            root_agent = Agent(
                name="weather_time_agent",
                model="replace-me-with-model-id", #e.g. gemini-2.0-flash-live-001
                ...
            ```

        ![adk-web-dev-ui-audio.png](../assets/adk-web-dev-ui-audio.png)

    === "Terminal (adk run)"

        !!! tip

            When using `adk run` you can inject prompts into the agent to start by
            piping text to the command like so:

            ```shell
            "Please start by listing files" | adk run file_listing_agent
            ```
            
        Run the following command, to chat with your Weather agent.

        ```
        adk run multi_tool_agent
        ```

        ![adk-run.png](../assets/adk-run.png)

        To exit, use Cmd/Ctrl+C.

    === "API Server (adk api_server)"

        `adk api_server` enables you to create a local FastAPI server in a single
        command, enabling you to test local cURL requests before you deploy your
        agent.

        ![adk-api-server.png](../assets/adk-api-server.png)

        To learn how to use `adk api_server` for testing, refer to the
        [documentation on testing](testing.md).

=== "Java"

    Using the terminal, navigate to the parent directory of your agent project
    (e.g. using `cd ..`):

    ```console
    project_folder/                <-- navigate to this directory
    ├── pom.xml (or build.gradle)
    ├── src/
    ├── └── main/
    │       └── java/
    │           └── agents/
    │               └── multitool/
    │                   └── MultiToolAgent.java
    └── test/
    ```

    === "Dev UI"

        Run the following command from the terminal to launch the Dev UI.

        **DO NOT change the main class name of the Dev UI server.**

        ```console title="terminal"
        mvn exec:java \
            -Dexec.mainClass="com.google.adk.web.AdkWebServer" \
            -Dexec.args="--adk.agents.source-dir=src/main/java" \
            -Dexec.classpathScope="compile"
        ```

        **Step 1:** Open the URL provided (usually `http://localhost:8080` or
        `http://127.0.0.1:8080`) directly in your browser.

        **Step 2.** In the top-left corner of the UI, you can select your agent in
        the dropdown. Select "multi_tool_agent".

        !!!note "Troubleshooting"

            If you do not see "multi_tool_agent" in the dropdown menu, make sure you
            are running the `mvn` command at the location where your Java source code
            is located (usually `src/main/java`).

        **Step 3.** Now you can chat with your agent using the textbox:

        ![adk-web-dev-ui-chat.png](../assets/adk-web-dev-ui-chat.png)

        **Step 4.** You can also inspect individual function calls, responses and
        model responses by clicking on the actions:

        ![adk-web-dev-ui-function-call.png](../assets/adk-web-dev-ui-function-call.png)

    === "Maven"

        With Maven, run the `main()` method of your Java class
        with the following command:

        ```console title="terminal"
        mvn compile exec:java -Dexec.mainClass="agents.multitool.MultiToolAgent"
        ```

    === "Gradle"

        With Gradle, the `build.gradle` or `build.gradle.kts` build file
        should have the following Java plugin in its `plugins` section:

        ```groovy
        plugins {
            id('java')
            // other plugins
        }
        ```

        Then, elsewhere in the build file, at the top-level,
        create a new task to run the `main()` method of your agent:

        ```groovy
        tasks.register('runAgent', JavaExec) {
            classpath = sourceSets.main.runtimeClasspath
            mainClass = 'agents.multitool.MultiToolAgent'
        }
        ```

        Finally, on the command-line, run the following command:

        ```console
        gradle runAgent
        ```



### 📝 範例提示語（prompts）嘗試

* 紐約的天氣如何？
* 紐約現在幾點？
* 巴黎的天氣如何？
* 巴黎現在幾點？

## 🎉 恭喜！

你已經成功使用 Agent Development Kit (ADK)（ADK）建立並互動你的第一個 agent！

---

## 🛣️ 下一步

* **前往教學課程**：學習如何為你的 agent 加入記憶體、工作階段（session）、狀態等功能：
  [tutorial](../tutorials/index.md)。
* **深入進階設定：** 探索 [setup](installation.md)
  章節，深入了解專案結構、設定方式及其他介面。
* **理解核心概念：** 進一步認識
  [agents concepts](../agents/index.md)。
