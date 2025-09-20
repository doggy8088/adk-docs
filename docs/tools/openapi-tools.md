# OpenAPI 整合

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援計畫中／即將推出。"}

## 使用 OpenAPI 整合 REST API

Agent Development Kit (ADK) 透過自動從 [OpenAPI Specification (v3.x)](https://swagger.io/specification/) 產生可呼叫的工具，大幅簡化與外部 REST API 的互動流程。這讓你無需為每個 API 端點手動定義個別的函式工具。

!!! tip "核心優勢"
    使用 `OpenAPIToolset` 可根據現有的 API 文件（OpenAPI 規格）即時建立代理工具（`RestApiTool`），讓代理能無縫呼叫你的網路服務。

## 主要元件

* **`OpenAPIToolset`**：這是你主要會使用的類別。你需以 OpenAPI 規格初始化它，並由它負責解析與產生工具。
* **`RestApiTool`**：此類別代表單一可呼叫的 API 操作（如 `GET /pets/{petId}` 或 `POST /pets`）。`OpenAPIToolset` 會為規格中定義的每個操作建立一個 `RestApiTool` 實例。

## 運作方式

當你使用 `OpenAPIToolset` 時，主要流程包含以下步驟：

1. **初始化與解析**：
    * 你可以將 OpenAPI 規格以 Python 字典、JSON 字串或 YAML 字串的形式提供給 `OpenAPIToolset`。
    * 工具組會在內部解析規格，解析所有內部參照（`$ref`），以完整理解 API 結構。

2. **操作發現**：
    * 它會識別規格中 `paths` 物件內定義的所有有效 API 操作（例如 `GET`、`POST`、`PUT`、`DELETE`）。

3. **工具產生**：
    * 對於每個發現的操作，`OpenAPIToolset` 會自動建立對應的 `RestApiTool` 實例。
    * **工具名稱**：取自規格中的 `operationId`（轉為 `snake_case`，最長 60 字元）。若缺少 `operationId`，則會根據方法與路徑自動產生名稱。
    * **工具描述**：使用操作中的 `summary` 或 `description` 作為大型語言模型 (LLM) 的描述。
    * **API 詳細資訊**：內部儲存所需的 HTTP 方法、路徑、伺服器基礎 URL、參數（路徑、查詢、標頭、Cookie）及請求主體結構。

4. **`RestApiTool` 功能**：每個產生的 `RestApiTool`：
    * **結構產生**：會根據操作的參數與請求主體動態建立 `FunctionDeclaration`。此結構告訴大型語言模型 (LLM) 如何呼叫該工具（預期哪些參數）。
    * **執行**：當被 LLM 呼叫時，會根據 LLM 提供的參數與 OpenAPI 規格細節組合正確的 HTTP 請求（URL、標頭、查詢參數、主體）。若有設定驗證，會自動處理，並透過 `requests` 函式庫執行 API 呼叫。
    * **回應處理**：將 API 回應（通常為 JSON）回傳至代理流程。

5. **驗證機制**：你可以在初始化 `OpenAPIToolset` 時設定全域驗證（如 API 金鑰或 OAuth－詳見 [Authentication](../tools/authentication.md)）。此驗證設定會自動套用至所有產生的 `RestApiTool` 實例。

## 使用流程

請依照以下步驟，將 OpenAPI 規格整合進你的代理：

1. **取得規格**：取得你的 OpenAPI 規格文件（例如從 `.json` 或 `.yaml` 檔案載入，或從 URL 取得）。
2. **建立工具組實例**：建立 `OpenAPIToolset` 實例，傳入規格內容與類型（`spec_str`/`spec_dict`、`spec_str_type`）。若 API 需要，請一併提供驗證資訊（`auth_scheme`、`auth_credential`）。

    ```python
    from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset

    # Example with a JSON string
    openapi_spec_json = '...' # Your OpenAPI JSON string
    toolset = OpenAPIToolset(spec_str=openapi_spec_json, spec_str_type="json")

    # Example with a dictionary
    # openapi_spec_dict = {...} # Your OpenAPI spec as a dict
    # toolset = OpenAPIToolset(spec_dict=openapi_spec_dict)
    ```

3. **加入至 Agent**：將取得的工具加入`LlmAgent`的`tools`清單中。

    ```python
    from google.adk.agents import LlmAgent

    my_agent = LlmAgent(
        name="api_interacting_agent",
        model="gemini-2.0-flash", # Or your preferred model
        tools=[toolset], # Pass the toolset
        # ... other agent config ...
    )
    ```

4. **指示 Agent**：更新你的 agent 指令，讓其瞭解新的 API 功能，以及它可以使用的工具名稱（例如：`list_pets`、`create_pet`）。由規格產生的工具描述也會協助大型語言模型 (LLM) 理解。
5. **執行 Agent**：使用 `Runner` 執行你的 agent。當大型語言模型 (LLM) 判斷需要呼叫某個 API 時，會產生一個針對適當 `RestApiTool` 的函式呼叫，該函式會自動處理 HTTP 請求。

## 範例

本範例展示如何從一個簡單的 Pet Store OpenAPI 規格產生工具（使用 `httpbin.org` 來產生模擬回應），並透過 agent 與這些工具互動。

???+ "程式碼：Pet Store API"

    ```python title="openapi_example.py"
    --8<-- "examples/python/snippets/tools/openapi_tool.py"
    ```
