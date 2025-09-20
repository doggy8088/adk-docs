# 串流工具

!!! info

    This is only supported in streaming(live) agents/api.

串流工具（Streaming tools）允許工具（函式）將中間結果即時串流回 Agent，並且 Agent 可以對這些中間結果做出回應。
例如，我們可以使用串流工具來監控股票價格的變化，並讓 Agent 根據變化做出反應。另一個例子是，讓 Agent 監控視訊串流，當視訊串流發生變化時，Agent 可以回報這些變化。

要定義一個串流工具，必須遵循以下規範：

1.  **非同步函式（Asynchronous Function）：** 工具必須是一個 `async` Python 函式。
2.  **AsyncGenerator 回傳型別：** 此函式必須標註為回傳 `AsyncGenerator`。`AsyncGenerator` 的第一個型別參數是你要`yield`的資料型別（例如：`str` 代表文字訊息，或自訂物件代表結構化資料）。第二個型別參數通常是 `None`，如果該 generator 沒有透過 `send()` 接收值。

我們支援兩種類型的串流工具：
- 簡單型（Simple type）：這種類型的串流工具僅接受非視訊/音訊串流（即你傳遞給 ADK Web 或 ADK Runner 的串流）作為輸入。
- 視訊串流工具（Video streaming tools）：這僅適用於視訊串流，並且會將視訊串流（即你傳遞給 ADK Web 或 ADK Runner 的串流）傳入此函式。

現在，讓我們定義一個可以同時監控股票價格變化與視訊串流變化的 Agent。 

```python
import asyncio
from typing import AsyncGenerator

from google.adk.agents import LiveRequestQueue
from google.adk.agents.llm_agent import Agent
from google.adk.tools.function_tool import FunctionTool
from google.genai import Client
from google.genai import types as genai_types


async def monitor_stock_price(stock_symbol: str) -> AsyncGenerator[str, None]:
  """This function will monitor the price for the given stock_symbol in a continuous, streaming and asynchronously way."""
  print(f"Start monitor stock price for {stock_symbol}!")

  # Let's mock stock price change.
  await asyncio.sleep(4)
  price_alert1 = f"the price for {stock_symbol} is 300"
  yield price_alert1
  print(price_alert1)

  await asyncio.sleep(4)
  price_alert1 = f"the price for {stock_symbol} is 400"
  yield price_alert1
  print(price_alert1)

  await asyncio.sleep(20)
  price_alert1 = f"the price for {stock_symbol} is 900"
  yield price_alert1
  print(price_alert1)

  await asyncio.sleep(20)
  price_alert1 = f"the price for {stock_symbol} is 500"
  yield price_alert1
  print(price_alert1)


# for video streaming, `input_stream: LiveRequestQueue` is required and reserved key parameter for ADK to pass the video streams in.
async def monitor_video_stream(
    input_stream: LiveRequestQueue,
) -> AsyncGenerator[str, None]:
  """Monitor how many people are in the video streams."""
  print("start monitor_video_stream!")
  client = Client(vertexai=False)
  prompt_text = (
      "Count the number of people in this image. Just respond with a numeric"
      " number."
  )
  last_count = None
  while True:
    last_valid_req = None
    print("Start monitoring loop")

    # use this loop to pull the latest images and discard the old ones
    while input_stream._queue.qsize() != 0:
      live_req = await input_stream.get()

      if live_req.blob is not None and live_req.blob.mime_type == "image/jpeg":
        last_valid_req = live_req

    # If we found a valid image, process it
    if last_valid_req is not None:
      print("Processing the most recent frame from the queue")

      # Create an image part using the blob's data and mime type
      image_part = genai_types.Part.from_bytes(
          data=last_valid_req.blob.data, mime_type=last_valid_req.blob.mime_type
      )

      contents = genai_types.Content(
          role="user",
          parts=[image_part, genai_types.Part.from_text(prompt_text)],
      )

      # Call the model to generate content based on the provided image and prompt
      response = client.models.generate_content(
          model="gemini-2.0-flash-exp",
          contents=contents,
          config=genai_types.GenerateContentConfig(
              system_instruction=(
                  "You are a helpful video analysis assistant. You can count"
                  " the number of people in this image or video. Just respond"
                  " with a numeric number."
              )
          ),
      )
      if not last_count:
        last_count = response.candidates[0].content.parts[0].text
      elif last_count != response.candidates[0].content.parts[0].text:
        last_count = response.candidates[0].content.parts[0].text
        yield response
        print("response:", response)

    # Wait before checking for new images
    await asyncio.sleep(0.5)


# Use this exact function to help ADK stop your streaming tools when requested.
# for example, if we want to stop `monitor_stock_price`, then the agent will
# invoke this function with stop_streaming(function_name=monitor_stock_price).
def stop_streaming(function_name: str):
  """Stop the streaming

  Args:
    function_name: The name of the streaming function to stop.
  """
  pass


root_agent = Agent(
    model="gemini-2.0-flash-exp",
    name="video_streaming_agent",
    instruction="""
      You are a monitoring agent. You can do video monitoring and stock price monitoring
      using the provided tools/functions.
      When users want to monitor a video stream,
      You can use monitor_video_stream function to do that. When monitor_video_stream
      returns the alert, you should tell the users.
      When users want to monitor a stock price, you can use monitor_stock_price.
      Don't ask too many questions. Don't be too talkative.
    """,
    tools=[
        monitor_video_stream,
        monitor_stock_price,
        FunctionTool(stop_streaming),
    ]
)
```

以下是一些可用來測試的範例查詢：
- 幫我監控 $XYZ 股票的股價。
- 幫我監控影片串流中有多少人。
