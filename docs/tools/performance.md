# 透過平行執行提升工具效能

自 Agent Development Kit (ADK) 1.10.0 版本起，框架會嘗試將所有由 agent 請求的
[function tools](/adk-docs/tools/function-tools/)
以平行方式執行。這項行為能顯著提升 agent 的效能與回應速度，特別是對於依賴多個外部 API 或長時間執行任務的 agent。例如，若你有 3 個各需耗時 2 秒的工具，透過平行執行，總執行時間將接近 2 秒，而非 6 秒。能夠平行執行工具函式，能在以下情境下大幅提升 agent 的效能：

-   **研究任務：** 當 agent 需要從多個來源收集資訊，才能進行下一階段的工作流程。
-   **API 呼叫：** 當 agent 需要獨立存取多個 API，例如透過多家航空公司的 API 搜尋可用航班。
-   **發布與通訊任務：** 當 agent 需要透過多個獨立的管道或多個收件人進行發布或通訊時。

然而，你自訂的工具必須具備非同步執行的支援，才能啟用這項效能提升。本指南將說明 ADK 中平行工具執行的運作方式，以及如何建構你的工具以充分利用這項處理功能。

!!! warning
    任何在一組工具函式呼叫中使用同步處理的 ADK 工具，都會阻塞其他工具的平行執行，即使其他工具本身支援平行執行也一樣。

## 建立支援平行的工具

你可以將工具函式定義為非同步函式，以啟用平行執行。在 Python 程式碼中，這表示要使用 `async def` 與 `await`
語法，讓 ADK 能在 `asyncio` 事件迴圈中同時執行它們。以下章節將展示為平行處理與非同步操作設計的 agent 工具範例。

### HTTP 網路呼叫範例

以下程式碼範例說明如何修改 `get_weather()` 函式，使其能以非同步方式運作並支援平行執行：

```python
 async def get_weather(city: str) -> dict:
      async with aiohttp.ClientSession() as session:
          async with session.get(f"http://api.weather.com/{city}") as response:
              return await response.json()
```

### 資料庫呼叫範例

以下程式碼範例說明如何撰寫一個資料庫呼叫函式，以非同步方式運作：

```python
async def query_database(query: str) -> list:
      async with asyncpg.connect("postgresql://...") as conn:
          return await conn.fetch(query)
```

### 長迴圈讓渡（yielding）行為的範例

當工具正在處理多個請求或大量長時間執行的請求時，建議加入讓渡（yielding）程式碼，以允許其他工具執行，如下方程式碼範例所示：

```python
async def process_data(data: list) -> dict:
      results = []
      for i, item in enumerate(data):
          processed = await process_item(item)  # Yield point
          results.append(processed)

          # Add periodic yield points for long loops
          if i % 100 == 0:
              await asyncio.sleep(0)  # Yield control
      return {"results": results}
```

!!! tip "重要"
    使用 `asyncio.sleep()` 函式來進行暫停，以避免阻塞其他函式的執行。

### 處理密集運算時的執行緒池範例

當執行需要大量運算資源的函式時，建議建立執行緒池（thread pool），以更有效地管理可用的運算資源，如下例所示：

```python
async def cpu_intensive_tool(data: list) -> dict:
      loop = asyncio.get_event_loop()

      # Use thread pool for CPU-bound work
      with ThreadPoolExecutor() as executor:
          result = await loop.run_in_executor(
              executor,
              expensive_computation,
              data
          )
      return {"result": result}
```

### 處理分塊（process chunking）範例

當需要對長串清單或大量資料進行處理時，建議結合執行緒池（thread pool）技術，並將處理工作分割為多個資料區塊（chunks），同時在各區塊之間釋放處理時間，如下例所示：

```python
 async def process_large_dataset(dataset: list) -> dict:
      results = []
      chunk_size = 1000

      for i in range(0, len(dataset), chunk_size):
          chunk = dataset[i:i + chunk_size]

          # Process chunk in thread pool
          loop = asyncio.get_event_loop()
          with ThreadPoolExecutor() as executor:
              chunk_result = await loop.run_in_executor(
                  executor, process_chunk, chunk
              )

          results.extend(chunk_result)

          # Yield control between chunks
          await asyncio.sleep(0)

      return {"total_processed": len(results), "results": results}
```

## 撰寫可支援平行處理的提示詞與工具描述

在為 AI 模型設計提示詞（prompt）時，請考慮明確指定或提示模型以平行（parallel）方式執行函式呼叫。以下是一個 AI 提示詞的範例，指示模型平行使用工具：

```none
When users ask for multiple pieces of information, always call functions in
parallel.

  Examples:
  - "Get weather for London and currency rate USD to EUR" → Call both functions
    simultaneously
  - "Compare cities A and B" → Call get_weather, get_population, get_distance in 
    parallel
  - "Analyze multiple stocks" → Call get_stock_price for each stock in parallel

  Always prefer multiple specific function calls over single complex calls.
```

以下範例顯示了一個工具函式的描述，並暗示可透過平行執行來更有效率地使用：

```python
 async def get_weather(city: str) -> dict:
      """Get current weather for a single city.

      This function is optimized for parallel execution - call multiple times for different cities.

      Args:
          city: Name of the city, for example: 'London', 'New York'

      Returns:
          Weather data including temperature, conditions, humidity
      """
      await asyncio.sleep(2)  # Simulate API call
      return {"city": city, "temp": 72, "condition": "sunny"}
```

## 下一步

如需更多關於為 agents 和 function calling 建立 Tools 的資訊，請參閱 [Function Tools](https://google.github.io/adk-docs/tools/function-tools/)。  
若想了解更多利用平行處理的工具詳細範例，請參考  
[adk-python](https://github.com/google/adk-python/tree/main/contributing/samples/parallel_functions)
repository 中的範例。
