# 工具的驗證機制

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python，Java 支援預計推出/即將推出。"}

## 核心概念

許多工具需要存取受保護的資源（例如 Google Calendar 的使用者資料、Salesforce 紀錄等），因此必須進行驗證。Agent Development Kit (ADK) 提供了一套系統，能夠安全地處理多種驗證方式。

主要涉及的元件如下：

1. **`AuthScheme`**：定義 API 期望如何提供驗證憑證（例如：在標頭中傳遞 API Key，或是 OAuth 2.0 Bearer token）。Agent Development Kit (ADK) 支援與 OpenAPI 3.0 相同類型的驗證機制。若想了解各種憑證類型的詳細資訊，請參考 [OpenAPI doc: Authentication](https://swagger.io/docs/specification/v3_0/authentication/)。ADK 使用特定類別如 `APIKey`、`HTTPBearer`、`OAuth2`、`OpenIdConnectWithConfig`。
2. **`AuthCredential`**：保存*啟動*驗證流程所需的*初始*資訊（例如：應用程式的 OAuth Client ID/Secret、API key 值）。其中包含一個 `auth_type`（如 `API_KEY`、`OAUTH2`、`SERVICE_ACCOUNT`），用來指定憑證類型。

一般流程是在設定工具時提供這些資訊。Agent Development Kit (ADK) 會嘗試自動將初始憑證交換為可用的憑證（例如 access token），再讓工具進行 API 呼叫。若流程需要使用者互動（如 OAuth 同意授權），則會觸發一個與 Agent Client 應用程式互動的專屬流程。

## 支援的初始憑證類型

* **API\_KEY：** 用於簡單的 key/value 驗證。通常不需要交換。
* **HTTP：** 可用於 Basic Auth（不建議/不支援交換）或已取得的 Bearer token。若為 Bearer token，則不需交換。
* **OAUTH2：** 用於標準 OAuth 2.0 流程。需要設定（client ID、secret、scopes），且通常會觸發使用者同意的互動流程。
* **OPEN\_ID\_CONNECT：** 基於 OpenID Connect 的驗證。與 OAuth2 類似，通常需要設定與使用者互動。
* **SERVICE\_ACCOUNT：** 用於 Google Cloud 服務帳戶憑證（JSON 金鑰或 Application Default Credentials）。通常會交換為 Bearer token。

## 工具驗證設定方式

你可以在定義工具時設定驗證資訊：

* **RestApiTool / OpenAPIToolset**：初始化時傳入 `auth_scheme` 與 `auth_credential`

* **GoogleApiToolSet 工具**：Agent Development Kit (ADK) 內建 Google Calendar、BigQuery 等第一方工具。請使用該工具組的專屬方法。

* **APIHubToolset / ApplicationIntegrationToolset**：若 API Hub 管理的 API 或 Application Integration 提供的 API 需要驗證，初始化時傳入 `auth_scheme` 與 `auth_credential`。

!!! tip "WARNING" 
    將敏感憑證（如 access token，特別是 refresh token）直接儲存在 session state 中，可能會根據你的 session 儲存後端（`SessionService`）以及整體應用程式的安全狀態帶來安全風險。

    *   **`InMemorySessionService`：** 適用於測試與開發，當程序結束時資料會遺失。由於其為暫時性，風險較低。
    *   **資料庫／持久性儲存：** **強烈建議在將 token 資料儲存到資料庫前進行加密**，請使用強健的加密函式庫（如 `cryptography`），並安全管理加密金鑰（例如使用金鑰管理服務）。
    *   **安全憑證儲存服務：** 在正式環境中，將敏感憑證儲存在專用的 Secret Manager（如 Google Cloud Secret Manager 或 HashiCorp Vault）是**最推薦的做法**。你的工具可以僅在 session state 中儲存短效的 access token 或安全參照（而非 refresh token 本身），並在需要時從安全儲存服務擷取必要的憑證。

---

## 旅程 1：使用已驗證工具打造 Agentic 應用程式

本節重點說明如何在你的 agentic 應用程式中，使用需要驗證的現有工具（如來自 `RestApiTool/ OpenAPIToolset`、`APIHubToolset`、`GoogleApiToolSet` 的工具）。你的主要責任是設定這些工具，並處理互動式驗證流程的用戶端部分（如果工具需要）。

### 1. 設定具驗證功能的工具

當你將已驗證的工具加入 agent 時，需要提供其所需的 `AuthScheme` 以及你的應用程式初始的 `AuthCredential`。

**A. 使用 OpenAPI 為基礎的工具組（`OpenAPIToolset`、`APIHubToolset` 等）**

在初始化工具組時傳入驗證方案與憑證。工具組會將這些資訊套用到所有產生的工具上。以下是在 Agent Development Kit (ADK) 中建立具驗證功能工具的幾種方式。

=== "API Key"

      Create a tool requiring an API Key.

      ```py
      from google.adk.tools.openapi_tool.auth.auth_helpers import token_to_scheme_credential
      from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset

      auth_scheme, auth_credential = token_to_scheme_credential(
          "apikey", "query", "apikey", "YOUR_API_KEY_STRING"
      )
      sample_api_toolset = OpenAPIToolset(
          spec_str="...",  # Fill this with an OpenAPI spec string
          spec_str_type="yaml",
          auth_scheme=auth_scheme,
          auth_credential=auth_credential,
      )
      ```

=== "OAuth2"

      Create a tool requiring OAuth2.

      ```py
      from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset
      from fastapi.openapi.models import OAuth2
      from fastapi.openapi.models import OAuthFlowAuthorizationCode
      from fastapi.openapi.models import OAuthFlows
      from google.adk.auth import AuthCredential
      from google.adk.auth import AuthCredentialTypes
      from google.adk.auth import OAuth2Auth

      auth_scheme = OAuth2(
          flows=OAuthFlows(
              authorizationCode=OAuthFlowAuthorizationCode(
                  authorizationUrl="https://accounts.google.com/o/oauth2/auth",
                  tokenUrl="https://oauth2.googleapis.com/token",
                  scopes={
                      "https://www.googleapis.com/auth/calendar": "calendar scope"
                  },
              )
          )
      )
      auth_credential = AuthCredential(
          auth_type=AuthCredentialTypes.OAUTH2,
          oauth2=OAuth2Auth(
              client_id=YOUR_OAUTH_CLIENT_ID, 
              client_secret=YOUR_OAUTH_CLIENT_SECRET
          ),
      )

      calendar_api_toolset = OpenAPIToolset(
          spec_str=google_calendar_openapi_spec_str, # Fill this with an openapi spec
          spec_str_type='yaml',
          auth_scheme=auth_scheme,
          auth_credential=auth_credential,
      )
      ```

=== "服務帳戶"

      Create a tool requiring Service Account.

      ```py
      from google.adk.tools.openapi_tool.auth.auth_helpers import service_account_dict_to_scheme_credential
      from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset

      service_account_cred = json.loads(service_account_json_str)
      auth_scheme, auth_credential = service_account_dict_to_scheme_credential(
          config=service_account_cred,
          scopes=["https://www.googleapis.com/auth/cloud-platform"],
      )
      sample_toolset = OpenAPIToolset(
          spec_str=sa_openapi_spec_str, # Fill this with an openapi spec
          spec_str_type='json',
          auth_scheme=auth_scheme,
          auth_credential=auth_credential,
      )
      ```

=== "OpenID connect"

OpenID Connect 是一種基於 OAuth 2.0 協議的身份驗證層，允許用戶安全地使用單一帳號登入多個應用程式。它常用於現代 Web 應用程式和 API 的身份驗證流程。透過 OpenID Connect，應用程式可以取得用戶的基本個人資訊（如名稱、電子郵件），並驗證用戶的身份，同時避免直接處理密碼。

**主要特點：**

- 基於 OAuth 2.0 標準，廣泛支援多種平台與語言。
- 支援單一登入（Single Sign-On, SSO）體驗。
- 提供標準化的用戶資訊（ID Token）格式，方便整合。
- 支援多種身份提供者（如 Google、GitHub 等）。

**常見應用場景：**

- 企業內部系統的統一登入
- 第三方應用程式的快速註冊與登入
- API 的安全授權與身份驗證

如需進一步瞭解 OpenID Connect，請參閱 [官方文件](https://openid.net/connect/)。

      Create a tool requiring OpenID connect.

      ```py
      from google.adk.auth.auth_schemes import OpenIdConnectWithConfig
      from google.adk.auth.auth_credential import AuthCredential, AuthCredentialTypes, OAuth2Auth
      from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset

      auth_scheme = OpenIdConnectWithConfig(
          authorization_endpoint=OAUTH2_AUTH_ENDPOINT_URL,
          token_endpoint=OAUTH2_TOKEN_ENDPOINT_URL,
          scopes=['openid', 'YOUR_OAUTH_SCOPES"]
      )
      auth_credential = AuthCredential(
          auth_type=AuthCredentialTypes.OPEN_ID_CONNECT,
          oauth2=OAuth2Auth(
              client_id="...",
              client_secret="...",
          )
      )

      userinfo_toolset = OpenAPIToolset(
          spec_str=content, # Fill in an actual spec
          spec_str_type='yaml',
          auth_scheme=auth_scheme,
          auth_credential=auth_credential,
      )
      ```

**B. 使用 Google API 工具集（例如：`calendar_tool_set`）**

這些工具集通常有專屬的設定方法。

提示：如何建立 Google OAuth Client ID 與 Secret，請參考此指南：[Get your Google API Client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#get_your_google_api_client_id)

```py
# Example: Configuring Google Calendar Tools
from google.adk.tools.google_api_tool import calendar_tool_set

client_id = "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com"
client_secret = "YOUR_GOOGLE_OAUTH_CLIENT_SECRET"

# Use the specific configure method for this toolset type
calendar_tool_set.configure_auth(
    client_id=oauth_client_id, client_secret=oauth_client_secret
)

# agent = LlmAgent(..., tools=calendar_tool_set.get_tool('calendar_tool_set'))
```

auth 請求流程的時序圖（當 tools 請求驗證憑證時）如下所示：

![Authentication](../assets/auth_part1.svg) 


### 2. 處理互動式 OAuth/OIDC 流程（用戶端）

如果某個 tool 需要使用者登入／同意（通常是 OAuth 2.0 或 OIDC），Agent Development Kit (ADK) 框架會暫停執行，並通知你的 **Agent Client** 應用程式。這裡有兩種情境：

* **Agent Client** 應用程式直接在同一個行程中執行 agent（透過 `runner.run_async`），例如 UI 後端、命令列介面 (Command Line Interface) 應用程式，或 Spark 作業等。
* **Agent Client** 應用程式透過 `/run` 或 `/run_sse` endpoint 與 ADK 的 fastapi server 互動。ADK 的 fastapi server 可以部署在與 **Agent Client** 應用程式相同或不同的伺服器上。

第二種情境其實是第一種情境的特殊情況，因為 `/run` 或 `/run_sse` endpoint 也會呼叫 `runner.run_async`。兩者的差異僅在於：

* 是呼叫 Python 函式來執行 agent（第一種情境），還是呼叫服務的 endpoint 來執行 agent（第二種情境）。
* 結果事件是記憶體內的物件（第一種情境），還是 HTTP 回應中的序列化 JSON 字串（第二種情境）。

以下章節將著重於第一種情境，你也可以很容易地將其對應到第二種情境。如有必要，我們也會說明處理第二種情境時的差異。

以下是你的 client 應用程式的逐步流程：

**步驟 1：執行 agent 並偵測 auth 請求**

* 使用 `runner.run_async` 啟動 agent 互動。  
* 逐一處理產生的事件。  
* 尋找具有特殊名稱的 function call 事件：`adk_request_credential`。此事件表示需要使用者互動。你可以使用輔助函式來辨識此事件並擷取所需資訊。（對於第二種情境，邏輯類似，只是你需要從 HTTP 回應中反序列化事件）。

```py

# runner = Runner(...)
# session = await session_service.create_session(...)
# content = types.Content(...) # User's initial query

print("\nRunning agent...")
events_async = runner.run_async(
    session_id=session.id, user_id='user', new_message=content
)

auth_request_function_call_id, auth_config = None, None

async for event in events_async:
    # Use helper to check for the specific auth request event
    if (auth_request_function_call := get_auth_request_function_call(event)):
        print("--> Authentication required by agent.")
        # Store the ID needed to respond later
        if not (auth_request_function_call_id := auth_request_function_call.id):
            raise ValueError(f'Cannot get function call id from function call: {auth_request_function_call}')
        # Get the AuthConfig containing the auth_uri etc.
        auth_config = get_auth_config(auth_request_function_call)
        break # Stop processing events for now, need user interaction

if not auth_request_function_call_id:
    print("\nAuth not required or agent finished.")
    # return # Or handle final response if received

```

*輔助函式 `helpers.py`：*

```py
from google.adk.events import Event
from google.adk.auth import AuthConfig # Import necessary type
from google.genai import types

def get_auth_request_function_call(event: Event) -> types.FunctionCall:
    # Get the special auth request function call from the event
    if not event.content or not event.content.parts:
        return
    for part in event.content.parts:
        if (
            part 
            and part.function_call 
            and part.function_call.name == 'adk_request_credential'
            and event.long_running_tool_ids 
            and part.function_call.id in event.long_running_tool_ids
        ):

            return part.function_call

def get_auth_config(auth_request_function_call: types.FunctionCall) -> AuthConfig:
    # Extracts the AuthConfig object from the arguments of the auth request function call
    if not auth_request_function_call.args or not (auth_config := auth_request_function_call.args.get('authConfig')):
        raise ValueError(f'Cannot get auth config from function call: {auth_request_function_call}')
    if isinstance(auth_config, dict):
        auth_config = AuthConfig.model_validate(auth_config)
    elif not isinstance(auth_config, AuthConfig):
        raise ValueError(f'Cannot get auth config {auth_config} is not an instance of AuthConfig.')
    return auth_config
```

**步驟 2：導引用戶進行授權**

* 從前一步提取的 `auth_config` 中取得授權 URL（`auth_uri`）。
* **重點是，請將您的應用程式** 的 `redirect_uri` 以查詢參數的方式附加到此 `auth_uri`。此 `redirect_uri` 必須事先在您的 OAuth 提供者（例如 [Google Cloud Console](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)、[Okta admin panel](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/spring-boot/main/#create-an-app-integration-in-the-admin-console)）中註冊。
* 將使用者導向這個完整的 URL（例如在瀏覽器中開啟）。

```py
# (Continuing after detecting auth needed)

if auth_request_function_call_id and auth_config:
    # Get the base authorization URL from the AuthConfig
    base_auth_uri = auth_config.exchanged_auth_credential.oauth2.auth_uri

    if base_auth_uri:
        redirect_uri = 'http://localhost:8000/callback' # MUST match your OAuth client app config
        # Append redirect_uri (use urlencode in production)
        auth_request_uri = base_auth_uri + f'&redirect_uri={redirect_uri}'
        # Now you need to redirect your end user to this auth_request_uri or ask them to open this auth_request_uri in their browser
        # This auth_request_uri should be served by the corresponding auth provider and the end user should login and authorize your applicaiton to access their data
        # And then the auth provider will redirect the end user to the redirect_uri you provided
        # Next step: Get this callback URL from the user (or your web server handler)
    else:
         print("ERROR: Auth URI not found in auth_config.")
         # Handle error

```

**步驟 3. 處理重導回呼（Client 端）：**

* 您的應用程式必須具備一個機制（例如，在 `redirect_uri` 設置一個 Web 伺服器路由），以便在使用者授權應用程式存取第三方服務後，能夠接收該使用者的回傳。  
* 第三方服務提供者會將使用者重導至您的 `redirect_uri`，並在 URL 上以查詢參數的方式附加 `authorization_code`（以及可能的 `state`、`scope`）。  
* 從這個進來的請求中擷取**完整的回呼 URL**。  
* （這個步驟發生在主要 agent 執行迴圈之外，於您的 Web 伺服器或等效的回呼處理器中。）

**步驟 4. 將驗證結果回傳給 Agent Development Kit (ADK)（Client 端）：**

* 當您取得包含授權碼的完整回呼 URL 後，請取出在 Client 步驟 1 儲存的 `auth_request_function_call_id` 與 `auth_config` 物件。  
* 將擷取到的回呼 URL 設定到 `exchanged_auth_credential.oauth2.auth_response_uri` 欄位，同時確認 `exchanged_auth_credential.oauth2.redirect_uri` 包含您所使用的 redirect URI。  
* 建立一個 `types.Content` 物件，內容包含一個帶有 `types.FunctionResponse` 的 `types.Part`。  
      * 將 `name` 設為 `"adk_request_credential"`。（注意：這是 Agent Development Kit (ADK) 進行驗證時的特殊名稱，請勿使用其他名稱。）  
      * 將 `id` 設為您所儲存的 `auth_request_function_call_id`。  
      * 將 `response` 設為*序列化*（例如 `.model_dump()`）後的更新 `AuthConfig` 物件。  
* 針對同一個 session，再次呼叫 `runner.run_async`，並將此 `FunctionResponse` 內容作為 `new_message` 傳入。

```py
# (Continuing after user interaction)

    # Simulate getting the callback URL (e.g., from user paste or web handler)
    auth_response_uri = await get_user_input(
        f'Paste the full callback URL here:\n> '
    )
    auth_response_uri = auth_response_uri.strip() # Clean input

    if not auth_response_uri:
        print("Callback URL not provided. Aborting.")
        return

    # Update the received AuthConfig with the callback details
    auth_config.exchanged_auth_credential.oauth2.auth_response_uri = auth_response_uri
    # Also include the redirect_uri used, as the token exchange might need it
    auth_config.exchanged_auth_credential.oauth2.redirect_uri = redirect_uri

    # Construct the FunctionResponse Content object
    auth_content = types.Content(
        role='user', # Role can be 'user' when sending a FunctionResponse
        parts=[
            types.Part(
                function_response=types.FunctionResponse(
                    id=auth_request_function_call_id,       # Link to the original request
                    name='adk_request_credential', # Special framework function name
                    response=auth_config.model_dump() # Send back the *updated* AuthConfig
                )
            )
        ],
    )

    # --- Resume Execution ---
    print("\nSubmitting authentication details back to the agent...")
    events_async_after_auth = runner.run_async(
        session_id=session.id,
        user_id='user',
        new_message=auth_content, # Send the FunctionResponse back
    )

    # --- Process Final Agent Output ---
    print("\n--- Agent Response after Authentication ---")
    async for event in events_async_after_auth:
        # Process events normally, expecting the tool call to succeed now
        print(event) # Print the full event for inspection

```

**步驟 5：Agent Development Kit (ADK) 處理 Token 交換與工具重試，並取得工具結果**

* ADK 收到 `FunctionResponse` 給 `adk_request_credential`。
* 它會利用更新後的 `AuthConfig`（包含帶有 code 的 callback URL）中的資訊，與提供者的 token endpoint 進行 OAuth **token 交換**，取得 access token（以及可能的 refresh token）。
* ADK 會在內部將這些 token 設定到 session state 中，讓其可供後續使用。
* ADK 會**自動重試**原本因缺少驗證而失敗的工具呼叫 (tool call)。
* 這次，工具會透過 `tool_context.get_auth_response()` 找到有效的 token，並成功執行已驗證的 API 呼叫。
* agent 會從工具取得實際的結果，並產生最終回應給使用者。

---

驗證回應流程的時序圖（Agent Client 回傳驗證回應，ADK 重新嘗試工具呼叫）如下所示：

![Authentication](../assets/auth_part2.svg)

## 旅程 2：建構需要驗證的自訂工具（`FunctionTool`）

本節重點說明在建立新的 ADK 工具時，如何在自訂 Python 函式*內部*實作驗證邏輯。我們將以 `FunctionTool` 作為範例進行說明。

### 先決條件

你的函式簽章*必須*包含 [`tool_context: ToolContext`](../tools/index.md#tool-context)。ADK 會自動注入這個物件，讓你可以存取 state 及驗證機制。

```py
from google.adk.tools import FunctionTool, ToolContext
from typing import Dict

def my_authenticated_tool_function(param1: str, ..., tool_context: ToolContext) -> dict:
    # ... your logic ...
    pass

my_tool = FunctionTool(func=my_authenticated_tool_function)

```

### 工具函式中的驗證（Authentication）邏輯

請在你的工具函式內實作以下步驟：

**步驟 1：檢查快取且有效的認證資訊：**

在你的工具函式中，首先檢查是否已經有有效的認證資訊（例如 access token／refresh token）從本次 session 先前的執行中儲存下來。當前 session 的認證資訊應儲存在 `tool_context.invocation_context.session.state`（一個 state 字典）中。你可以透過檢查 `tool_context.invocation_context.session.state.get(credential_name, None)` 來確認現有認證資訊是否存在。

```py
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# Inside your tool function
TOKEN_CACHE_KEY = "my_tool_tokens" # Choose a unique key
SCOPES = ["scope1", "scope2"] # Define required scopes

creds = None
cached_token_info = tool_context.state.get(TOKEN_CACHE_KEY)
if cached_token_info:
    try:
        creds = Credentials.from_authorized_user_info(cached_token_info, SCOPES)
        if not creds.valid and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            tool_context.state[TOKEN_CACHE_KEY] = json.loads(creds.to_json()) # Update cache
        elif not creds.valid:
            creds = None # Invalid, needs re-auth
            tool_context.state[TOKEN_CACHE_KEY] = None
    except Exception as e:
        print(f"Error loading/refreshing cached creds: {e}")
        creds = None
        tool_context.state[TOKEN_CACHE_KEY] = None

if creds and creds.valid:
    # Skip to Step 5: Make Authenticated API Call
    pass
else:
    # Proceed to Step 2...
    pass

```

**步驟 2：檢查來自用戶端的驗證回應**

* 如果步驟 1 沒有取得有效的認證資訊，請透過呼叫 `exchanged_credential = tool_context.get_auth_response()` 檢查用戶端是否剛完成互動式流程。  
* 這將回傳由用戶端送回的更新後 `exchanged_credential` 物件（其中包含 `auth_response_uri` 的 callback URL）。

```py
# Use auth_scheme and auth_credential configured in the tool.
# exchanged_credential: AuthCredential | None

exchanged_credential = tool_context.get_auth_response(AuthConfig(
  auth_scheme=auth_scheme,
  raw_auth_credential=auth_credential,
))
# If exchanged_credential is not None, then there is already an exchanged credetial from the auth response. 
if exchanged_credential:
   # ADK exchanged the access token already for us
        access_token = exchanged_credential.oauth2.access_token
        refresh_token = exchanged_credential.oauth2.refresh_token
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=auth_scheme.flows.authorizationCode.tokenUrl,
            client_id=auth_credential.oauth2.client_id,
            client_secret=auth_credential.oauth2.client_secret,
            scopes=list(auth_scheme.flows.authorizationCode.scopes.keys()),
        )
    # Cache the token in session state and call the API, skip to step 5
```

**步驟 3：啟動驗證請求**

如果未找到有效的認證資訊（步驟 1.）且未找到驗證回應（步驟 2.），則工具需要啟動 OAuth 流程。請定義 AuthScheme 和初始 AuthCredential，並呼叫 `tool_context.request_credential()`。回傳一個回應，表示需要授權。

```py
# Use auth_scheme and auth_credential configured in the tool.

  tool_context.request_credential(AuthConfig(
    auth_scheme=auth_scheme,
    raw_auth_credential=auth_credential,
  ))
  return {'pending': true, 'message': 'Awaiting user authentication.'}

# By setting request_credential, ADK detects a pending authentication event. It pauses execution and ask end user to login.
```

**步驟 4：以授權碼交換 Token**

Agent Development Kit (ADK) 會自動產生 OAuth 授權 URL，並將其提供給你的 Agent Client 應用程式。你的 Agent Client 應用程式應依照 Journey 1 所述的方式，將使用者重新導向至該授權 URL（並附加 `redirect_uri`）。當使用者依照授權 URL 完成登入流程後，ADK 會從 Agent Client 應用程式中擷取驗證回呼 URL，並自動解析授權碼，進而產生驗證 token。在下一次工具呼叫 (tool call) 時，步驟 2 的 `tool_context.get_auth_response` 會包含可用於後續 API 呼叫的有效憑證。

**步驟 5：快取取得的憑證**

成功從 ADK 取得 token（步驟 2），或 token 仍然有效（步驟 1）後，請**立即將**新的 `Credentials` 物件以你的快取金鑰，序列化（例如轉為 JSON）後存入 `tool_context.state`。

```py
# Inside your tool function, after obtaining 'creds' (either refreshed or newly exchanged)
# Cache the new/refreshed tokens
tool_context.state[TOKEN_CACHE_KEY] = json.loads(creds.to_json())
print(f"DEBUG: Cached/updated tokens under key: {TOKEN_CACHE_KEY}")
# Proceed to Step 6 (Make API Call)

```

**步驟 6：進行已驗證的 API 呼叫**

* 當你擁有有效的 `Credentials` 物件（來自步驟 1 或步驟 4 的 `creds`）時，請使用適當的用戶端程式庫（例如 `googleapiclient`、`requests`）來呼叫受保護的 API，並傳遞 `credentials=creds` 參數。  
* 請務必加入錯誤處理，特別是針對 `HttpError` 401/403 錯誤，這可能表示 access token 已過期或在呼叫之間被撤銷。若遇到此類錯誤，建議清除快取的 token（`tool_context.state.pop(...)`），並視情況再次回傳 `auth_required` 狀態，以強制重新驗證。

```py
# Inside your tool function, using the valid 'creds' object
# Ensure creds is valid before proceeding
if not creds or not creds.valid:
   return {"status": "error", "error_message": "Cannot proceed without valid credentials."}

try:
   service = build("calendar", "v3", credentials=creds) # Example
   api_result = service.events().list(...).execute()
   # Proceed to Step 7
except Exception as e:
   # Handle API errors (e.g., check for 401/403, maybe clear cache and re-request auth)
   print(f"ERROR: API call failed: {e}")
   return {"status": "error", "error_message": f"API call failed: {e}"}
```

**步驟 7：回傳工具結果**

* 在成功的 API 呼叫後，將結果處理為適合大型語言模型 (LLM) 使用的 dictionary 格式。  
* **特別重要的是，請務必隨資料一同包含** ⟦C1⟧。

```py
# Inside your tool function, after successful API call
    processed_result = [...] # Process api_result for the LLM
    return {"status": "success", "data": processed_result}

```

??? "完整代碼"

    === "Tools and Agent"

         ```py title="tools_and_agent.py"
         --8<-- "examples/python/snippets/tools/auth/tools_and_agent.py"
         ```
    === "Agent CLI"

         ```py title="agent_cli.py"
         --8<-- "examples/python/snippets/tools/auth/agent_cli.py"
         ```
    === "Helper"

         ```py title="helpers.py"
         --8<-- "examples/python/snippets/tools/auth/helpers.py"
         ```
    === "Spec"

         ```yaml
         openapi: 3.0.1
         info:
         title: Okta User Info API
         version: 1.0.0
         description: |-
            API to retrieve user profile information based on a valid Okta OIDC Access Token.
            Authentication is handled via OpenID Connect with Okta.
         contact:
            name: API Support
            email: support@example.com # Replace with actual contact if available
         servers:
         - url: <substitute with your server name>
            description: Production Environment
         paths:
         /okta-jwt-user-api:
            get:
               summary: Get Authenticated User Info
               description: |-
               Fetches profile details for the user
               operationId: getUserInfo
               tags:
               - User Profile
               security:
               - okta_oidc:
                     - openid
                     - email
                     - profile
               responses:
               '200':
                  description: Successfully retrieved user information.
                  content:
                     application/json:
                     schema:
                        type: object
                        properties:
                           sub:
                           type: string
                           description: Subject identifier for the user.
                           example: "abcdefg"
                           name:
                           type: string
                           description: Full name of the user.
                           example: "Example LastName"
                           locale:
                           type: string
                           description: User's locale, e.g., en-US or en_US.
                           example: "en_US"
                           email:
                           type: string
                           format: email
                           description: User's primary email address.
                           example: "username@example.com"
                           preferred_username:
                           type: string
                           description: Preferred username of the user (often the email).
                           example: "username@example.com"
                           given_name:
                           type: string
                           description: Given name (first name) of the user.
                           example: "Example"
                           family_name:
                           type: string
                           description: Family name (last name) of the user.
                           example: "LastName"
                           zoneinfo:
                           type: string
                           description: User's timezone, e.g., America/Los_Angeles.
                           example: "America/Los_Angeles"
                           updated_at:
                           type: integer
                           format: int64 # Using int64 for Unix timestamp
                           description: Timestamp when the user's profile was last updated (Unix epoch time).
                           example: 1743617719
                           email_verified:
                           type: boolean
                           description: Indicates if the user's email address has been verified.
                           example: true
                        required:
                           - sub
                           - name
                           - locale
                           - email
                           - preferred_username
                           - given_name
                           - family_name
                           - zoneinfo
                           - updated_at
                           - email_verified
               '401':
                  description: Unauthorized. The provided Bearer token is missing, invalid, or expired.
                  content:
                     application/json:
                     schema:
                        $ref: '#/components/schemas/Error'
               '403':
                  description: Forbidden. The provided token does not have the required scopes or permissions to access this resource.
                  content:
                     application/json:
                     schema:
                        $ref: '#/components/schemas/Error'
         components:
         securitySchemes:
            okta_oidc:
               type: openIdConnect
               description: Authentication via Okta using OpenID Connect. Requires a Bearer Access Token.
               openIdConnectUrl: https://your-endpoint.okta.com/.well-known/openid-configuration
         schemas:
            Error:
               type: object
               properties:
               code:
                  type: string
                  description: An error code.
               message:
                  type: string
                  description: A human-readable error message.
               required:
                  - code
                  - message
         ```

