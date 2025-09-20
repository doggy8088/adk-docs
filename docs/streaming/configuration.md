# 設定串流行為

你可以為即時（串流）代理設定一些組態參數。

這些設定是透過 [RunConfig](https://github.com/google/adk-python/blob/main/src/google/adk/agents/run_config.py) 來完成的。你應該在使用 [Runner.run_live(...)](https://github.com/google/adk-python/blob/main/src/google/adk/runners.py) 時搭配 RunConfig。

例如，如果你想設定語音相關的組態，可以利用 speech_config。 

```python
voice_config = genai_types.VoiceConfig(
    prebuilt_voice_config=genai_types.PrebuiltVoiceConfigDict(
        voice_name='Aoede'
    )
)
speech_config = genai_types.SpeechConfig(voice_config=voice_config)
run_config = RunConfig(speech_config=speech_config)

runner.run_live(
    ...,
    run_config=run_config,
)
```


請提供原文、初始譯文、品質分析與改進建議內容，這樣我才能根據品質分析意見改進翻譯。

