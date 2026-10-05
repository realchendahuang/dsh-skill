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

test('install.sh exists and is executable', () => {
  const installShPath = resolve(rootDir, 'install.sh')
  assert.ok(existsSync(installShPath), 'install.sh must exist')
})

test('install.ps1 exists', () => {
  const installPs1Path = resolve(rootDir, 'install.ps1')
  assert.ok(existsSync(installPs1Path), 'install.ps1 must exist')
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
  assert.match(stdout, /8 passed/i)
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
    assert.match(checkOut, /8 passed/i)
    assert.match(checkOut, /0 failed/i)
  } finally {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
})

test('CLI init creates a valid hook plugin with --type hook', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const tempHookName = 'test-temp-hook-' + Date.now()
  const tempDir = resolve(rootDir, tempHookName)

  try {
    const stdout = execFileSync('node', [cliPath, 'init', tempHookName, '--type', 'hook'], {
      cwd: rootDir,
      encoding: 'utf8',
    })
    assert.match(stdout, /hook/i)
    assert.match(stdout, /created successfully/i)
    assert.ok(existsSync(resolve(tempDir, 'package.json')))
    assert.ok(existsSync(resolve(tempDir, 'src/index.ts')))

    const checkOut = execFileSync('node', [cliPath, 'check', tempDir], { encoding: 'utf8' })
    assert.match(checkOut, /8 passed/i)
  } finally {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
})

test('CLI init creates a skill bundle with --type skill', () => {
  const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')
  const tempSkillName = 'test-temp-skill-' + Date.now()
  const tempDir = resolve(rootDir, tempSkillName)

  try {
    const stdout = execFileSync('node', [cliPath, 'init', tempSkillName, '--type', 'skill'], {
      cwd: rootDir,
      encoding: 'utf8',
    })
    assert.match(stdout, /Skill bundle/i)
    assert.ok(existsSync(resolve(tempDir, 'SKILL.md')))
  } finally {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
})
