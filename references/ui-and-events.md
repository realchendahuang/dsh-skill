# DSH UI 渲染与会话事件总线（UI & Event Streaming）

对于需要接入实时流式输出、构建交互界面或向 Web Client 贡献自定义视图组件的插件，DSH 提供了统一的事件监听与控制接口。

## 1. 监听实时流式事件（`session/event`）

插件可以通过声明注入 `inject: ['session']` 或监听 `session/event` 实时捕获 Agent 生成状态：

```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-stream-listener'

export function apply(ctx: Context) {
  ctx.on('session/event', (session, event) => {
    // 助手输出文字增量（流式打字效果）
    if (event.type === 'assistant/chunk') {
      const chunk = event.data.chunk
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text)
      } else if (chunk.type === 'reasoning-delta') {
        // 思维链 / 深度思考 token 增量
        console.log('[Thinking]:', chunk.text)
      }
    }

    // 工具调用开始与结果
    if (event.type === 'tool/start') {
      console.log(`Tool invoked: ${event.data.name}`)
    }
    if (event.type === 'tool/result') {
      console.log(`Tool completed: ${event.data.name}`)
    }

    // 轮次与步骤生命周期
    if (event.type === 'turn/start') {
      // 一轮用户/代理交互开始
    }
    if (event.type === 'turn/end') {
      // 代理完成当前轮次
    }
  })
}
```

## 2. 反向驱动 Agent（Followup / Steer / Inject）

插件如果需要从外部输入（UI 事件、Webhook、定时器）向 Agent 发起驱动，可以使用以下三种方法：

- **`agent.followup(message)`**：
  追加一条标准用户消息，排队进入 Agent 处理队列。如果当前 Agent 处于空闲状态，会直接唤醒并触发下一轮推理。
- **`agent.steer(message)`**：
  中途引导。在当前正在进行的轮次中插入引导指令，指导模型调整后续动作，无需等待整个轮次结束。
- **`agent.inject({ content, source })`**：
  静默注入持久化上下文。仅把信息追加到会话历史中，**不会唤醒空闲中的 Agent**，等待下一次由用户或定时器触发时一并喂给模型。

## 3. Web Client 自定义 Conversation Node

如果插件需要在官方 DSH Web 客户端渲染自定义的聊天气泡、卡片或业务行：

1. 声明 `ConversationNodeDefinition`；
2. 注册 keyed Chat renderer；
3. 将前端 UI 打包为 `dist/client.js` 并作为 Client 插件加载。
