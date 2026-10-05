# DSH 配方与子代理扩展（Presets & Subagents）

除了常规的工具和钩子，DSH 还允许插件向系统注册自定义的 Agent 组装配方（Preset）与子代理执行器（Subagent Providers）。

## 1. 注册自定义配方（Preset）

在 DSH 中，Preset 是一份预设的插件装配清单与初始配置。插件可以注册自定义配方，用户即可通过 `dsh --preset <name>` 一键启动特定场景的 Agent：

```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-custom-preset'
export const inject = ['preset']

export function apply(ctx: Context) {
  if (ctx.preset) {
    ctx.preset.register({
      name: 'code-auditor',
      description: 'A specialized preset focused on security auditing and code review.',
      config: {
        plugins: {
          '@deepseek-ai/dsh-core': {},
          '@deepseek-ai/dsh-tools': { mode: 'code' },
          'dsh-safety-gate': {},
        },
        systemPrompt: {
          sections: [
            {
              id: 'role-definition',
              content: 'You are a senior security auditor analyzing vulnerabilities.',
            },
          ],
        },
      },
    })
  }
}
```

## 2. 扩展子代理执行器（Subagent Provider）

DSH 通过 `ctx.subagents` 统一管理子代理的派生与通信。官方内置了进程内运行、子进程 fork、ACP 协议以及 SDK 驱动。插件可以扩展新的子代理执行环境（例如挂载在远程 Docker 或隔离沙箱中）：

```typescript
import type { Context } from '@deepseek-ai/cordis'
import type { SubagentProvider, SubagentSpawnOptions } from '@deepseek-ai/dsh-subagent'

export const name = 'my-docker-subagent'
export const inject = ['subagents']

export function apply(ctx: Context) {
  ctx.subagents.registerProvider({
    name: 'docker-isolated',
    async spawn(options: SubagentSpawnOptions) {
      // 启动隔离容器并建立通信管道
      return {
        id: `docker-${Date.now()}`,
        async send(message) {
          // 向子代理投递消息
        },
        async *receive() {
          // 产生子代理的输出流
        },
        async terminate() {
          // 销毁容器
        },
      }
    },
  })
}
```
