# Agent Development Kit (ADK) 的多代理系統

隨著 agent 應用程式的複雜度提升，將其設計為單一、龐大的 agent 會變得難以開發、維護與理解。Agent Development Kit (ADK) 支援透過組合多個不同的 `BaseAgent` 實例，來建構進階的應用程式，形成**多代理系統（Multi-Agent System, MAS）**。

在 ADK 中，多代理系統是一種應用程式架構，不同的 agent（通常形成階層結構）彼此協作或協同運作，以達成更大的目標。這種架構方式帶來顯著優勢，包括更高的模組化、專業化、可重用性、可維護性，以及能夠透過專用的 workflow agent 定義結構化控制流程。

你可以組合多種從 `BaseAgent` 衍生的 agent 來建構這些系統：

* **大型語言模型 (LLM) agent：** 由大型語言模型 (Large Language Model, LLM) 驅動的 agent。（參見 [LLM Agents](llm-agents.md)）
* **Workflow agent：** 專門設計用來管理其子 agent 執行流程的 agent（`SequentialAgent`、`ParallelAgent`、`LoopAgent`）。（參見 [Workflow Agents](workflow-agents/index.md)）
* **自訂 agent：** 你自行繼承自 `BaseAgent`，並實作專屬非 LLM 邏輯的 agent。（參見 [Custom Agents](custom-agents.md)）

以下章節將詳細介紹 ADK 的核心原語（primitives），如 agent 階層、workflow agent，以及互動機制，協助你有效建構與管理多代理系統。

## 1. ADK 的 agent 組合原語 { #adk-primitives-for-agent-composition }

ADK 提供了核心的建構基礎——原語（primitives），讓你能夠在多代理系統中進行結構設計與互動管理。

!!! Note
    這些基礎元件的具體參數或方法名稱，可能會依據 SDK 語言略有不同（例如，Python 中為 `sub_agents`，Java 中為 `subAgents`）。詳細資訊請參閱各語言的 API 文件說明。

### 1.1. Agent 階層結構（父 agent、子 agent） { #agent-hierarchy-parent-agent-sub-agents }

建立多 agent 系統結構的基礎，是在 `BaseAgent` 中定義的父子關係。

* **建立階層結構：** 當初始化父 agent 時，將一組 agent 實例傳遞給 `sub_agents` 參數，即可建立樹狀結構。Agent Development Kit (ADK) 會在初始化時自動為每個子 agent 設定 `parent_agent` 屬性。
* **單一父層規則：** 一個 agent 實例只能被加入為子 agent 一次。若嘗試指定第二個父層，將會產生 `ValueError`。
* **重要性：** 此階層結構決定了 [Workflow Agents](#12-workflow-agents-as-orchestrators) 的作用範圍，並影響大型語言模型 (LLM) 驅動委派（LLM-Driven Delegation）的潛在目標。你可以透過 `agent.parent_agent` 導覽階層結構，或使用 `agent.find_agent(name)` 查找所有後代 agent。

=== "Python"

    ```python
    # Conceptual Example: Defining Hierarchy
    from google.adk.agents import LlmAgent, BaseAgent
    
    # Define individual agents
    greeter = LlmAgent(name="Greeter", model="gemini-2.0-flash")
    task_doer = BaseAgent(name="TaskExecutor") # Custom non-LLM agent
    
    # Create parent agent and assign children via sub_agents
    coordinator = LlmAgent(
        name="Coordinator",
        model="gemini-2.0-flash",
        description="I coordinate greetings and tasks.",
        sub_agents=[ # Assign sub_agents here
            greeter,
            task_doer
        ]
    )
    
    # Framework automatically sets:
    # assert greeter.parent_agent == coordinator
    # assert task_doer.parent_agent == coordinator
    ```

=== "Java"

    ```java
    // Conceptual Example: Defining Hierarchy
    import com.google.adk.agents.SequentialAgent;
    import com.google.adk.agents.LlmAgent;
    
    // Define individual agents
    LlmAgent greeter = LlmAgent.builder().name("Greeter").model("gemini-2.0-flash").build();
    SequentialAgent taskDoer = SequentialAgent.builder().name("TaskExecutor").subAgents(...).build(); // Sequential Agent
    
    // Create parent agent and assign sub_agents
    LlmAgent coordinator = LlmAgent.builder()
        .name("Coordinator")
        .model("gemini-2.0-flash")
        .description("I coordinate greetings and tasks")
        .subAgents(greeter, taskDoer) // Assign sub_agents here
        .build();
    
    // Framework automatically sets:
    // assert greeter.parentAgent().equals(coordinator);
    // assert taskDoer.parentAgent().equals(coordinator);
    ```

### 1.2. Workflow Agents as Orchestrators { #workflow-agents-as-orchestrators }

Agent Development Kit (ADK) 包含從 `BaseAgent` 衍生出的專用 agent，這些 agent 本身不執行任務，而是協調其 `sub_agents` 的執行流程。

* **[`SequentialAgent`](workflow-agents/sequential-agents.md)：** 依照列表順序，依次執行其 `sub_agents`。
    * **Context：** 會依序傳遞*相同*的 [`InvocationContext`](../runtime/index.md)，讓 agent 能夠透過共享 state 輕鬆傳遞結果。

=== "Python"

    ```python
    # Conceptual Example: Sequential Pipeline
    from google.adk.agents import SequentialAgent, LlmAgent

    step1 = LlmAgent(name="Step1_Fetch", output_key="data") # Saves output to state['data']
    step2 = LlmAgent(name="Step2_Process", instruction="Process data from {data}.")

    pipeline = SequentialAgent(name="MyPipeline", sub_agents=[step1, step2])
    # When pipeline runs, Step2 can access the state['data'] set by Step1.
    ```

=== "Java"

    ```java
    // Conceptual Example: Sequential Pipeline
    import com.google.adk.agents.SequentialAgent;
    import com.google.adk.agents.LlmAgent;

    LlmAgent step1 = LlmAgent.builder().name("Step1_Fetch").outputKey("data").build(); // Saves output to state.get("data")
    LlmAgent step2 = LlmAgent.builder().name("Step2_Process").instruction("Process data from {data}.").build();

    SequentialAgent pipeline = SequentialAgent.builder().name("MyPipeline").subAgents(step1, step2).build();
    // When pipeline runs, Step2 can access the state.get("data") set by Step1.
    ```

* **[`ParallelAgent`](workflow-agents/parallel-agents.md)：** 會平行執行其 `sub_agents`。來自子 agent 的事件可能會交錯發生。
    * **Context：** 會針對每個子 agent（例如 `ParentBranch.ChildName`）修改 `InvocationContext.branch`，提供獨立的情境路徑，這在某些記憶體實作中有助於隔離歷史紀錄。
    * **State：** 儘管有不同分支，所有平行的子 agent 都存取*相同的共享* `session.state`，讓它們能讀取初始狀態並寫入結果（請使用不同的 key 以避免競爭條件）。

=== "Python"

    ```python
    # Conceptual Example: Parallel Execution
    from google.adk.agents import ParallelAgent, LlmAgent

    fetch_weather = LlmAgent(name="WeatherFetcher", output_key="weather")
    fetch_news = LlmAgent(name="NewsFetcher", output_key="news")

    gatherer = ParallelAgent(name="InfoGatherer", sub_agents=[fetch_weather, fetch_news])
    # When gatherer runs, WeatherFetcher and NewsFetcher run concurrently.
    # A subsequent agent could read state['weather'] and state['news'].
    ```
  
=== "Java"

    ```java
    // Conceptual Example: Parallel Execution
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.ParallelAgent;
   
    LlmAgent fetchWeather = LlmAgent.builder()
        .name("WeatherFetcher")
        .outputKey("weather")
        .build();
    
    LlmAgent fetchNews = LlmAgent.builder()
        .name("NewsFetcher")
        .instruction("news")
        .build();
    
    ParallelAgent gatherer = ParallelAgent.builder()
        .name("InfoGatherer")
        .subAgents(fetchWeather, fetchNews)
        .build();
    
    // When gatherer runs, WeatherFetcher and NewsFetcher run concurrently.
    // A subsequent agent could read state['weather'] and state['news'].
    ```

  * **[`LoopAgent`](workflow-agents/loop-agents.md)：** 會在迴圈中依序執行其 `sub_agents`。
      * **終止條件：** 如果達到可選的 `max_iterations`，或任何子 agent 在其 Event Actions 中回傳 [`Event`](../events/index.md) 且包含 `escalate=True`，則迴圈會停止。
      * **Context 與 State：** 每次迭代都傳遞*相同*的 `InvocationContext`，讓狀態變化（例如：計數器、旗標）能夠在多次迴圈中持續保留。

=== "Python"

      ```python
      # Conceptual Example: Loop with Condition
      from google.adk.agents import LoopAgent, LlmAgent, BaseAgent
      from google.adk.events import Event, EventActions
      from google.adk.agents.invocation_context import InvocationContext
      from typing import AsyncGenerator

      class CheckCondition(BaseAgent): # Custom agent to check state
          async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
              status = ctx.session.state.get("status", "pending")
              is_done = (status == "completed")
              yield Event(author=self.name, actions=EventActions(escalate=is_done)) # Escalate if done

      process_step = LlmAgent(name="ProcessingStep") # Agent that might update state['status']

      poller = LoopAgent(
          name="StatusPoller",
          max_iterations=10,
          sub_agents=[process_step, CheckCondition(name="Checker")]
      )
      # When poller runs, it executes process_step then Checker repeatedly
      # until Checker escalates (state['status'] == 'completed') or 10 iterations pass.
      ```
    
=== "Java"

    ```java
    // Conceptual Example: Loop with Condition
    // Custom agent to check state and potentially escalate
    public static class CheckConditionAgent extends BaseAgent {
      public CheckConditionAgent(String name, String description) {
        super(name, description, List.of(), null, null);
      }
  
      @Override
      protected Flowable<Event> runAsyncImpl(InvocationContext ctx) {
        String status = (String) ctx.session().state().getOrDefault("status", "pending");
        boolean isDone = "completed".equalsIgnoreCase(status);

        // Emit an event that signals to escalate (exit the loop) if the condition is met.
        // If not done, the escalate flag will be false or absent, and the loop continues.
        Event checkEvent = Event.builder()
                .author(name())
                .id(Event.generateEventId()) // Important to give events unique IDs
                .actions(EventActions.builder().escalate(isDone).build()) // Escalate if done
                .build();
        return Flowable.just(checkEvent);
      }
    }
  
    // Agent that might update state.put("status")
    LlmAgent processingStepAgent = LlmAgent.builder().name("ProcessingStep").build();
    // Custom agent instance for checking the condition
    CheckConditionAgent conditionCheckerAgent = new CheckConditionAgent(
        "ConditionChecker",
        "Checks if the status is 'completed'."
    );
    LoopAgent poller = LoopAgent.builder().name("StatusPoller").maxIterations(10).subAgents(processingStepAgent, conditionCheckerAgent).build();
    // When poller runs, it executes processingStepAgent then conditionCheckerAgent repeatedly
    // until Checker escalates (state.get("status") == "completed") or 10 iterations pass.
    ```

### 1.3. 互動與通訊機制 { #interaction-communication-mechanisms }

在一個系統中，agents 經常需要彼此交換資料或觸發對方的動作。Agent Development Kit (ADK) 透過以下方式協助實現：

#### a) 共用 Session State (`session.state`)

對於在同一次呼叫中運作（因此透過 `InvocationContext` 共享同一個 [`Session`](../sessions/session.md) 物件）的 agents，這是最基本的被動通訊方式。

* **機制：** 一個 agent（或其工具/Callback）寫入一個值（`context.state['data_key'] = processed_data`），隨後的另一個 agent 讀取該值（`data = context.state.get('data_key')`）。狀態變化會透過 [`CallbackContext`](../callbacks/index.md) 進行追蹤。
* **便利性：** [`LlmAgent`](llm-agents.md) 上的 `output_key` 屬性會自動將 agent 的最終回應文字（或結構化輸出）儲存到指定的 state key。
* **特性：** 非同步、被動式通訊。非常適合由 `SequentialAgent` 協調的處理流程（pipeline），或在 `LoopAgent` 多次迭代間傳遞資料。
* **延伸閱讀：** [State Management](../sessions/state.md)

!!! note "Invocation Context and `temp:` State"
    當父 agent 呼叫子 agent 時，會傳遞相同的 `InvocationContext`。這表示它們共用相同的暫存（`temp:`）state，非常適合用來傳遞只在當前 agent 回合相關的資料。

=== "Python"

    ```python
    # Conceptual Example: Using output_key and reading state
    from google.adk.agents import LlmAgent, SequentialAgent
    
    agent_A = LlmAgent(name="AgentA", instruction="Find the capital of France.", output_key="capital_city")
    agent_B = LlmAgent(name="AgentB", instruction="Tell me about the city stored in {capital_city}.")
    
    pipeline = SequentialAgent(name="CityInfo", sub_agents=[agent_A, agent_B])
    # AgentA runs, saves "Paris" to state['capital_city'].
    # AgentB runs, its instruction processor reads state['capital_city'] to get "Paris".
    ```

=== "Java"

    ```java
    // Conceptual Example: Using outputKey and reading state
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.SequentialAgent;
    
    LlmAgent agentA = LlmAgent.builder()
        .name("AgentA")
        .instruction("Find the capital of France.")
        .outputKey("capital_city")
        .build();
    
    LlmAgent agentB = LlmAgent.builder()
        .name("AgentB")
        .instruction("Tell me about the city stored in {capital_city}.")
        .outputKey("capital_city")
        .build();
    
    SequentialAgent pipeline = SequentialAgent.builder().name("CityInfo").subAgents(agentA, agentB).build();
    // AgentA runs, saves "Paris" to state('capital_city').
    // AgentB runs, its instruction processor reads state.get("capital_city") to get "Paris".
    ```

#### b) LLM 驅動的委派（Agent Transfer）

利用 [`LlmAgent`](llm-agents.md) 的理解能力，動態地將任務路由至階層中其他合適的 agent。

* **機制：** agent 的大型語言模型 (LLM) 會產生特定的 function call：`transfer_to_agent(agent_name='target_agent_name')`。
* **處理方式：** 當存在子 agent 或未禁止轉移時，預設會由 `AutoFlow` 截獲此呼叫。它會使用 `root_agent.find_agent()` 辨識目標 agent，並更新 `InvocationContext`，以切換執行焦點。
* **需求：** 呼叫方 `LlmAgent` 需明確定義何時進行轉移（`instructions`），而潛在目標 agent 需有明確的 `description`，以便 LLM 做出明智決策。轉移範圍（父層、子 agent、同層）可於 `LlmAgent` 上設定。
* **特性：** 根據 LLM 解讀，具備動態且彈性的路由能力。

=== "Python"

    ```python
    # Conceptual Setup: LLM Transfer
    from google.adk.agents import LlmAgent
    
    booking_agent = LlmAgent(name="Booker", description="Handles flight and hotel bookings.")
    info_agent = LlmAgent(name="Info", description="Provides general information and answers questions.")
    
    coordinator = LlmAgent(
        name="Coordinator",
        model="gemini-2.0-flash",
        instruction="You are an assistant. Delegate booking tasks to Booker and info requests to Info.",
        description="Main coordinator.",
        # AutoFlow is typically used implicitly here
        sub_agents=[booking_agent, info_agent]
    )
    # If coordinator receives "Book a flight", its LLM should generate:
    # FunctionCall(name='transfer_to_agent', args={'agent_name': 'Booker'})
    # ADK framework then routes execution to booking_agent.
    ```

=== "Java"

    ```java
    // Conceptual Setup: LLM Transfer
    import com.google.adk.agents.LlmAgent;
    
    LlmAgent bookingAgent = LlmAgent.builder()
        .name("Booker")
        .description("Handles flight and hotel bookings.")
        .build();
    
    LlmAgent infoAgent = LlmAgent.builder()
        .name("Info")
        .description("Provides general information and answers questions.")
        .build();
    
    // Define the coordinator agent
    LlmAgent coordinator = LlmAgent.builder()
        .name("Coordinator")
        .model("gemini-2.0-flash") // Or your desired model
        .instruction("You are an assistant. Delegate booking tasks to Booker and info requests to Info.")
        .description("Main coordinator.")
        // AutoFlow will be used by default (implicitly) because subAgents are present
        // and transfer is not disallowed.
        .subAgents(bookingAgent, infoAgent)
        .build();

    // If coordinator receives "Book a flight", its LLM should generate:
    // FunctionCall.builder.name("transferToAgent").args(ImmutableMap.of("agent_name", "Booker")).build()
    // ADK framework then routes execution to bookingAgent.
    ```

#### c) 明確呼叫（`AgentTool`）

允許一個 [`LlmAgent`](llm-agents.md) 將另一個 `BaseAgent` 實例視為可呼叫的函式或 [Tool](../tools/index.md)。

* **機制：** 將目標 agent 實例包裝在 `AgentTool` 中，並將其加入父層 `LlmAgent` 的 `tools` 清單。`AgentTool` 會為大型語言模型 (LLM) 產生對應的函式宣告。
* **處理方式：** 當父層大型語言模型 (LLM) 產生針對 `AgentTool` 的函式呼叫時，框架會執行 `AgentTool.run_async`。此方法會執行目標 agent，擷取其最終回應，並將任何狀態／產物變更回傳至父層的 context，最後將回應作為工具的結果返回。
* **特性：** 同步（於父層流程內）、明確且可控的呼叫，類似於其他工具。
* **（注意：** 需明確匯入並使用 `AgentTool`）。

=== "Python"

    ```python
    # Conceptual Setup: Agent as a Tool
    from google.adk.agents import LlmAgent, BaseAgent
    from google.adk.tools import agent_tool
    from pydantic import BaseModel
    
    # Define a target agent (could be LlmAgent or custom BaseAgent)
    class ImageGeneratorAgent(BaseAgent): # Example custom agent
        name: str = "ImageGen"
        description: str = "Generates an image based on a prompt."
        # ... internal logic ...
        async def _run_async_impl(self, ctx): # Simplified run logic
            prompt = ctx.session.state.get("image_prompt", "default prompt")
            # ... generate image bytes ...
            image_bytes = b"..."
            yield Event(author=self.name, content=types.Content(parts=[types.Part.from_bytes(image_bytes, "image/png")]))
    
    image_agent = ImageGeneratorAgent()
    image_tool = agent_tool.AgentTool(agent=image_agent) # Wrap the agent
    
    # Parent agent uses the AgentTool
    artist_agent = LlmAgent(
        name="Artist",
        model="gemini-2.0-flash",
        instruction="Create a prompt and use the ImageGen tool to generate the image.",
        tools=[image_tool] # Include the AgentTool
    )
    # Artist LLM generates a prompt, then calls:
    # FunctionCall(name='ImageGen', args={'image_prompt': 'a cat wearing a hat'})
    # Framework calls image_tool.run_async(...), which runs ImageGeneratorAgent.
    # The resulting image Part is returned to the Artist agent as the tool result.
    ```

=== "Java"

    ```java
    // Conceptual Setup: Agent as a Tool
    import com.google.adk.agents.BaseAgent;
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.tools.AgentTool;

    // Example custom agent (could be LlmAgent or custom BaseAgent)
    public class ImageGeneratorAgent extends BaseAgent  {
    
      public ImageGeneratorAgent(String name, String description) {
        super(name, description, List.of(), null, null);
      }
    
      // ... internal logic ...
      @Override
      protected Flowable<Event> runAsyncImpl(InvocationContext invocationContext) { // Simplified run logic
        invocationContext.session().state().get("image_prompt");
        // Generate image bytes
        // ...
    
        Event responseEvent = Event.builder()
            .author(this.name())
            .content(Content.fromParts(Part.fromText("\b...")))
            .build();
    
        return Flowable.just(responseEvent);
      }
    
      @Override
      protected Flowable<Event> runLiveImpl(InvocationContext invocationContext) {
        return null;
      }
    }

    // Wrap the agent using AgentTool
    ImageGeneratorAgent imageAgent = new ImageGeneratorAgent("image_agent", "generates images");
    AgentTool imageTool = AgentTool.create(imageAgent);
    
    // Parent agent uses the AgentTool
    LlmAgent artistAgent = LlmAgent.builder()
            .name("Artist")
            .model("gemini-2.0-flash")
            .instruction(
                    "You are an artist. Create a detailed prompt for an image and then " +
                            "use the 'ImageGen' tool to generate the image. " +
                            "The 'ImageGen' tool expects a single string argument named 'request' " +
                            "containing the image prompt. The tool will return a JSON string in its " +
                            "'result' field, containing 'image_base64', 'mime_type', and 'status'."
            )
            .description("An agent that can create images using a generation tool.")
            .tools(imageTool) // Include the AgentTool
            .build();
    
    // Artist LLM generates a prompt, then calls:
    // FunctionCall(name='ImageGen', args={'imagePrompt': 'a cat wearing a hat'})
    // Framework calls imageTool.runAsync(...), which runs ImageGeneratorAgent.
    // The resulting image Part is returned to the Artist agent as the tool result.
    ```

這些基礎元件提供了高度彈性，讓你可以設計多 agent 互動，從緊密耦合的序列式工作流程，到動態、由大型語言模型 (LLM) 驅動的委派網路皆可涵蓋。

## 2. 使用 Agent Development Kit (ADK) 基礎元件的常見多 agent 模式 { #common-multi-agent-patterns-using-adk-primitives }

透過組合 ADK 的組成基礎元件，你可以實作多種既有的多 agent 協作模式。

### 協調者／分派者（Coordinator/Dispatcher）模式

* **結構：** 一個中央 [`LlmAgent`](llm-agents.md)（協調者，Coordinator）負責管理多個專門的 `sub_agents`。
* **目標：** 將進來的請求導向適合的專家 agent。
* **使用的 ADK 基礎元件：**
    * **階層結構（Hierarchy）：** 協調者會在 `sub_agents` 中列出專家。
    * **互動方式（Interaction）：** 主要使用 **由大型語言模型 (LLM) 驅動的委派（LLM-Driven Delegation）**（需在子 agent 上明確設定 `description`，並在協調者上設置適當的 `instruction`），或 **明確呼叫（Explicit Invocation, `AgentTool`）**（協調者會在其 `tools` 中包含以 `AgentTool` 包裝的專家）。

=== "Python"

    ```python
    # Conceptual Code: Coordinator using LLM Transfer
    from google.adk.agents import LlmAgent
    
    billing_agent = LlmAgent(name="Billing", description="Handles billing inquiries.")
    support_agent = LlmAgent(name="Support", description="Handles technical support requests.")
    
    coordinator = LlmAgent(
        name="HelpDeskCoordinator",
        model="gemini-2.0-flash",
        instruction="Route user requests: Use Billing agent for payment issues, Support agent for technical problems.",
        description="Main help desk router.",
        # allow_transfer=True is often implicit with sub_agents in AutoFlow
        sub_agents=[billing_agent, support_agent]
    )
    # User asks "My payment failed" -> Coordinator's LLM should call transfer_to_agent(agent_name='Billing')
    # User asks "I can't log in" -> Coordinator's LLM should call transfer_to_agent(agent_name='Support')
    ```

=== "Java"

    ```java
    // Conceptual Code: Coordinator using LLM Transfer
    import com.google.adk.agents.LlmAgent;

    LlmAgent billingAgent = LlmAgent.builder()
        .name("Billing")
        .description("Handles billing inquiries and payment issues.")
        .build();

    LlmAgent supportAgent = LlmAgent.builder()
        .name("Support")
        .description("Handles technical support requests and login problems.")
        .build();

    LlmAgent coordinator = LlmAgent.builder()
        .name("HelpDeskCoordinator")
        .model("gemini-2.0-flash")
        .instruction("Route user requests: Use Billing agent for payment issues, Support agent for technical problems.")
        .description("Main help desk router.")
        .subAgents(billingAgent, supportAgent)
        // Agent transfer is implicit with sub agents in the Autoflow, unless specified
        // using .disallowTransferToParent or disallowTransferToPeers
        .build();

    // User asks "My payment failed" -> Coordinator's LLM should call
    // transferToAgent(agentName='Billing')
    // User asks "I can't log in" -> Coordinator's LLM should call
    // transferToAgent(agentName='Support')
    ```

### 順序管線模式（Sequential Pipeline Pattern）

* **結構：**一個 [`SequentialAgent`](workflow-agents/sequential-agents.md) 包含依固定順序執行的 `sub_agents`。
* **目標：**實現多步驟流程，使每個步驟的輸出作為下一步的輸入。
* **使用的 Agent Development Kit (ADK) 原語：**
    * **Workflow：**`SequentialAgent` 定義執行順序。
    * **Communication：**主要使用 **Shared Session State**。前面的 agent 會寫入結果（通常透過 `output_key`），後續的 agent 則從 `context.state` 讀取這些結果。

=== "Python"

    ```python
    # Conceptual Code: Sequential Data Pipeline
    from google.adk.agents import SequentialAgent, LlmAgent
    
    validator = LlmAgent(name="ValidateInput", instruction="Validate the input.", output_key="validation_status")
    processor = LlmAgent(name="ProcessData", instruction="Process data if {validation_status} is 'valid'.", output_key="result")
    reporter = LlmAgent(name="ReportResult", instruction="Report the result from {result}.")
    
    data_pipeline = SequentialAgent(
        name="DataPipeline",
        sub_agents=[validator, processor, reporter]
    )
    # validator runs -> saves to state['validation_status']
    # processor runs -> reads state['validation_status'], saves to state['result']
    # reporter runs -> reads state['result']
    ```

=== "Java"

    ```java
    // Conceptual Code: Sequential Data Pipeline
    import com.google.adk.agents.SequentialAgent;
    
    LlmAgent validator = LlmAgent.builder()
        .name("ValidateInput")
        .instruction("Validate the input")
        .outputKey("validation_status") // Saves its main text output to session.state["validation_status"]
        .build();
    
    LlmAgent processor = LlmAgent.builder()
        .name("ProcessData")
        .instruction("Process data if {validation_status} is 'valid'")
        .outputKey("result") // Saves its main text output to session.state["result"]
        .build();
    
    LlmAgent reporter = LlmAgent.builder()
        .name("ReportResult")
        .instruction("Report the result from {result}")
        .build();
    
    SequentialAgent dataPipeline = SequentialAgent.builder()
        .name("DataPipeline")
        .subAgents(validator, processor, reporter)
        .build();
    
    // validator runs -> saves to state['validation_status']
    // processor runs -> reads state['validation_status'], saves to state['result']
    // reporter runs -> reads state['result']
    ```

### 平行扇出／彙總（Fan-Out/Gather）模式

* **結構：** 一個 [`ParallelAgent`](workflow-agents/parallel-agents.md) 會同時執行多個 `sub_agents`，通常後續會有另一個 agent（在 `SequentialAgent` 中）負責彙總結果。
* **目標：** 同步執行彼此獨立的任務以降低延遲，然後將它們的輸出合併。
* **使用的 Agent Development Kit (ADK) 原語：**
    * **Workflow：** `ParallelAgent` 用於平行執行（Fan-Out）。通常會巢狀在 `SequentialAgent` 內，以處理後續的彙總步驟（Gather）。
    * **通訊：** 子 agent 會將結果寫入 **Shared Session State** 的不同 key。後續的「Gather」agent 會讀取多個 state key。

=== "Python"

    ```python
    # Conceptual Code: Parallel Information Gathering
    from google.adk.agents import SequentialAgent, ParallelAgent, LlmAgent
    
    fetch_api1 = LlmAgent(name="API1Fetcher", instruction="Fetch data from API 1.", output_key="api1_data")
    fetch_api2 = LlmAgent(name="API2Fetcher", instruction="Fetch data from API 2.", output_key="api2_data")
    
    gather_concurrently = ParallelAgent(
        name="ConcurrentFetch",
        sub_agents=[fetch_api1, fetch_api2]
    )
    
    synthesizer = LlmAgent(
        name="Synthesizer",
        instruction="Combine results from {api1_data} and {api2_data}."
    )
    
    overall_workflow = SequentialAgent(
        name="FetchAndSynthesize",
        sub_agents=[gather_concurrently, synthesizer] # Run parallel fetch, then synthesize
    )
    # fetch_api1 and fetch_api2 run concurrently, saving to state.
    # synthesizer runs afterwards, reading state['api1_data'] and state['api2_data'].
    ```
=== "Java"

    ```java
    // Conceptual Code: Parallel Information Gathering
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.ParallelAgent;
    import com.google.adk.agents.SequentialAgent;

    LlmAgent fetchApi1 = LlmAgent.builder()
        .name("API1Fetcher")
        .instruction("Fetch data from API 1.")
        .outputKey("api1_data")
        .build();

    LlmAgent fetchApi2 = LlmAgent.builder()
        .name("API2Fetcher")
        .instruction("Fetch data from API 2.")
        .outputKey("api2_data")
        .build();

    ParallelAgent gatherConcurrently = ParallelAgent.builder()
        .name("ConcurrentFetcher")
        .subAgents(fetchApi2, fetchApi1)
        .build();

    LlmAgent synthesizer = LlmAgent.builder()
        .name("Synthesizer")
        .instruction("Combine results from {api1_data} and {api2_data}.")
        .build();

    SequentialAgent overallWorfklow = SequentialAgent.builder()
        .name("FetchAndSynthesize") // Run parallel fetch, then synthesize
        .subAgents(gatherConcurrently, synthesizer)
        .build();

    // fetch_api1 and fetch_api2 run concurrently, saving to state.
    // synthesizer runs afterwards, reading state['api1_data'] and state['api2_data'].
    ```


### 階層式任務分解

* **結構：** 由多層 agent 組成的樹狀結構，高階 agent 將複雜目標拆解並將子任務委派給低階 agent。
* **目標：** 透過遞迴地將複雜問題分解為更簡單、可執行的步驟來解決問題。
* **使用的 Agent Development Kit (ADK) 原語：**
    * **階層結構：** 多層 `parent_agent`/`sub_agents` 結構。
    * **互動方式：** 主要由父層 agent 採用**大型語言模型 (LLM) 驅動委派**或**明確呼叫（`AgentTool`）**來分派任務給子 agent。結果會透過工具回應或狀態自下而上回傳至階層上層。

=== "Python"

    ```python
    # Conceptual Code: Hierarchical Research Task
    from google.adk.agents import LlmAgent
    from google.adk.tools import agent_tool
    
    # Low-level tool-like agents
    web_searcher = LlmAgent(name="WebSearch", description="Performs web searches for facts.")
    summarizer = LlmAgent(name="Summarizer", description="Summarizes text.")
    
    # Mid-level agent combining tools
    research_assistant = LlmAgent(
        name="ResearchAssistant",
        model="gemini-2.0-flash",
        description="Finds and summarizes information on a topic.",
        tools=[agent_tool.AgentTool(agent=web_searcher), agent_tool.AgentTool(agent=summarizer)]
    )
    
    # High-level agent delegating research
    report_writer = LlmAgent(
        name="ReportWriter",
        model="gemini-2.0-flash",
        instruction="Write a report on topic X. Use the ResearchAssistant to gather information.",
        tools=[agent_tool.AgentTool(agent=research_assistant)]
        # Alternatively, could use LLM Transfer if research_assistant is a sub_agent
    )
    # User interacts with ReportWriter.
    # ReportWriter calls ResearchAssistant tool.
    # ResearchAssistant calls WebSearch and Summarizer tools.
    # Results flow back up.
    ```

=== "Java"

    ```java
    // Conceptual Code: Hierarchical Research Task
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.tools.AgentTool;
    
    // Low-level tool-like agents
    LlmAgent webSearcher = LlmAgent.builder()
        .name("WebSearch")
        .description("Performs web searches for facts.")
        .build();
    
    LlmAgent summarizer = LlmAgent.builder()
        .name("Summarizer")
        .description("Summarizes text.")
        .build();
    
    // Mid-level agent combining tools
    LlmAgent researchAssistant = LlmAgent.builder()
        .name("ResearchAssistant")
        .model("gemini-2.0-flash")
        .description("Finds and summarizes information on a topic.")
        .tools(AgentTool.create(webSearcher), AgentTool.create(summarizer))
        .build();
    
    // High-level agent delegating research
    LlmAgent reportWriter = LlmAgent.builder()
        .name("ReportWriter")
        .model("gemini-2.0-flash")
        .instruction("Write a report on topic X. Use the ResearchAssistant to gather information.")
        .tools(AgentTool.create(researchAssistant))
        // Alternatively, could use LLM Transfer if research_assistant is a subAgent
        .build();
    
    // User interacts with ReportWriter.
    // ReportWriter calls ResearchAssistant tool.
    // ResearchAssistant calls WebSearch and Summarizer tools.
    // Results flow back up.
    ```

### Review/Critique Pattern（生成者-評論者）

* **結構：** 通常在[`SequentialAgent`](workflow-agents/sequential-agents.md)中包含兩個 agent：一個 Generator（生成者）和一個 Critic/Reviewer（評論者／審查者）。
* **目標：** 透過專門的 agent 進行審查，以提升生成內容的品質或有效性。
* **所使用的 Agent Development Kit (ADK) 原語：**
    * **Workflow：** `SequentialAgent` 確保生成步驟先於審查步驟執行。
    * **Communication：** **Shared Session State**（Generator 使用 `output_key` 儲存輸出；Reviewer 讀取該 state key）。Reviewer 也可能將其回饋儲存到另一個 state key，供後續步驟使用。

=== "Python"

    ```python
    # Conceptual Code: Generator-Critic
    from google.adk.agents import SequentialAgent, LlmAgent
    
    generator = LlmAgent(
        name="DraftWriter",
        instruction="Write a short paragraph about subject X.",
        output_key="draft_text"
    )
    
    reviewer = LlmAgent(
        name="FactChecker",
        instruction="Review the text in {draft_text} for factual accuracy. Output 'valid' or 'invalid' with reasons.",
        output_key="review_status"
    )
    
    # Optional: Further steps based on review_status
    
    review_pipeline = SequentialAgent(
        name="WriteAndReview",
        sub_agents=[generator, reviewer]
    )
    # generator runs -> saves draft to state['draft_text']
    # reviewer runs -> reads state['draft_text'], saves status to state['review_status']
    ```

=== "Java"

    ```java
    // Conceptual Code: Generator-Critic
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.SequentialAgent;
    
    LlmAgent generator = LlmAgent.builder()
        .name("DraftWriter")
        .instruction("Write a short paragraph about subject X.")
        .outputKey("draft_text")
        .build();
    
    LlmAgent reviewer = LlmAgent.builder()
        .name("FactChecker")
        .instruction("Review the text in {draft_text} for factual accuracy. Output 'valid' or 'invalid' with reasons.")
        .outputKey("review_status")
        .build();
    
    // Optional: Further steps based on review_status
    
    SequentialAgent reviewPipeline = SequentialAgent.builder()
        .name("WriteAndReview")
        .subAgents(generator, reviewer)
        .build();
    
    // generator runs -> saves draft to state['draft_text']
    // reviewer runs -> reads state['draft_text'], saves status to state['review_status']
    ```

### 反覆精煉模式（Iterative Refinement Pattern）

* **結構：** 使用一個 [`LoopAgent`](workflow-agents/loop-agents.md)，其中包含一個或多個 agent，這些 agent 會在多次迭代中處理任務。
* **目標：** 持續優化儲存在 session state 中的結果（例如：程式碼、文字、計畫），直到達到品質門檻或達到最大迭代次數為止。
* **使用的 Agent Development Kit (ADK) 原語：**
    * **工作流程（Workflow）：** `LoopAgent` 負責管理重複執行。
    * **通訊（Communication）：** **共用 session state** 對於 agent 來說至關重要，因為 agent 需要讀取前一次迭代的輸出並儲存精煉後的版本。
    * **終止條件（Termination）：** 這個迴圈通常會根據 `max_iterations`，或由專門的檢查 agent 在 `Event Actions` 中設定 `escalate=True` 當結果令人滿意時結束。

=== "Python"

    ```python
    # Conceptual Code: Iterative Code Refinement
    from google.adk.agents import LoopAgent, LlmAgent, BaseAgent
    from google.adk.events import Event, EventActions
    from google.adk.agents.invocation_context import InvocationContext
    from typing import AsyncGenerator
    
    # Agent to generate/refine code based on state['current_code'] and state['requirements']
    code_refiner = LlmAgent(
        name="CodeRefiner",
        instruction="Read state['current_code'] (if exists) and state['requirements']. Generate/refine Python code to meet requirements. Save to state['current_code'].",
        output_key="current_code" # Overwrites previous code in state
    )
    
    # Agent to check if the code meets quality standards
    quality_checker = LlmAgent(
        name="QualityChecker",
        instruction="Evaluate the code in state['current_code'] against state['requirements']. Output 'pass' or 'fail'.",
        output_key="quality_status"
    )
    
    # Custom agent to check the status and escalate if 'pass'
    class CheckStatusAndEscalate(BaseAgent):
        async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
            status = ctx.session.state.get("quality_status", "fail")
            should_stop = (status == "pass")
            yield Event(author=self.name, actions=EventActions(escalate=should_stop))
    
    refinement_loop = LoopAgent(
        name="CodeRefinementLoop",
        max_iterations=5,
        sub_agents=[code_refiner, quality_checker, CheckStatusAndEscalate(name="StopChecker")]
    )
    # Loop runs: Refiner -> Checker -> StopChecker
    # State['current_code'] is updated each iteration.
    # Loop stops if QualityChecker outputs 'pass' (leading to StopChecker escalating) or after 5 iterations.
    ```

=== "Java"

（Java 內容）

    ```java
    // Conceptual Code: Iterative Code Refinement
    import com.google.adk.agents.BaseAgent;
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.LoopAgent;
    import com.google.adk.events.Event;
    import com.google.adk.events.EventActions;
    import com.google.adk.agents.InvocationContext;
    import io.reactivex.rxjava3.core.Flowable;
    import java.util.List;
    
    // Agent to generate/refine code based on state['current_code'] and state['requirements']
    LlmAgent codeRefiner = LlmAgent.builder()
        .name("CodeRefiner")
        .instruction("Read state['current_code'] (if exists) and state['requirements']. Generate/refine Java code to meet requirements. Save to state['current_code'].")
        .outputKey("current_code") // Overwrites previous code in state
        .build();
    
    // Agent to check if the code meets quality standards
    LlmAgent qualityChecker = LlmAgent.builder()
        .name("QualityChecker")
        .instruction("Evaluate the code in state['current_code'] against state['requirements']. Output 'pass' or 'fail'.")
        .outputKey("quality_status")
        .build();
    
    BaseAgent checkStatusAndEscalate = new BaseAgent(
        "StopChecker","Checks quality_status and escalates if 'pass'.", List.of(), null, null) {
    
      @Override
      protected Flowable<Event> runAsyncImpl(InvocationContext invocationContext) {
        String status = (String) invocationContext.session().state().getOrDefault("quality_status", "fail");
        boolean shouldStop = "pass".equals(status);
    
        EventActions actions = EventActions.builder().escalate(shouldStop).build();
        Event event = Event.builder()
            .author(this.name())
            .actions(actions)
            .build();
        return Flowable.just(event);
      }
    };
    
    LoopAgent refinementLoop = LoopAgent.builder()
        .name("CodeRefinementLoop")
        .maxIterations(5)
        .subAgents(codeRefiner, qualityChecker, checkStatusAndEscalate)
        .build();
    
    // Loop runs: Refiner -> Checker -> StopChecker
    // State['current_code'] is updated each iteration.
    // Loop stops if QualityChecker outputs 'pass' (leading to StopChecker escalating) or after 5
    // iterations.
    ```

### Human-in-the-Loop 模式

* **結構（Structure）：** 在 agent 工作流程中整合人工介入點。
* **目標（Goal）：** 允許人工監督、審核、修正，或處理 AI 無法執行的任務。
* **所用的 Agent Development Kit (ADK) 原語（概念性）：**
    * **互動（Interaction）：** 可透過自訂的 **Tool** 實作，該工具會暫停執行，並向外部系統（例如 UI、工單系統）發送請求，等待人工輸入。該工具再將人工回應傳回 agent。
    * **工作流程（Workflow）：** 可以使用 **LLM-Driven Delegation**（`transfer_to_agent`），目標為概念上的「Human Agent」，以觸發外部工作流程，或在 `LlmAgent` 中使用自訂工具。
    * **狀態／Callbacks：** 狀態可保存給人工處理的任務細節；Callbacks 可管理互動流程。
    * **注意：** Agent Development Kit (ADK) 沒有內建的「Human Agent」型別，因此需要自訂整合。

=== "Python"

    ```python
    # Conceptual Code: Using a Tool for Human Approval
    from google.adk.agents import LlmAgent, SequentialAgent
    from google.adk.tools import FunctionTool
    
    # --- Assume external_approval_tool exists ---
    # This tool would:
    # 1. Take details (e.g., request_id, amount, reason).
    # 2. Send these details to a human review system (e.g., via API).
    # 3. Poll or wait for the human response (approved/rejected).
    # 4. Return the human's decision.
    # async def external_approval_tool(amount: float, reason: str) -> str: ...
    approval_tool = FunctionTool(func=external_approval_tool)
    
    # Agent that prepares the request
    prepare_request = LlmAgent(
        name="PrepareApproval",
        instruction="Prepare the approval request details based on user input. Store amount and reason in state.",
        # ... likely sets state['approval_amount'] and state['approval_reason'] ...
    )
    
    # Agent that calls the human approval tool
    request_approval = LlmAgent(
        name="RequestHumanApproval",
        instruction="Use the external_approval_tool with amount from state['approval_amount'] and reason from state['approval_reason'].",
        tools=[approval_tool],
        output_key="human_decision"
    )
    
    # Agent that proceeds based on human decision
    process_decision = LlmAgent(
        name="ProcessDecision",
        instruction="Check {human_decision}. If 'approved', proceed. If 'rejected', inform user."
    )
    
    approval_workflow = SequentialAgent(
        name="HumanApprovalWorkflow",
        sub_agents=[prepare_request, request_approval, process_decision]
    )
    ```

=== "Java"

    ```java
    // Conceptual Code: Using a Tool for Human Approval
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.agents.SequentialAgent;
    import com.google.adk.tools.FunctionTool;
    
    // --- Assume external_approval_tool exists ---
    // This tool would:
    // 1. Take details (e.g., request_id, amount, reason).
    // 2. Send these details to a human review system (e.g., via API).
    // 3. Poll or wait for the human response (approved/rejected).
    // 4. Return the human's decision.
    // public boolean externalApprovalTool(float amount, String reason) { ... }
    FunctionTool approvalTool = FunctionTool.create(externalApprovalTool);
    
    // Agent that prepares the request
    LlmAgent prepareRequest = LlmAgent.builder()
        .name("PrepareApproval")
        .instruction("Prepare the approval request details based on user input. Store amount and reason in state.")
        // ... likely sets state['approval_amount'] and state['approval_reason'] ...
        .build();
    
    // Agent that calls the human approval tool
    LlmAgent requestApproval = LlmAgent.builder()
        .name("RequestHumanApproval")
        .instruction("Use the external_approval_tool with amount from state['approval_amount'] and reason from state['approval_reason'].")
        .tools(approvalTool)
        .outputKey("human_decision")
        .build();
    
    // Agent that proceeds based on human decision
    LlmAgent processDecision = LlmAgent.builder()
        .name("ProcessDecision")
        .instruction("Check {human_decision}. If 'approved', proceed. If 'rejected', inform user.")
        .build();
    
    SequentialAgent approvalWorkflow = SequentialAgent.builder()
        .name("HumanApprovalWorkflow")
        .subAgents(prepareRequest, requestApproval, processDecision)
        .build();
    ```

這些模式為你架構多 agent 系統提供了起點。你可以根據需求自由組合這些模式，以打造最適合你特定應用的架構。
