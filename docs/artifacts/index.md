# Artifacts

在 Agent Development Kit (ADK)（ADK）中，**Artifacts**（產物）是一種關鍵機制，用於管理具名、具版本的二進位資料。這些資料可以與特定的使用者互動工作階段（session）相關聯，或是跨多個工作階段持久地與使用者綁定。Artifacts 讓你的代理（agent）與工具（tools）能處理超越純文字字串的資料，實現更豐富的互動，例如檔案、圖片、音訊及其他二進位格式。

!!! Note
    不同 SDK 語言的 primitive 參數或方法名稱可能略有不同（例如：Python 中為 `save_artifact`，Java 中為 `saveArtifact`）。詳細資訊請參閱各語言的 API 文件。

## 什麼是 Artifacts？

*   **定義：** Artifact 本質上是一段二進位資料（如檔案內容），在特定範圍（session 或 user）內由唯一的 `filename` 字串識別。每次以相同檔名儲存 artifact 時，會建立一個新版本。

*   **表示方式：** Artifacts 始終以標準的 `google.genai.types.Part` 物件表示。其核心資料通常儲存在 `Part` 的內嵌資料結構中（可透過 `inline_data` 存取），其內容包含：
    *   `data`：以 bytes 形式儲存的原始二進位內容。
    *   `mime_type`：表示資料型態的字串（例如 `"image/png"`、`"application/pdf"`）。這對於後續正確解析資料非常重要。


=== "Python"

    ```py
    # Example of how an artifact might be represented as a types.Part
    import google.genai.types as types

    # Assume 'image_bytes' contains the binary data of a PNG image
    image_bytes = b'\x89PNG\r\n\x1a\n...' # Placeholder for actual image bytes

    image_artifact = types.Part(
        inline_data=types.Blob(
            mime_type="image/png",
            data=image_bytes
        )
    )

    # You can also use the convenience constructor:
    # image_artifact_alt = types.Part.from_bytes(data=image_bytes, mime_type="image/png")

    print(f"Artifact MIME Type: {image_artifact.inline_data.mime_type}")
    print(f"Artifact Data (first 10 bytes): {image_artifact.inline_data.data[:10]}...")
    ```

=== "Java"

    ```java
    import com.google.genai.types.Part;
    import java.nio.charset.StandardCharsets;

    public class ArtifactExample {
        public static void main(String[] args) {
            // Assume 'imageBytes' contains the binary data of a PNG image
            byte[] imageBytes = {(byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47, (byte) 0x0D, (byte) 0x0A, (byte) 0x1A, (byte) 0x0A, (byte) 0x01, (byte) 0x02}; // Placeholder for actual image bytes

            // Create an image artifact using Part.fromBytes
            Part imageArtifact = Part.fromBytes(imageBytes, "image/png");

            System.out.println("Artifact MIME Type: " + imageArtifact.inlineData().get().mimeType().get());
            System.out.println(
                "Artifact Data (first 10 bytes): "
                    + new String(imageArtifact.inlineData().get().data().get(), 0, 10, StandardCharsets.UTF_8)
                    + "...");
        }
    }
    ```

*   **持久化與管理：** Artifact（人工產物）並不會直接儲存在 agent 或 session 狀態中。它們的儲存與讀取由專門的 **Artifact Service**（`BaseArtifactService` 的一種實作，定義於 `google.adk.artifacts`）負責管理。Agent Development Kit (ADK) 提供了多種實作方式，例如：
    *   用於測試或暫存的記憶體內服務（例如 Python 的 `InMemoryArtifactService`，定義於 `google.adk.artifacts.in_memory_artifact_service.py`）。
    *   使用 Google Cloud Storage (GCS) 進行持久化儲存的服務（例如 Python 的 `GcsArtifactService`，定義於 `google.adk.artifacts.gcs_artifact_service.py`）。
    所選擇的服務實作在你儲存資料時會自動處理版本控管。

## 為什麼要使用 Artifact？

雖然 session `state` 適合用來儲存小型的設定或對話上下文（如字串、數字、布林值，或小型字典/清單），但 Artifact 則設計用於處理二進位或大型資料的情境：

1. **處理非文字型資料：** 可輕鬆儲存與讀取圖片、音訊片段、影片片段、PDF、試算表，或其他與 agent 功能相關的任何檔案格式。  
2. **持久化大型資料：** session 狀態通常不適合儲存大量資料。Artifact 提供專屬機制來持久化較大的二進位資料（blob），避免 session 狀態雜亂。  
3. **使用者檔案管理：** 提供使用者上傳檔案（可儲存為 artifact）的能力，並可讓使用者取得或下載 agent 產生的檔案（從 artifact 載入）。  
4. **輸出分享：** 讓工具或 agent 產生二進位輸出（如 PDF 報告或生成圖片），可透過 `save_artifact` 儲存，並讓應用程式其他部分，甚至後續 session（若有使用使用者命名空間）存取。  
5. **二進位資料快取：** 將計算成本高、會產生二進位資料的運算結果（例如複雜圖表的圖片渲染）儲存為 artifact，以避免後續請求時重複產生。

簡而言之，當你的 agent 需要處理需被持久化、版本控管或分享的檔案型二進位資料時，由 `ArtifactService` 管理的 Artifact 是在 ADK 中最合適的機制。

## 常見使用情境

Artifact 提供了靈活的方式，讓你在 ADK 應用中處理二進位資料。

以下是一些典型且具價值的應用場景：

* **產生報告/檔案：**
    * 工具或 agent 產生報告（如 PDF 分析、CSV 資料匯出、圖表圖片）。

* **處理使用者上傳：**

    * 使用者透過前端介面上傳檔案（如分析用圖片、摘要用文件）。

* **儲存中間二進位結果：**

    * agent 執行複雜多步驟流程，其中某步產生中間二進位資料（如語音合成、模擬結果）。

* **持久化使用者資料：**

    * 儲存非單純鍵值狀態的使用者專屬設定或資料。

* **快取產生的二進位內容：**

    * agent 經常根據特定輸入產生相同的二進位輸出（如公司標誌圖片、標準語音問候）。

## 核心概念

理解 artifact 涉及幾個關鍵元件：管理 artifact 的服務、儲存 artifact 的資料結構，以及 artifact 的識別與版本控管方式。

### Artifact Service（`BaseArtifactService`）

* **角色：** 負責 artifact 實際儲存與讀取邏輯的核心元件。它定義 artifact *如何* 以及 *儲存於何處*。  

* **介面：** 由抽象基底類別 `BaseArtifactService` 定義。任何具體實作都必須提供以下方法：  

    * `Save Artifact`：儲存 artifact 資料並回傳分配的版本號。  
    * `Load Artifact`：讀取特定版本（或最新版本）的 artifact。  
    * `List Artifact keys`：列出指定範圍內 artifact 的唯一檔名。  
    * `Delete Artifact`：移除 artifact（以及依實作可能包含的所有版本）。  
    * `List versions`：列出特定 artifact 檔名下所有可用的版本號。

* **設定：** 在初始化 `Runner` 時，你需提供一個 artifact service 實例（如 `InMemoryArtifactService`、`GcsArtifactService`）。`Runner` 會透過 `InvocationContext` 將此服務提供給 agent 與工具使用。

=== "Python"

    ```py
    from google.adk.runners import Runner
    from google.adk.artifacts import InMemoryArtifactService # Or GcsArtifactService
    from google.adk.agents import LlmAgent # Any agent
    from google.adk.sessions import InMemorySessionService

    # Example: Configuring the Runner with an Artifact Service
    my_agent = LlmAgent(name="artifact_user_agent", model="gemini-2.0-flash")
    artifact_service = InMemoryArtifactService() # Choose an implementation
    session_service = InMemorySessionService()

    runner = Runner(
        agent=my_agent,
        app_name="my_artifact_app",
        session_service=session_service,
        artifact_service=artifact_service # Provide the service instance here
    )
    # Now, contexts within runs managed by this runner can use artifact methods
    ```

=== "Java"
    
    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.runner.Runner;
    import com.google.adk.sessions.InMemorySessionService;
    import com.google.adk.artifacts.InMemoryArtifactService;
    
    // Example: Configuring the Runner with an Artifact Service
    LlmAgent myAgent =  LlmAgent.builder()
      .name("artifact_user_agent")
      .model("gemini-2.0-flash")
      .build();
    InMemoryArtifactService artifactService = new InMemoryArtifactService(); // Choose an implementation
    InMemorySessionService sessionService = new InMemorySessionService();

    Runner runner = new Runner(myAgent, "my_artifact_app", artifactService, sessionService); // Provide the service instance here
    // Now, contexts within runs managed by this runner can use artifact methods
    ```

### Artifact 資料

* **標準表示法：** Artifact 內容皆以 `google.genai.types.Part` 物件來表示，這與大型語言模型 (LLM) 訊息的部分結構相同。

* **主要屬性（`inline_data`）：** 對於 artifact 而言，最重要的屬性是 `inline_data`，它是一個 `google.genai.types.Blob` 物件，包含以下內容：

    * `data`（`bytes`）：artifact 的原始二進位內容。
    * `mime_type`（`str`）：標準的 MIME type 字串（例如：`'application/pdf'`、`'image/png'`、`'audio/mpeg'`），用於描述二進位資料的類型。**這對於載入 artifact 時正確解讀內容至關重要。**

=== "Python"

    ```python
    import google.genai.types as types

    # Example: Creating an artifact Part from raw bytes
    pdf_bytes = b'%PDF-1.4...' # Your raw PDF data
    pdf_mime_type = "application/pdf"

    # Using the constructor
    pdf_artifact_py = types.Part(
        inline_data=types.Blob(data=pdf_bytes, mime_type=pdf_mime_type)
    )

    # Using the convenience class method (equivalent)
    pdf_artifact_alt_py = types.Part.from_bytes(data=pdf_bytes, mime_type=pdf_mime_type)

    print(f"Created Python artifact with MIME type: {pdf_artifact_py.inline_data.mime_type}")
    ```
    
=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/artifacts/ArtifactDataExample.java:full_code"
    ```

### 檔名（Filename）

* **識別子（Identifier）：** 一個簡單的字串，用於在特定命名空間內為 artifact 命名並進行檢索。  
* **唯一性（Uniqueness）：** 檔名在其作用範圍內（Session 或 User 命名空間）必須是唯一的。  
* **最佳實踐（Best Practice）：** 建議使用具描述性的名稱，並可包含副檔名（例如：`"monthly_report.pdf"`、`"user_avatar.jpg"`），但副檔名本身不會決定行為——實際行為由 `mime_type` 決定。

### 版本控制（Versioning）

* **自動版本控制（Automatic Versioning）：** artifact service 會自動處理版本控制。當你呼叫 `save_artifact` 時，服務會為該檔名及作用範圍決定下一個可用的版本號（通常從 0 開始遞增）。  
* **由 `save_artifact` 回傳：** `save_artifact` 方法會回傳分配給新儲存 artifact 的整數版本號。  
* **檢索（Retrieval）：**  
  * `load_artifact(..., version=None)`（預設）：取得該 artifact *最新* 可用的版本。  
  * `load_artifact(..., version=N)`：取得特定版本 `N`。  
* **列出所有版本（Listing Versions）：** 可使用 `list_versions` 方法（在 service 上，而非 context）來查詢某個 artifact 所有現有的版本號。

### 命名空間（Session vs. User）

* **概念（Concept）：** artifact 可以限定在特定 Session，或更廣泛地限定於使用者（User）在應用程式內的所有 Session。這個作用範圍由 `filename` 格式決定，並由 `ArtifactService` 於內部處理。  

* **預設（Session 範圍）：** 如果你使用像 `"report.pdf"` 這樣的純檔名，artifact 會與特定的 `app_name`、`user_id` *以及* `session_id` 關聯。它僅能在該特定 Session context 中存取。  


* **User 範圍（`"user:"` 前綴）：** 如果你在檔名前加上 `"user:"`，例如 `"user:profile.png"`，artifact 只會與 `app_name` 和 `user_id` 關聯。此時，該 artifact 可在該使用者於應用程式內的*任何* Session 中存取或更新。  


=== "Python"

    ```python
    # Example illustrating namespace difference (conceptual)

    # Session-specific artifact filename
    session_report_filename = "summary.txt"

    # User-specific artifact filename
    user_config_filename = "user:settings.json"

    # When saving 'summary.txt' via context.save_artifact,
    # it's tied to the current app_name, user_id, and session_id.

    # When saving 'user:settings.json' via context.save_artifact,
    # the ArtifactService implementation should recognize the "user:" prefix
    # and scope it to app_name and user_id, making it accessible across sessions for that user.
    ```

=== "Java"

    ```java
    // Example illustrating namespace difference (conceptual)
    
    // Session-specific artifact filename
    String sessionReportFilename = "summary.txt";
    
    // User-specific artifact filename
    String userConfigFilename = "user:settings.json"; // The "user:" prefix is key
    
    // When saving 'summary.txt' via context.save_artifact,
    // it's tied to the current app_name, user_id, and session_id.
    // artifactService.saveArtifact(appName, userId, sessionId1, sessionReportFilename, someData);
    
    // When saving 'user:settings.json' via context.save_artifact,
    // the ArtifactService implementation should recognize the "user:" prefix
    // and scope it to app_name and user_id, making it accessible across sessions for that user.
    // artifactService.saveArtifact(appName, userId, sessionId1, userConfigFilename, someData);
    ```

這些核心概念相互配合，為 Agent Development Kit (ADK)（ADK）框架內的二進位資料管理提供了一個靈活的系統。

## 與 Artifact 互動（透過 Context 物件）

在你的 agent 邏輯中（特別是在 callbacks 或 tools 內），你主要是透過 `CallbackContext` 和 `ToolContext` 物件所提供的方法來與 artifact 互動。這些方法將底層由 `ArtifactService` 管理的儲存細節進行了抽象化。

### 前置作業：設定 `ArtifactService`

在你能夠透過 context 物件使用任何 artifact 方法之前，初始化 `Runner` 時，你**必須**提供一個 [`BaseArtifactService` 實作](#available-implementations)（例如 [`InMemoryArtifactService`](#inmemoryartifactservice) 或 [`GcsArtifactService`](#gcsartifactservice)）的實例。

=== "Python"

    In Python, you provide this instance when initializing your `Runner`.

    ```python
    from google.adk.runners import Runner
    from google.adk.artifacts import InMemoryArtifactService # Or GcsArtifactService
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService

    # Your agent definition
    agent = LlmAgent(name="my_agent", model="gemini-2.0-flash")

    # Instantiate the desired artifact service
    artifact_service = InMemoryArtifactService()

    # Provide it to the Runner
    runner = Runner(
        agent=agent,
        app_name="artifact_app",
        session_service=InMemorySessionService(),
        artifact_service=artifact_service # Service must be provided here
    )
    ```
    If no `artifact_service` is configured in the `InvocationContext` (which happens if it's not passed to the `Runner`), calling `save_artifact`, `load_artifact`, or `list_artifacts` on the context objects will raise a `ValueError`.

=== "Java"

    In Java, you would instantiate a `BaseArtifactService` implementation and then ensure it's accessible to the parts of your application that manage artifacts. This is often done through dependency injection or by explicitly passing the service instance.

    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.artifacts.InMemoryArtifactService; // Or GcsArtifactService
    import com.google.adk.runner.Runner;
    import com.google.adk.sessions.InMemorySessionService;
    
    public class SampleArtifactAgent {
    
      public static void main(String[] args) {
    
        // Your agent definition
        LlmAgent agent = LlmAgent.builder()
            .name("my_agent")
            .model("gemini-2.0-flash")
            .build();
    
        // Instantiate the desired artifact service
        InMemoryArtifactService artifactService = new InMemoryArtifactService();
    
        // Provide it to the Runner
        Runner runner = new Runner(agent,
            "APP_NAME",
            artifactService, // Service must be provided here
            new InMemorySessionService());
    
      }
    }
    ```
    In Java, if an `ArtifactService` instance is not available (e.g., `null`) when artifact operations are attempted, it would typically result in a `NullPointerException` or a custom error, depending on how your application is structured. Robust applications often use dependency injection frameworks to manage service lifecycles and ensure availability.


### 存取方法

這些 artifact 互動方法可直接在 `CallbackContext`（傳遞給 agent 與 model 回呼函式）以及 `ToolContext`（傳遞給工具回呼函式）的實例上使用。請注意，`ToolContext` 是從 `CallbackContext` 繼承而來。

*   **程式碼範例：**

    === "Python"

        ```python
        import google.genai.types as types
        from google.adk.agents.callback_context import CallbackContext # Or ToolContext

        async def save_generated_report_py(context: CallbackContext, report_bytes: bytes):
            """Saves generated PDF report bytes as an artifact."""
            report_artifact = types.Part.from_data(
                data=report_bytes,
                mime_type="application/pdf"
            )
            filename = "generated_report.pdf"

            try:
                version = await context.save_artifact(filename=filename, artifact=report_artifact)
                print(f"Successfully saved Python artifact '{filename}' as version {version}.")
                # The event generated after this callback will contain:
                # event.actions.artifact_delta == {"generated_report.pdf": version}
            except ValueError as e:
                print(f"Error saving Python artifact: {e}. Is ArtifactService configured in Runner?")
            except Exception as e:
                # Handle potential storage errors (e.g., GCS permissions)
                print(f"An unexpected error occurred during Python artifact save: {e}")

        # --- Example Usage Concept (Python) ---
        # async def main_py():
        #   callback_context: CallbackContext = ... # obtain context
        #   report_data = b'...' # Assume this holds the PDF bytes
        #   await save_generated_report_py(callback_context, report_data)
        ```

    === "Java"
    
        ```java
        import com.google.adk.agents.CallbackContext;
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.InMemoryArtifactService;
        import com.google.genai.types.Part;
        import java.nio.charset.StandardCharsets;

        public class SaveArtifactExample {

        public void saveGeneratedReport(CallbackContext callbackContext, byte[] reportBytes) {
        // Saves generated PDF report bytes as an artifact.
        Part reportArtifact = Part.fromBytes(reportBytes, "application/pdf");
        String filename = "generatedReport.pdf";

            callbackContext.saveArtifact(filename, reportArtifact);
            System.out.println("Successfully saved Java artifact '" + filename);
            // The event generated after this callback will contain:
            // event().actions().artifactDelta == {"generated_report.pdf": version}
        }

        // --- Example Usage Concept (Java) ---
        public static void main(String[] args) {
            BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
            SaveArtifactExample myTool = new SaveArtifactExample();
            byte[] reportData = "...".getBytes(StandardCharsets.UTF_8); // PDF bytes
            CallbackContext callbackContext; // ... obtain callback context from your app
            myTool.saveGeneratedReport(callbackContext, reportData);
            // Due to async nature, in a real app, ensure program waits or handles completion.
          }
        }
        ```

#### 載入 Artifact

*   **程式碼範例：**

    === "Python"

        ```python
        import google.genai.types as types
        from google.adk.agents.callback_context import CallbackContext # Or ToolContext

        async def process_latest_report_py(context: CallbackContext):
            """Loads the latest report artifact and processes its data."""
            filename = "generated_report.pdf"
            try:
                # Load the latest version
                report_artifact = await context.load_artifact(filename=filename)

                if report_artifact and report_artifact.inline_data:
                    print(f"Successfully loaded latest Python artifact '{filename}'.")
                    print(f"MIME Type: {report_artifact.inline_data.mime_type}")
                    # Process the report_artifact.inline_data.data (bytes)
                    pdf_bytes = report_artifact.inline_data.data
                    print(f"Report size: {len(pdf_bytes)} bytes.")
                    # ... further processing ...
                else:
                    print(f"Python artifact '{filename}' not found.")

                # Example: Load a specific version (if version 0 exists)
                # specific_version_artifact = await context.load_artifact(filename=filename, version=0)
                # if specific_version_artifact:
                #     print(f"Loaded version 0 of '{filename}'.")

            except ValueError as e:
                print(f"Error loading Python artifact: {e}. Is ArtifactService configured?")
            except Exception as e:
                # Handle potential storage errors
                print(f"An unexpected error occurred during Python artifact load: {e}")

        # --- Example Usage Concept (Python) ---
        # async def main_py():
        #   callback_context: CallbackContext = ... # obtain context
        #   await process_latest_report_py(callback_context)
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.genai.types.Part;
        import io.reactivex.rxjava3.core.MaybeObserver;
        import io.reactivex.rxjava3.disposables.Disposable;
        import java.util.Optional;

        public class MyArtifactLoaderService {

            private final BaseArtifactService artifactService;
            private final String appName;

            public MyArtifactLoaderService(BaseArtifactService artifactService, String appName) {
                this.artifactService = artifactService;
                this.appName = appName;
            }

            public void processLatestReportJava(String userId, String sessionId, String filename) {
                // Load the latest version by passing Optional.empty() for the version
                artifactService
                        .loadArtifact(appName, userId, sessionId, filename, Optional.empty())
                        .subscribe(
                                new MaybeObserver<Part>() {
                                    @Override
                                    public void onSubscribe(Disposable d) {
                                        // Optional: handle subscription
                                    }

                                    @Override
                                    public void onSuccess(Part reportArtifact) {
                                        System.out.println(
                                                "Successfully loaded latest Java artifact '" + filename + "'.");
                                        reportArtifact
                                                .inlineData()
                                                .ifPresent(
                                                        blob -> {
                                                            System.out.println(
                                                                    "MIME Type: " + blob.mimeType().orElse("N/A"));
                                                            byte[] pdfBytes = blob.data().orElse(new byte[0]);
                                                            System.out.println("Report size: " + pdfBytes.length + " bytes.");
                                                            // ... further processing of pdfBytes ...
                                                        });
                                    }

                                    @Override
                                    public void onError(Throwable e) {
                                        // Handle potential storage errors or other exceptions
                                        System.err.println(
                                                "An error occurred during Java artifact load for '"
                                                        + filename
                                                        + "': "
                                                        + e.getMessage());
                                    }

                                    @Override
                                    public void onComplete() {
                                        // Called if the artifact (latest version) is not found
                                        System.out.println("Java artifact '" + filename + "' not found.");
                                    }
                                });

                // Example: Load a specific version (e.g., version 0)
                /*
                artifactService.loadArtifact(appName, userId, sessionId, filename, Optional.of(0))
                    .subscribe(part -> {
                        System.out.println("Loaded version 0 of Java artifact '" + filename + "'.");
                    }, throwable -> {
                        System.err.println("Error loading version 0 of '" + filename + "': " + throwable.getMessage());
                    }, () -> {
                        System.out.println("Version 0 of Java artifact '" + filename + "' not found.");
                    });
                */
            }

            // --- Example Usage Concept (Java) ---
            public static void main(String[] args) {
                // BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
                // MyArtifactLoaderService loader = new MyArtifactLoaderService(service, "myJavaApp");
                // loader.processLatestReportJava("user123", "sessionABC", "java_report.pdf");
                // Due to async nature, in a real app, ensure program waits or handles completion.
            }
        }
        ```

#### 列出 Artifact 檔案名稱

*   **程式碼範例：**

    === "Python"

        ```python
        from google.adk.tools.tool_context import ToolContext

        def list_user_files_py(tool_context: ToolContext) -> str:
            """Tool to list available artifacts for the user."""
            try:
                available_files = await tool_context.list_artifacts()
                if not available_files:
                    return "You have no saved artifacts."
                else:
                    # Format the list for the user/LLM
                    file_list_str = "\n".join([f"- {fname}" for fname in available_files])
                    return f"Here are your available Python artifacts:\n{file_list_str}"
            except ValueError as e:
                print(f"Error listing Python artifacts: {e}. Is ArtifactService configured?")
                return "Error: Could not list Python artifacts."
            except Exception as e:
                print(f"An unexpected error occurred during Python artifact list: {e}")
                return "Error: An unexpected error occurred while listing Python artifacts."

        # This function would typically be wrapped in a FunctionTool
        # from google.adk.tools import FunctionTool
        # list_files_tool = FunctionTool(func=list_user_files_py)
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.ListArtifactsResponse;
        import com.google.common.collect.ImmutableList;
        import io.reactivex.rxjava3.core.SingleObserver;
        import io.reactivex.rxjava3.disposables.Disposable;

        public class MyArtifactListerService {

            private final BaseArtifactService artifactService;
            private final String appName;

            public MyArtifactListerService(BaseArtifactService artifactService, String appName) {
                this.artifactService = artifactService;
                this.appName = appName;
            }

            // Example method that might be called by a tool or agent logic
            public void listUserFilesJava(String userId, String sessionId) {
                artifactService
                        .listArtifactKeys(appName, userId, sessionId)
                        .subscribe(
                                new SingleObserver<ListArtifactsResponse>() {
                                    @Override
                                    public void onSubscribe(Disposable d) {
                                        // Optional: handle subscription
                                    }

                                    @Override
                                    public void onSuccess(ListArtifactsResponse response) {
                                        ImmutableList<String> availableFiles = response.filenames();
                                        if (availableFiles.isEmpty()) {
                                            System.out.println(
                                                    "User "
                                                            + userId
                                                            + " in session "
                                                            + sessionId
                                                            + " has no saved Java artifacts.");
                                        } else {
                                            StringBuilder fileListStr =
                                                    new StringBuilder(
                                                            "Here are the available Java artifacts for user "
                                                                    + userId
                                                                    + " in session "
                                                                    + sessionId
                                                                    + ":\n");
                                            for (String fname : availableFiles) {
                                                fileListStr.append("- ").append(fname).append("\n");
                                            }
                                            System.out.println(fileListStr.toString());
                                        }
                                    }

                                    @Override
                                    public void onError(Throwable e) {
                                        System.err.println(
                                                "Error listing Java artifacts for user "
                                                        + userId
                                                        + " in session "
                                                        + sessionId
                                                        + ": "
                                                        + e.getMessage());
                                        // In a real application, you might return an error message to the user/LLM
                                    }
                                });
            }

            // --- Example Usage Concept (Java) ---
            public static void main(String[] args) {
                // BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
                // MyArtifactListerService lister = new MyArtifactListerService(service, "myJavaApp");
                // lister.listUserFilesJava("user123", "sessionABC");
                // Due to async nature, in a real app, ensure program waits or handles completion.
            }
        }
        ```

這些儲存、載入與列舉的方法，無論是在 Python 的 context 物件中使用，還是直接於 Java 操作 `BaseArtifactService`，都為在 Agent Development Kit (ADK)（ADK）中管理二進位資料持久化提供了方便且一致的方式，並且不受所選後端儲存實作的影響。

## 可用實作

Agent Development Kit (ADK) 提供了 `BaseArtifactService` 介面的具體實作，支援多種儲存後端，適用於不同的開發階段與部署需求。這些實作會根據 `app_name`、`user_id`、`session_id` 和 `filename`（包含 `user:` 命名空間前綴）來處理 artifact 資料的儲存、版本管理與擷取細節。

### InMemoryArtifactService

*   **儲存機制：**
    *   Python：使用應用程式記憶體中的 Python 字典（`self.artifacts`）。字典的鍵代表 artifact 路徑，值為 `types.Part` 的清單，每個清單元素對應一個版本。
    *   Java：使用記憶體中的巢狀 `HashMap` 實例（`private final Map<String, Map<String, Map<String, Map<String, List<Part>>>>> artifacts;`）。每一層的鍵分別為 `appName`、`userId`、`sessionId` 和 `filename`。最內層的 `List<Part>` 用來儲存 artifact 的各個版本，清單索引即為版本號。
*   **主要特點：**
    *   **簡單易用：** 除了核心 ADK 函式庫外，無需額外設定或相依套件。
    *   **速度快：** 操作通常極為迅速，僅涉及記憶體中的 map/字典查找與清單操作。
    *   **暫態性：** 所有儲存的 artifact 會在應用程式程序結束時**遺失**。資料不會在應用程式重啟後保留。
*   **適用情境：**
    *   非常適合本機開發與測試，不需要資料持久化的場合。
    *   適用於短暫展示或 artifact 資料僅需於單次應用程式執行期間暫存的情境。
*   **實例化方式：**

    === "Python"

        ```python
        from google.adk.artifacts import InMemoryArtifactService

        # Simply instantiate the class
        in_memory_service_py = InMemoryArtifactService()

        # Then pass it to the Runner
        # runner = Runner(..., artifact_service=in_memory_service_py)
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.InMemoryArtifactService;

        public class InMemoryServiceSetup {
            public static void main(String[] args) {
                // Simply instantiate the class
                BaseArtifactService inMemoryServiceJava = new InMemoryArtifactService();

                System.out.println("InMemoryArtifactService (Java) instantiated: " + inMemoryServiceJava.getClass().getName());

                // This instance would then be provided to your Runner.
                // Runner runner = new Runner(
                //     /* other services */,
                //     inMemoryServiceJava
                // );
            }
        }
        ```

### GcsArtifactService

*   **儲存機制：** 採用 Google Cloud Storage（GCS）作為持久性 artifact 儲存。每個 artifact 的版本都會以獨立的物件（blob）儲存在指定的 GCS bucket 中。
*   **物件命名規則：** 使用階層式路徑結構來組成 GCS 物件名稱（blob 名稱）。
*   **主要特點：**
    *   **持久性：** 儲存在 GCS 的 artifact 會在應用程式重啟與部署後持續保留。
    *   **可擴展性：** 利用 Google Cloud Storage 的可擴展性與高耐久性。
    *   **版本管理：** 明確地將每個版本作為獨立的 GCS 物件儲存。`saveArtifact` 方法在 `GcsArtifactService` 中。
    *   **所需權限：** 應用程式執行環境需具備適當的認證（如 Application Default Credentials）及 IAM 權限，以讀取與寫入指定的 GCS bucket。
*   **適用情境：**
    *   需要持久性 artifact 儲存的正式環境。
    *   需要在不同應用程式實例或服務間共用 artifact 的情境（透過存取同一個 GCS bucket）。
    *   需要長期儲存與擷取使用者或 session 資料的應用程式。
*   **實例化方式：**

    === "Python"

        ```python
        from google.adk.artifacts import GcsArtifactService

        # Specify the GCS bucket name
        gcs_bucket_name_py = "your-gcs-bucket-for-adk-artifacts" # Replace with your bucket name

        try:
            gcs_service_py = GcsArtifactService(bucket_name=gcs_bucket_name_py)
            print(f"Python GcsArtifactService initialized for bucket: {gcs_bucket_name_py}")
            # Ensure your environment has credentials to access this bucket.
            # e.g., via Application Default Credentials (ADC)

            # Then pass it to the Runner
            # runner = Runner(..., artifact_service=gcs_service_py)

        except Exception as e:
            # Catch potential errors during GCS client initialization (e.g., auth issues)
            print(f"Error initializing Python GcsArtifactService: {e}")
            # Handle the error appropriately - maybe fall back to InMemory or raise
        ```

    === "Java"

        ```java
        --8<-- "examples/java/snippets/src/main/java/artifacts/GcsServiceSetup.java:full_code"
        ```

選擇合適的 `ArtifactService` 實作，取決於您的應用程式對於資料持久性、可擴展性，以及運行環境的需求。

## 最佳實踐

為了有效且可維護地使用 artifact，建議遵循以下做法：

* **選擇合適的服務：** 若需快速原型開發、測試，或不需要資料持久性的情境，請使用 `InMemoryArtifactService`。若在需要資料持久性與可擴展性的生產環境中，請使用 `GcsArtifactService`（或針對其他後端自行實作 `BaseArtifactService`）。  
* **有意義的檔名：** 請使用清楚且具描述性的檔案名稱。即使 `mime_type` 會決定程式上的處理方式，加入相關副檔名（如 `.pdf`、`.png`、`.wav`）有助於人類理解內容。請建立暫存 artifact 與持久 artifact 檔名的命名慣例。  
* **指定正確的 MIME 類型：** 建立 `types.Part` 給 `save_artifact` 時，務必提供正確的 `mime_type`。這對於後續需要正確解析 `bytes` 資料的應用程式或工具來說至關重要。請盡量使用標準 IANA MIME 類型。  
* **理解版本管理：** 請注意，`load_artifact()` 若未指定 `version` 參數，將會取得*最新*版本。如果您的邏輯依賴於 artifact 的特定歷史版本，請在載入時務必提供整數型的版本號。  
* **謹慎使用命名空間（`user:`）：** 僅當資料確實屬於使用者，且應跨所有 session 可存取時，才在檔名中使用 `"user:"` 前綴。若資料僅屬於單一對話或 session，則請使用一般檔名，不加前綴。  
* **錯誤處理：**  
    * 在呼叫 context 方法（如 `save_artifact`、`load_artifact`、`list_artifacts`）前，務必先檢查 `artifact_service` 是否已正確設定——否則會拋出 `ValueError`，若服務為 `None`。 
    * 請檢查 `load_artifact` 的回傳值，若 artifact 或版本不存在，將會是 `None`。不要假設它一定會回傳 `Part`。  
    * 應準備好處理底層儲存服務的例外狀況，特別是在使用 `GcsArtifactService` 時（例如：`google.api_core.exceptions.Forbidden` 代表權限問題，`NotFound` 表示 bucket 不存在，或網路錯誤）。  
* **檔案大小考量：** artifact 適用於一般檔案大小，但若處理極大檔案，尤其是雲端儲存時，請留意潛在成本與效能影響。`InMemoryArtifactService` 若儲存大量大型 artifact，可能會消耗大量記憶體。若需處理非常大的資料，建議考慮直接使用 GCS 連結或其他專門的儲存解決方案，而非將整個位元組陣列存於記憶體中傳遞。  
* **清理策略：** 對於如 `GcsArtifactService` 這類持久性儲存，artifact 會一直保留，直到明確刪除。如果 artifact 代表暫時性資料或有存續期限，請實作清理策略。這可能包括：  
    * 在 bucket 上使用 GCS 生命週期政策。  
    * 建立專用工具或管理功能，利用 `artifact_service.delete_artifact` 方法（注意：為安全起見，delete 並未透過 context 物件公開）。  
    * 謹慎管理檔名，以便日後可依模式進行批次刪除。
