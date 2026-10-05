import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-tool-template'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'sample_tool',
    description: 'A template tool for DeepSeek Harness.',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      if (exec.signal.aborted) {
        throw new Error('Aborted')
      }
      return `Processed query: ${args.query}`
    },
  }))
}
