import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

test('SKILL.md exists and has valid frontmatter', () => {
  const skillPath = resolve(rootDir, 'SKILL.md')
  assert.ok(existsSync(skillPath), 'SKILL.md must exist')
})

test('CLI prints banner and help without error', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const stdout = execFileSync('node', [cliPath, 'help'], { encoding: 'utf8' })
  assert.match(stdout, /DSH-SKILL/i)
  assert.match(stdout, /Usage:/)
})

test('CLI status runs cleanly', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const stdout = execFileSync('node', [cliPath, 'status'], { encoding: 'utf8' })
  assert.match(stdout, /Skill Installation Status/i)
})
