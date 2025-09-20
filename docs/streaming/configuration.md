# 設定串流行為

你可以為即時 agent（live agents）設定一些相關的組態。

這些設定是透過 [RunConfig](https://github.com/google/adk-python/blob/main/src/google/adk/agents/run_config.py) 來完成的。你應該在使用 [Runner.run_live(...)](https://github.com/google/adk-python/blob/main/src/google/adk/runners.py) 時搭配 RunConfig 一起使用。

例如，如果你想要設定語音相關的組態，可以利用 speech_config 來達成。 

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


