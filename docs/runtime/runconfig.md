# 執行階段組態

`RunConfig` 定義了 Agent Development Kit (ADK)（ADK）中 agent 的執行階段行為與選項。它控制語音與串流設定、函式呼叫、artifact 儲存，以及對大型語言模型 (LLM) 呼叫的限制。

在建立 agent 執行時，你可以傳入 `RunConfig`，以自訂 agent 與模型互動、處理音訊及串流回應的方式。預設情況下，並未啟用任何串流，且輸入內容不會被保留為 artifact。你可以使用 `RunConfig` 來覆寫這些預設值。

## 類別定義

`RunConfig` 類別用於儲存 agent 執行階段行為的組態參數。

- Python ADK 使用 Pydantic 進行此類驗證。

- Java ADK 通常使用不可變的資料類別。

=== "Python"

    ```python
    class RunConfig(BaseModel):
        """Configs for runtime behavior of agents."""
    
        model_config = ConfigDict(
            extra='forbid',
        )
    
        speech_config: Optional[types.SpeechConfig] = None
        response_modalities: Optional[list[str]] = None
        save_input_blobs_as_artifacts: bool = False
        support_cfc: bool = False
        streaming_mode: StreamingMode = StreamingMode.NONE
        output_audio_transcription: Optional[types.AudioTranscriptionConfig] = None
        max_llm_calls: int = 500
    ```

=== "Java"

    ```java
    public abstract class RunConfig {
      
      public enum StreamingMode {
        NONE,
        SSE,
        BIDI
      }
      
      public abstract @Nullable SpeechConfig speechConfig();
    
      public abstract ImmutableList<Modality> responseModalities();
    
      public abstract boolean saveInputBlobsAsArtifacts();
      
      public abstract @Nullable AudioTranscriptionConfig outputAudioTranscription();
    
      public abstract int maxLlmCalls();
      
      // ...
    }
    ```

## 執行時參數

| 參數                             | Python 類型                                  | Java 類型                                             | 預設值 (Py / Java)                | 說明                                                                                                                        |
| :------------------------------ | :------------------------------------------- |:------------------------------------------------------|:----------------------------------|:---------------------------------------------------------------------------------------------------------------------------|
| `speech_config`                 | `Optional[types.SpeechConfig]`               | `SpeechConfig` (nullable via `@Nullable`)             | `None` / `null`                   | 使用 `SpeechConfig` 類型設定語音合成（語音、語言）。                                                 |
| `response_modalities`           | `Optional[list[str]]`                        | `ImmutableList<Modality>`                             | `None` / Empty `ImmutableList`    | 指定所需的輸出模態清單（例如，Python: `["TEXT", "AUDIO"]`；Java: 使用結構化的 `Modality` 物件）。             |
| `save_input_blobs_as_artifacts` | `bool`                                       | `boolean`                                             | `False` / `false`                 | 若為 `true`，則將輸入 blob（例如上傳的檔案）儲存為執行產物，以便除錯或稽核。                                 |
| `streaming_mode`                | `StreamingMode`                              | *目前尚未支援*                             | `StreamingMode.NONE` / N/A        | 設定串流行為：`NONE`（預設）、`SSE`（server-sent events）、或 `BIDI`（雙向）。                        |
| `output_audio_transcription`    | `Optional[types.AudioTranscriptionConfig]`   | `AudioTranscriptionConfig` (nullable via `@Nullable`) | `None` / `null`                   | 使用 `AudioTranscriptionConfig` 類型設定產生音訊輸出的轉錄。                                |
| `max_llm_calls`                 | `int`                                        | `int`                                                 | `500` / `500`                     | 限制每次執行的大型語言模型 (LLM) 呼叫總數。`0` 或負數表示無限制（會有警告）；`sys.maxsize` 則會拋出 `ValueError`。                 |
| `support_cfc`                   | `bool`                                       | *目前尚未支援*                             | `False` / N/A                     | **Python：** 啟用組合式函式呼叫（Compositional Function Calling）。需搭配 `streaming_mode=SSE` 並使用 LIVE API。**實驗性功能。**   |

### `speech_config`

!!! Note
    `SpeechConfig` 的介面或定義在所有語言中皆相同。

針對具備音訊能力的即時 agent（live agent）之語音設定。  
`SpeechConfig` 類別的結構如下：

```python
class SpeechConfig(_common.BaseModel):
    """The speech generation configuration."""

    voice_config: Optional[VoiceConfig] = Field(
        default=None,
        description="""The configuration for the speaker to use.""",
    )
    language_code: Optional[str] = Field(
        default=None,
        description="""Language code (ISO 639. e.g. en-US) for the speech synthesization.
        Only available for Live API.""",
    )
```

`voice_config` 參數會使用 `VoiceConfig` 類別：

```python
class VoiceConfig(_common.BaseModel):
    """The configuration for the voice to use."""

    prebuilt_voice_config: Optional[PrebuiltVoiceConfig] = Field(
        default=None,
        description="""The configuration for the speaker to use.""",
    )
```

`PrebuiltVoiceConfig` 具有以下結構：

```python
class PrebuiltVoiceConfig(_common.BaseModel):
    """The configuration for the prebuilt speaker to use."""

    voice_name: Optional[str] = Field(
        default=None,
        description="""The name of the prebuilt voice to use.""",
    )
```

這些巢狀的組態類別允許你指定：

* `voice_config`：要使用的預建語音名稱（於 `PrebuiltVoiceConfig` 中）
* `language_code`：語音合成所用的 ISO 639 語言代碼（例如："en-US"）

在實作語音功能 agent 時，請設定這些參數，以控制 agent 說話時的語音表現。

### `response_modalities`

定義 agent 的輸出模態（output modalities）。若未設定，預設為 AUDIO。回應模態決定 agent 如何透過不同通道（例如文字、語音）與使用者溝通。

### `save_input_blobs_as_artifacts`

啟用後，輸入的 blob 會在 agent 執行期間以 artifact 形式儲存。這對於除錯與稽核很有幫助，讓開發者可以檢視 agent 實際收到的資料內容。

### `support_cfc`

啟用 Compositional Function Calling（CFC，組合式函式呼叫）支援。僅適用於使用 StreamingMode.SSE 時。啟用後，將會呼叫 LIVE API，因為目前僅有該 API 支援 CFC 功能。

!!! warning

    The `support_cfc` feature is experimental and its API or behavior might
    change in future releases.

### `streaming_mode`

設定 agent 的串流行為。可用值如下：

* `StreamingMode.NONE`：不進行串流；回應會以完整單元傳送
* `StreamingMode.SSE`：Server-Sent Events（SSE）串流；伺服器到用戶端的單向串流
* `StreamingMode.BIDI`：雙向串流（Bidirectional streaming）；支援雙向同時通訊

串流模式會影響效能與使用者體驗。SSE 串流可讓使用者即時看到產生中的部分回應，而雙向串流則可實現即時互動體驗。

### `output_audio_transcription`

針對具備語音回應能力的即時 agent，設定音訊輸出的轉錄（transcribing）功能。啟用後，系統會自動將語音回應轉錄為文字，提升無障礙使用性、便於紀錄保存，並支援多模態應用。

### `max_llm_calls`

設定單次 agent 執行時，大型語言模型 (LLM) 呼叫的總次數上限。

* 大於 0 且小於 `sys.maxsize` 的值：限制 LLM 呼叫次數
* 小於或等於 0 的值：允許無限制的 LLM 呼叫（*不建議於正式環境使用*）

此參數可防止過度 API 使用及潛在的失控程序。由於 LLM 呼叫通常會產生費用並消耗資源，適當設定限制非常重要。

## 驗證規則

`RunConfig` 類別會驗證其參數，以確保 agent 正常運作。Python Agent Development Kit (ADK) 採用 `Pydantic` 進行自動型別驗證，Java Agent Development Kit (ADK) 則仰賴靜態型別，並可能於 RunConfig 建構時進行明確檢查。
針對 `max_llm_calls` 參數，特別注意：

1. 極大的數值（如 Python 的 `sys.maxsize` 或 Java 的 `Integer.MAX_VALUE`）通常會被禁止，以避免問題發生。

2. 若值為 0 或更小，通常會觸發有關 LLM 互動無上限的警告。

## 範例

### 基本執行階段設定

=== "Python"

    ```python
    from google.genai.adk import RunConfig, StreamingMode
    
    config = RunConfig(
        streaming_mode=StreamingMode.NONE,
        max_llm_calls=100
    )
    ```

=== "Java"


=== "Java"
（Java）

    ```java
    import com.google.adk.agents.RunConfig;
    import com.google.adk.agents.RunConfig.StreamingMode;
    
    RunConfig config = RunConfig.builder()
            .setStreamingMode(StreamingMode.NONE)
            .setMaxLlmCalls(100)
            .build();
    ```

此組態會建立一個非串流（non-streaming）agent，並限制最多 100 次大型語言模型 (LLM) 呼叫，適合用於簡單的任務導向型 agent，其中完整回應較為理想。

### 啟用串流

=== "Python"

    ```python
    from google.genai.adk import RunConfig, StreamingMode
    
    config = RunConfig(
        streaming_mode=StreamingMode.SSE,
        max_llm_calls=200
    )
    ```

=== "Java"


=== "Java"

    ```java
    import com.google.adk.agents.RunConfig;
    import com.google.adk.agents.RunConfig.StreamingMode;
    
    RunConfig config = RunConfig.builder()
        .setStreamingMode(StreamingMode.SSE)
        .setMaxLlmCalls(200)
        .build();
    ```

使用 SSE 串流可以讓使用者即時看到回應的生成過程，為聊天機器人和助理帶來更即時的互動體驗。

### 啟用語音支援

=== "Python"

    ```python
    from google.genai.adk import RunConfig, StreamingMode
    from google.genai import types
    
    config = RunConfig(
        speech_config=types.SpeechConfig(
            language_code="en-US",
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Kore"
                )
            ),
        ),
        response_modalities=["AUDIO", "TEXT"],
        save_input_blobs_as_artifacts=True,
        support_cfc=True,
        streaming_mode=StreamingMode.SSE,
        max_llm_calls=1000,
    )
    ```

=== "Java"

    ```java
    import com.google.adk.agents.RunConfig;
    import com.google.adk.agents.RunConfig.StreamingMode;
    import com.google.common.collect.ImmutableList;
    import com.google.genai.types.Content;
    import com.google.genai.types.Modality;
    import com.google.genai.types.Part;
    import com.google.genai.types.PrebuiltVoiceConfig;
    import com.google.genai.types.SpeechConfig;
    import com.google.genai.types.VoiceConfig;
    
    RunConfig runConfig =
        RunConfig.builder()
            .setStreamingMode(StreamingMode.SSE)
            .setMaxLlmCalls(1000)
            .setSaveInputBlobsAsArtifacts(true)
            .setResponseModalities(ImmutableList.of(new Modality("AUDIO"), new Modality("TEXT")))
            .setSpeechConfig(
                SpeechConfig.builder()
                    .voiceConfig(
                        VoiceConfig.builder()
                            .prebuiltVoiceConfig(
                                PrebuiltVoiceConfig.builder().voiceName("Kore").build())
                            .build())
                    .languageCode("en-US")
                    .build())
            .build();
    ```

這個完整範例為 agent 配置了以下功能：

* 使用「Kore」語音（美式英語）的語音能力
* 同時支援音訊與文字輸出模式
* 輸入 blob 的 artifact 儲存（有助於除錯）
* 啟用實驗性 CFC 支援 **（僅限 Python）**
* 透過 SSE 串流實現即時互動
* 限制最多 1000 次大型語言模型 (LLM) 呼叫

### 啟用實驗性 CFC 支援

![python_only](https://img.shields.io/badge/Currently_supported_in-Python-blue){ title="此功能目前僅支援 Python。Java 支援預計推出/即將上線。" }

```python
from google.genai.adk import RunConfig, StreamingMode

config = RunConfig(
    streaming_mode=StreamingMode.SSE,
    support_cfc=True,
    max_llm_calls=150
)
```

啟用組合式函式呼叫（Compositional Function Calling）會建立一個能根據模型輸出動態執行函式的 agent，非常適合需要複雜工作流程的應用程式。
