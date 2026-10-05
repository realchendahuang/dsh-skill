# SOP 03: 开发 DSH 钩子与权限门禁插件（Hook Plugin）

本手册指导 Agent 如何开发拦截特定工具调用、限制高危行为或注入安全策略的 DSH 钩子插件。

## 1. 钩子类型选型

根据拦截要求选择拦截点：
- **前置权限审批 / 拦截**：使用 `tools/pre-execute`。
- **单调不可变硬性禁止**：使用 `ctx.tools.guard()`。
- **调用超时与包装重试**：使用 `tools/execute`。
- **结果过滤与脱敏**：使用 `tools/post-execute`。

## 2. 权限门禁实现示例

实现一个拦截高危命令的权限门禁插件：

```typescript
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-safety-gate'
export const inject = ['tools']

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//,
  /drop\s+database/i,
  />\s*\/dev\/sd/,
]

function isDangerous(exec: ToolExecution): boolean {
  if (exec.name === 'bash' || exec.name === 'shell') {
    const cmd = String(exec.arguments?.command || '')
    return DANGEROUS_PATTERNS.some(p => p.test(cmd))
  }
  return false
}

export function apply(ctx: Context) {
  // 1. 在 pre-execute 阶段进行安全拦截
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (isDangerous(exec)) {
      // 可以直接拒绝：
      return {
        kind: 'deny',
        reason: 'Operation blocked by safety policy: dangerous pattern detected.',
      }
      
      // 或者如果有审批服务接入，可以请求人工审批：
      // return { kind: 'ask', reason: 'Executing high-risk system command' }
    }
    
    // 放行进入下一环
    return next()
  })

  // 2. 也可以注册单调硬守卫（绝对无法被其他插件撤回）
  ctx.tools.guard((exec) => {
    if (exec.name === 'write_file' && String(exec.arguments?.path).startsWith('/etc/')) {
      return 'Modifying system directory /etc/ is strictly forbidden.'
    }
    return undefined // undefined 表示放行
  })
}
```

## 3. 验收标准

- 拦截命中时，给模型返回明确、可理解的 `reason`，避免模型陷入无脑重试循环。
- 不得在 `pre-execute` 中尝试修改 `exec.arguments`。
