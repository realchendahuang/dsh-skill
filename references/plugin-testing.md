# DSH 插件单元测试指南（Plugin Testing Guide）

编写高质量的 DSH 插件不仅需要按规范实现，还需要编写轻量的单元测试，确保在容器挂载、参数校验与取消信号处理时不发生回归。

## 1. 模拟 Cordis 上下文（Mocking Context）

在单元测试中，不需要拉起完整的 DSH 宿主进程。可以通过最小 Mock 模拟 `Context` 与 `ctx.tools`：

```typescript
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../src/index.js'

describe('My DSH Tool Plugin', () => {
  // 构造轻量 Mock 上下文
  function createMockContext() {
    const registeredTools = new Map()
    return {
      ctx: {
        tools: {
          register(toolDef: any) {
            registeredTools.set(toolDef.name, toolDef)
            return () => registeredTools.delete(toolDef.name)
          },
        },
      },
      registeredTools,
    }
  }

  test('should register tool successfully during apply', () => {
    const { ctx, registeredTools } = createMockContext()
    apply(ctx as any)

    assert.ok(registeredTools.has('my_tool'), 'my_tool should be registered')
    const tool = registeredTools.get('my_tool')
    assert.equal(tool.name, 'my_tool')
    assert.ok(tool.parameters, 'Parameters schema must be declared')
    assert.ok(tool.output, 'Output schema must be declared')
  })

  test('should execute tool and return canonical output', async () => {
    const { ctx, registeredTools } = createMockContext()
    apply(ctx as any)

    const tool = registeredTools.get('my_tool')
    const controller = new AbortController()

    // 模拟执行输入
    const result = await tool.execute(
      { query: 'test-value' },
      { signal: controller.signal }
    )

    assert.equal(typeof result, 'string')
    assert.match(result, /test-value/)
  })

  test('should respect abort signal', async () => {
    const { ctx, registeredTools } = createMockContext()
    apply(ctx as any)

    const tool = registeredTools.get('my_tool')
    const controller = new AbortController()
    controller.abort() // 提前中止

    await assert.rejects(
      async () => {
        await tool.execute({ query: 'abort-test' }, { signal: controller.signal })
      },
      /aborted/i
    )
  })
})
```

## 2. 纯函数卡片测试

`presentCall` 与 `presentResult` 是纯展示函数，可直接断言其返回的卡片意图：

```typescript
test('presentCall returns generic search card', () => {
  const { ctx, registeredTools } = createMockContext()
  apply(ctx as any)

  const tool = registeredTools.get('my_tool')
  if (tool.presentCall) {
    const card = tool.presentCall({ query: 'foo' })
    assert.equal(card.card, 'generic')
    assert.match(card.title, /foo/)
  }
})
```

## 3. 测试关键检查点

- **Schema 完整性**：检查是否声明了 `parameters` 和 `output.schema`。
- **输出格式**：检查 `execute` 是否返回规范数据结构（而非字符串拼装文本）。
- **取消信号**：验证当 `exec.signal` 触发时是否能迅速中断并抛出异常。
- **副作用清理**：验证 `apply` 返回或注册的注销函数能否正常清理资源。
