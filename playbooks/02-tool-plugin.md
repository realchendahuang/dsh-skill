# SOP 02: 开发 DSH 工具插件（Tool Plugin）

本手册指导 Agent 如何开发一个标准的面向大模型的 DSH 工具插件。

## 1. 明确工具设计要素

动笔前，向用户确认或自检以下 4 个核心要素：
1. **工具名称**：kebab-case 或 snake_case（例如 `read_file`、`git_status`）。
2. **输入参数**：参数名、类型、是否必填、清晰的描述。
3. **输出规范**：返回的结构化 JSON 数据结构是什么，面向模型看到的文本摘要是什么。
4. **UI 卡片**：客户端界面上应显示为通用卡片、终端命令还是 Diff 差异。

## 2. 编写工具代码（`src/index.ts`）

按照规范编写工具实现：

```typescript
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-tools'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'fetch_user_profile',
    description: 'Fetch user public profile data by user ID.',
    parameters: {
      userId: { type: 'string', required: true, description: 'The unique user identifier' },
      detail: { type: 'boolean', description: 'Whether to include detailed stats' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
        },
        required: ['id', 'name'],
        additionalProperties: false,
      },
      render: (_args, value) => [
        { type: 'text', text: `User ${value.name} (${value.id}) [${value.role || 'Member'}]` }
      ],
      presentationMeta: (_args, value) => ({ id: value.id, name: value.name }),
    },
    // UI 展示卡片：纯函数
    presentCall(args) {
      return {
        card: 'generic',
        title: `Fetch Profile: ${args.userId}`,
        kind: 'search',
      }
    },
    presentResult(_args, result) {
      return {
        card: 'generic',
        title: result.isError ? 'Fetch Failed' : 'Profile Retrieved',
        content: result.content.map(c => c.text).join('\n'),
      }
    },
    // 执行主体
    async execute(args, exec) {
      // 必须带上 exec.signal
      const res = await fetch(`https://api.example.com/users/${args.userId}`, {
        signal: exec.signal,
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch user: ${res.statusText}`)
      }
      const data = await res.json()
      return {
        id: data.id,
        name: data.name,
        role: data.role || 'Member',
      }
    },
  }))
}
```

## 3. 自检清单

- [ ] `execute` 只返回符合 `output.schema` 的纯数据，没有杂糅奇怪的文本。
- [ ] 所有外部请求或子进程调用都传了 `exec.signal`。
- [ ] `presentCall` 与 `presentResult` 是纯函数，没有引入异步或可变状态。
- [ ] `package.json` 中的构建脚本包含外部化配置。
