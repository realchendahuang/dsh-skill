#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0] || 'help'

const home = homedir()

const TARGETS = {
  dsh: resolve(process.env.DSH_HOME || resolve(home, '.dsh'), 'skills/dsh-plugin-dev'),
  claude: resolve(home, '.claude/skills/dsh-plugin-dev'),
  codex: resolve(home, '.agents/skills/dsh-plugin-dev'),
  antigravity: resolve(home, '.gemini/config/skills/dsh-plugin-dev'),
}

function printBanner() {
  console.log('\x1b[36m%s\x1b[0m', `
   ___  _____ __  __   ____  __ ___ __   __
  / _ \\/ __/ // / /  / __/ / //_// // / / /
 / // /\\ \\/ _  / /__ \\ \\  / ,<  / // /_/ /_
/____/___/_//_/____/___/ /_/|_|/_//_/____(_)
  DeepSeek Harness Plugin & Skill Development Kit
  `)
}

function printHelp() {
  printBanner()
  console.log(`
Usage:
  npx dsh-skill install [target]    Install skill to your Agent environment
  npx dsh-skill status              Check installation status across platforms
  npx dsh-skill help                Show this help message

Targets:
  all           Install to all detected platforms (default)
  dsh           Install to DeepSeek Harness (~/.dsh/skills/dsh-plugin-dev)
  claude        Install to Claude Code (~/.claude/skills/dsh-plugin-dev)
  codex         Install to OpenAI Codex (~/.agents/skills/dsh-plugin-dev)
  antigravity   Install to Google Antigravity (~/.gemini/config/skills/dsh-plugin-dev)
`)
}

function installTo(targetName, destPath) {
  try {
    mkdirSync(destPath, { recursive: true })
    // Copy SKILL.md, references/, playbooks/, templates/
    const itemsToCopy = ['SKILL.md', 'references', 'playbooks', 'templates']
    for (const item of itemsToCopy) {
      const src = resolve(rootDir, item)
      const dst = resolve(destPath, item)
      if (existsSync(src)) {
        cpSync(src, dst, { recursive: true })
      }
    }
    console.log(`\x1b[32m✔ Installed to ${targetName}:\x1b[0m ${destPath}`)
    return true
  } catch (err) {
    console.error(`\x1b[31m✖ Failed to install to ${targetName}:\x1b[0m ${err.message}`)
    return false
  }
}

function runInstall() {
  printBanner()
  const targetArg = (args[1] || 'all').toLowerCase()

  if (targetArg === 'all') {
    console.log('Installing dsh-plugin-dev skill to all platforms...\n')
    for (const [name, path] of Object.entries(TARGETS)) {
      installTo(name, path)
    }
  } else if (TARGETS[targetArg]) {
    console.log(`Installing dsh-plugin-dev skill to ${targetArg}...\n`)
    installTo(targetArg, TARGETS[targetArg])
  } else {
    console.error(`Unknown target: ${targetArg}`)
    console.log('Available targets: all, dsh, claude, codex, antigravity')
    process.exit(1)
  }

  console.log('\n\x1b[36mInstallation complete!\x1b[0m Your AI agent now has full mastery over DSH plugin development.\n')
}

function runStatus() {
  printBanner()
  console.log('Skill Installation Status across platforms:\n')
  for (const [name, path] of Object.entries(TARGETS)) {
    const isInstalled = existsSync(resolve(path, 'SKILL.md'))
    const statusText = isInstalled
      ? '\x1b[32mInstalled\x1b[0m'
      : '\x1b[33mNot Installed\x1b[0m'
    console.log(`- ${name.padEnd(12)}: ${statusText} (${path})`)
  }
  console.log('')
}

switch (command) {
  case 'install':
    runInstall()
    break
  case 'status':
    runStatus()
    break
  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp()
    break
}
