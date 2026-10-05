import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface CordisContext {
  skills?: {
    register: (skill: {
      name: string
      description: string
      content: string
      metadata?: Record<string, unknown>
    }) => () => void
  }
}

export const name = 'dsh-skill'
export const inject = ['skills']

/**
 * When mounted as a Cordis plugin in DeepSeek Harness,
 * automatically registers the official dsh-plugin-dev skill into the skill registry.
 */
export function apply(ctx: CordisContext) {
  if (ctx.skills && typeof ctx.skills.register === 'function') {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const candidatePaths = [
      resolve(__dirname, '../SKILL.md'),
      resolve(__dirname, './SKILL.md'),
    ]

    for (const skillPath of candidatePaths) {
      if (existsSync(skillPath)) {
        try {
          const content = readFileSync(skillPath, 'utf8')
          ctx.skills.register({
            name: 'dsh-plugin-dev',
            description: 'Official development guide and SOP for DeepSeek Harness plugins, tools, and hooks.',
            content,
            metadata: { provider: 'dsh-skill' },
          })
          break
        } catch {
          // Ignore read errors and continue
        }
      }
    }
  }
}
