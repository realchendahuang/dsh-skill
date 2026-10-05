# DSH 工具开发规范（Tool Contract）

DSH 中的面向模型工具通过 `@deepseek-ai/dsh-tools` 的 `defineTool` 辅助函数进行注册。工具不仅参与模型的 Prompt 组装与 Function Calling，还深度集成至 UI 渲染、Code Mode SDK 生成与重放系统。

## 1. 最小工具定义骨架

```typescript
import { readFile } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-tools'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'read_project_file',
    description: 'Read the contents of a UTF-8 text file from workspace.',
    
    // 参数 Schema（基于 ParameterSchemaSpec DSL，运行时自动严格校验）
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute file path' },
      max_bytes: { type: 'number', description: 'Optional byte limit' },
    },

    // 规范输出定义
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
      // 可选：为日志重放投影的轻量元数据（不持久化庞大的原始 value）
      presentationMeta: (_args, value) => ({ length: value.length }),
    },

    // 协作并发分类器（仅在确信安全且无副作用时返回 true）
    isConcurrencySafe: (_args) => true,

    // 工具主体：args 拥有从 Schema 自动推导的精确 TypeScript 类型
    async execute(args, exec) {
      // 必须传递 exec.signal 以支持协作式取消与超时处理
      const content = await readFile(args.path, {
        encoding: 'utf8',
        signal: exec.signal,
      })
      return args.max_bytes ? content.slice(0, args.max_bytes) : content
    },
  }))
}
```

## 2. 参数校验与 Schema 规范

- **运行时校验先于 `execute` 执行**：参数不满足 Schema（缺必填项、类型不符、枚举超界）会被自动捕获为 `ToolArgsError`，直接走标准错误流，不会触发 `execute`。
- **开放根对象**：参数根对象默认允许额外键（便于模型容错）；显式嵌套对象节点必须明确声明 `additionalProperties: true | false`。
- **无状态 Schema**：注册借用只读定义，不可在注册后动态修改内部 Schema。

## 3. 规范输出（Canonical Output）设计原则

- **`execute` 只返回纯 JSON 数据**：返回值必须严格匹配 `output.schema`，禁止在主体中返回杂糅的格式化文本或自然语言说明。
- **`output.render` 交付模型视野**：面向模型的解释、总结或文本流在 `render(args, value)` 中构造。
- **程序化消费友好**：在 Code Mode（`run_code`）下，程序接收到的是 `execute` 返回的规范数据对象，而非渲染后的自然语言字符串。

## 4. UI 卡片渲染意图（UI Presentation Cards）

工具可以通过纯函数 `presentCall` 与 `presentResult` 声明在 DSH 客户端界面上的卡片展示形态：

- **调用中卡片 (`presentCall`)**：
  - `card: 'generic'`：默认通用卡片（标题、图标类型 `kind`、关联文件 `locations: [{ path, line }]`）。
  - `card: 'terminal'`：命令行终端卡片（用于 shell/bash 类工具）。
  - `card: 'diff'`：文件差异卡片（用于修改文件的工具）。
- **结果卡片 (`presentResult`)**：
  - `card: 'generic'`：标题与文本。
  - `card: 'terminal'`：原始 stdout/stderr 输出与 exitCode。
  - `card: 'diff'`：`{ diffs: [{ path, oldText, newText }] }` 内联渲染差异。
  - `card: 'search'`：搜索结果（按文件分组的文件名与匹配行，配合 `truncated/total` 避免失真）。
  - `card: 'read'`：代码查看器（带行号、语法高亮与行偏移量）。
  - `card: 'web'`：网页抓取与搜索摘要卡片。

> **硬性铁律**：`presentCall` 和 `presentResult` 必须是**纯函数**。它们会在实时渲染和历史会话回放时反复执行，严禁进行 I/O 操作、读取可变外部状态或调用时钟/随机数。

## 5. 协作取消与后台长时间任务

- **遵守 `exec.signal`**：所有异步 I/O、HTTP 请求与子进程必须绑定并响应 `exec.signal`，超时或用户按停止键时优雅中断。
- **后台长时间任务 (`ctx.jobs`)**：
  需要脱离当前单步 Turn 持续运行的耗时工作（如服务启动、持续构建），必须使用 `ctx.jobs.start({ kind, label, owner: exec.agent, run })` 托管，向模型返回规范的任务句柄 `{ kind: 'background', jobId }`，而不是挂起阻塞主循环。
