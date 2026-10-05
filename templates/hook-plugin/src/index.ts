import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-hook-template'
export const inject = ['tools']

export function apply(ctx: Context) {
  // Pre-execute gate
  ctx.on('tools/pre-execute', async (exec: ToolExecution, next): Promise<PreToolDecision> => {
    // Check execution
    return next()
  })

  // Monotonic guard
  ctx.tools.guard((exec: ToolExecution) => {
    return undefined // Return reason string to reject
  })
}
