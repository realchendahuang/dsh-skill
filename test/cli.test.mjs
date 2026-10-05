import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
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

test('CLI check passes on this repository', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const stdout = execFileSync('node', [cliPath, 'check', rootDir], { encoding: 'utf8' })
  assert.match(stdout, /6 passed/i)
  assert.match(stdout, /0 failed/i)
})

test('CLI init creates a valid plugin structure', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const tempPluginName = 'test-temp-plugin-' + Date.now()
  const tempDir = resolve(rootDir, tempPluginName)

  try {
    const stdout = execFileSync('node', [cliPath, 'init', tempPluginName], {
      cwd: rootDir,
      encoding: 'utf8',
    })
    assert.match(stdout, /created successfully/i)
    assert.ok(existsSync(resolve(tempDir, 'package.json')))
    assert.ok(existsSync(resolve(tempDir, 'cordis.patch.yml')))
    assert.ok(existsSync(resolve(tempDir, 'src/index.ts')))

    // Verify it passes dsh-skill check
    const checkOut = execFileSync('node', [cliPath, 'check', tempDir], { encoding: 'utf8' })
    assert.match(checkOut, /6 passed/i)
    assert.match(checkOut, /0 failed/i)
  } finally {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
})
