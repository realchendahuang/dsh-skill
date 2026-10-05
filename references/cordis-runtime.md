# Cordis 微内核架构与插件生命周期

DeepSeek Harness (DSH) 底层采用基于 Cordis 的微内核架构。所有系统能力（工具、会话、系统提示词、审批、技能、模型适配器）均以 Cordis 插件形态挂载在统一的依赖注入容器中。

## 1. 插件基础契约

每个 DSH 插件模块必须导出一个唯一的名称、可选的依赖注入声明，以及挂载入口函数 `apply`：

```typescript
import type { Context } from '@deepseek-ai/cordis'

// 插件唯一名称（全局唯一命名空间）
export const name = 'my-dsh-extension'

// 声明需要注入的运行时服务（如果未注入，ctx 访问对应服务会报错或为 undefined）
export const inject = ['tools', 'systemPrompt']

// 挂载函数：在容器加载此插件时同步执行
export function apply(ctx: Context) {
  // 在 ctx 上注册服务、工具、事件监听或系统提示词段
  // ...
}
```

## 2. 作用域分层（Global vs Scoped Context）

DSH 实现了清晰的上下文作用域分层：

- **全局上下文 (`ctx`)**：
  由主进程初始化，承载整个运行时共享的单例服务（如基础 `fs`、全局工具注册表、全局事件总线）。
  在此上下文中注册的工具和扩展对所有 Agent 实例可见。
- **Agent 局部作用域 (`agent.ctx` / Scoped Context)**：
  每个 Agent 实例拥有基于 `dsh-scope` 派生的子作用域。
  - 在 `agent.ctx` 上注册的工具仅对该 Agent 可见，并且**同名工具会遮蔽全局同名工具**。
  - 工具可见性过滤（`ctx.tools.restrict()`）和模型呈现模式切换（`ctx.tools.presentAs()`）必须在局部作用域调用，如果在全局上下文调用会直接抛出异常。

## 3. 插件生命周期与资源清理（Disposers）

DSH 原生支持热重载（HMR）与无泄漏卸载。所有向容器注册的副作用（事件监听器、工具注册、服务提供方）都必须受控清理：

- `ctx.on(event, handler)` 返回一个注销函数。
- `ctx.tools.register(tool)` 返回一个注销函数。
- `ctx.effect(() => { ... return cleanup })` 声明成对的副作用与清理函数。
- 当所属插件 fiber 被释放或热替换时，Cordis 会自底向上自动执行所有的 disposer。

示例：
```typescript
export function apply(ctx: Context) {
  const unregisterTool = ctx.tools.register(myToolDefinition)
  
  const unregisterEvent = ctx.on('session/event', (session, event) => {
    // 处理会话事件
  })

  // 显式挂载清理逻辑（如果 register 本身已由 Cordis 托管，则容器会自动收集）
  ctx.on('dispose', () => {
    // 释放定时器、关闭连接等
  })
}
```

## 4. 自定义服务注入（Service Provider）

如果你的插件对外提供公共能力（供其他插件注入），可以使用 `ctx.provide`：

```typescript
declare module '@deepseek-ai/cordis' {
  interface Context {
    myService: MyService
  }
}

export const name = 'my-service-provider'

export function apply(ctx: Context) {
  ctx.provide('myService')
  ctx.myService = new MyServiceImpl()
}
```

其他插件即可在 `inject: ['myService']` 中声明并使用 `ctx.myService`。
