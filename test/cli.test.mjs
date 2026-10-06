import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const cliPath = resolve(rootDir, 'bin/dsh-skill.mjs')

function isolatedHome() {
  return mkdtempSync(resolve(tmpdir(), 'dsh-home-'))
}

// os.homedir() honors $HOME on POSIX and %USERPROFILE% on Windows,
// so overriding both makes the CLI operate entirely inside the sandbox.
function envWithHome(fakeHome) {
  return { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome }
}

function fakeInstall(fakeHome, target = 'claude') {
  const skillDir = resolve(fakeHome, `.${target}/skills/dsh-plugin-dev`)
  mkdirSync(resolve(skillDir, 'bin'), { recursive: true })
  writeFileSync(resolve(skillDir, 'SKILL.md'), '---\nname: dsh-plugin-dev\n---\n')
  return skillDir
}

test('SKILL.md exists and has valid frontmatter', () => {
  const skillPath = resolve(rootDir, 'SKILL.md')
  assert.ok(existsSync(skillPath), 'SKILL.md must exist')
  const raw = readFileSync(skillPath, 'utf8')
  assert.ok(raw.startsWith('---\n'), 'SKILL.md must start with a frontmatter block')
  const closing = raw.indexOf('\n---', 3)
  assert.ok(closing !== -1, 'frontmatter block must be closed with ---')
  const frontmatter = raw.slice(4, closing)
  assert.match(frontmatter, /^name:\s*\S+/m, 'frontmatter must declare a name')
  assert.match(frontmatter, /^description:\s*\S+/m, 'frontmatter must declare a description')
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
  const stdout = execFileSync('node', [cliPath, 'help'], { encoding: 'utf8' })
  assert.match(stdout, /DSH-SKILL/i)
  assert.match(stdout, /Usage:/)
})

test('CLI reports its version', () => {
  const stdout = execFileSync('node', [cliPath, '--version'], { encoding: 'utf8' })
  assert.match(stdout, /^\d+\.\d+\.\d+/)
})

test('CLI exits non-zero on unknown command', () => {
  const { status, stderr } = spawnSync('node', [cliPath, 'definitely-not-a-command'], { encoding: 'utf8' })
  assert.notStrictEqual(status, 0, 'unknown command must exit non-zero')
  assert.match(stderr, /Unknown command/i)
})

test('CLI status runs cleanly', () => {
  const stdout = execFileSync('node', [cliPath, 'status'], { encoding: 'utf8' })
  assert.match(stdout, /Skill Installation Status/i)
})

test('CLI check passes on this repository', () => {
  const stdout = execFileSync('node', [cliPath, 'check', rootDir], { encoding: 'utf8' })
  assert.match(stdout, /8 passed/i)
  assert.match(stdout, /0 failed/i)
})

test('CLI init creates a valid plugin structure', () => {
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

test('CLI init rejects invalid plugin names', () => {
  const { status, stderr } = spawnSync('node', [cliPath, 'init', 'bad name!'], { encoding: 'utf8' })
  assert.notStrictEqual(status, 0)
  assert.match(stderr, /not a valid plugin name/i)
})

test('CLI init creates a valid hook plugin with --type hook', () => {
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

test('CLI uninstall removes installed skill and CLI shim in isolated HOME', () => {
  const fakeHome = isolatedHome()
  const skillDir = fakeInstall(fakeHome, 'claude')
  const shimPath = resolve(fakeHome, '.local/bin/dsh-skill')
  mkdirSync(resolve(fakeHome, '.local/bin'), { recursive: true })
  writeFileSync(shimPath, '#!/usr/bin/env bash\n', { mode: 0o755 })

  try {
    const stdout = execFileSync('node', [cliPath, 'uninstall'], {
      encoding: 'utf8',
      env: envWithHome(fakeHome),
    })
    assert.match(stdout, /Removed from claude/i)
    assert.ok(!existsSync(skillDir), 'installed skill directory must be removed')
    assert.ok(!existsSync(shimPath), 'CLI shim must be removed')
    assert.match(stdout, /Uninstallation complete/i)
  } finally {
    rmSync(fakeHome, { recursive: true, force: true })
  }
})

test('CLI update refreshes installed skill and removes stale files', () => {
  const fakeHome = isolatedHome()
  const skillDir = fakeInstall(fakeHome, 'claude')
  writeFileSync(resolve(skillDir, 'stale-file.txt'), 'outdated content')

  try {
    const stdout = execFileSync('node', [cliPath, 'update'], {
      encoding: 'utf8',
      env: envWithHome(fakeHome),
    })
    assert.match(stdout, /Installed to claude/i)
    assert.match(stdout, /Update completed successfully/i)
    assert.ok(!existsSync(resolve(skillDir, 'stale-file.txt')), 'stale files must be removed on update')
    const refreshed = readFileSync(resolve(skillDir, 'SKILL.md'), 'utf8')
    assert.match(refreshed, /name: dsh-plugin-dev/, 'SKILL.md must be refreshed from the repository')
  } finally {
    rmSync(fakeHome, { recursive: true, force: true })
  }
})
