#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
  dsh-skill install [target]    Install skill to your Agent environment
  dsh-skill status              Check installation status across platforms
  dsh-skill init <name>         Scaffold a new DSH plugin from templates
  dsh-skill check [path]        Verify DSH plugin compliance and rules
  dsh-skill help                Show this help message

Install Targets:
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
    const itemsToCopy = ['SKILL.md', 'references', 'playbooks', 'templates', 'bin']
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

function installCliShim() {
  try {
    const localBin = resolve(home, '.local/bin')
    mkdirSync(localBin, { recursive: true })
    const shimPath = resolve(localBin, 'dsh-skill')
    const primaryDir = TARGETS.codex || TARGETS.dsh
    const scriptTarget = resolve(primaryDir, 'bin/dsh-skill.mjs')

    const shimContent = `#!/usr/bin/env bash
if command -v node >/dev/null 2>&1; then
  exec node "${scriptTarget}" "$@"
else
  echo "Error: Node.js is required to run dsh-skill CLI." >&2
  exit 1
fi
`
    writeFileSync(shimPath, shimContent, { mode: 0o755 })
    console.log(`\x1b[32m✔ CLI executable linked to:\x1b[0m ${shimPath}`)
    return true
  } catch (err) {
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
    installCliShim()
  } else if (TARGETS[targetArg]) {
    console.log(`Installing dsh-plugin-dev skill to ${targetArg}...\n`)
    installTo(targetArg, TARGETS[targetArg])
    installCliShim()
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
  const shimInstalled = existsSync(resolve(home, '.local/bin/dsh-skill'))
  console.log(`- ${'cli (PATH)'.padEnd(12)}: ${shimInstalled ? '\x1b[32mInstalled\x1b[0m' : '\x1b[33mNot Installed\x1b[0m'} (${resolve(home, '.local/bin/dsh-skill')})`)
  console.log('')
}

function runInit() {
  printBanner()
  const pluginName = args[1]
  if (!pluginName) {
    console.error('\x1b[31mError:\x1b[0m Please provide a plugin name.')
    console.log('Example: dsh-skill init dsh-my-tools\n')
    process.exit(1)
  }

  const targetDir = resolve(process.cwd(), pluginName)
  if (existsSync(targetDir)) {
    console.error(`\x1b[31mError:\x1b[0m Directory ${pluginName} already exists.`)
    process.exit(1)
  }

  console.log(`Scaffolding new DSH plugin in \x1b[36m${pluginName}\x1b[0m...\n`)

  mkdirSync(resolve(targetDir, 'src'), { recursive: true })
  mkdirSync(resolve(targetDir, 'scripts'), { recursive: true })

  // 1. Copy template files with fallback
  let templateDir = resolve(rootDir, 'templates/tool-plugin')
  if (!existsSync(templateDir)) {
    for (const candPath of Object.values(TARGETS)) {
      const cand = resolve(candPath, 'templates/tool-plugin')
      if (existsSync(cand)) {
        templateDir = cand
        break
      }
    }
  }
  cpSync(resolve(templateDir, 'src/index.ts'), resolve(targetDir, 'src/index.ts'))

  // 2. Write package.json
  const pkgContent = {
    name: pluginName,
    version: '0.1.0',
    description: `${pluginName} for DeepSeek Harness`,
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    files: ['dist', 'README.md', 'LICENSE', 'cordis.patch.yml'],
    dsh: {
      bundle: {
        patch: './cordis.patch.yml',
      },
    },
    scripts: {
      build: 'node scripts/build.mjs',
      typecheck: 'tsc --noEmit',
      verify: 'npm run typecheck && npm run build',
    },
    keywords: ['dsh-plugin', 'deepseek-harness'],
    peerDependencies: {
      '@deepseek-ai/cordis': '>=1.0.0',
      '@deepseek-ai/dsh-tools': '>=1.0.0',
    },
    devDependencies: {
      '@deepseek-ai/cordis': '^1.0.0',
      '@deepseek-ai/dsh-tools': '^1.0.0',
      esbuild: '^0.23.0',
      typescript: '^5.5.0',
    },
  }
  writeFileSync(resolve(targetDir, 'package.json'), JSON.stringify(pkgContent, null, 2) + '\n')

  // 3. Write cordis.patch.yml
  const patchContent = `- insert:
    - id: ${pluginName}
      name: ${pluginName}
`
  writeFileSync(resolve(targetDir, 'cordis.patch.yml'), patchContent)

  // 4. Write tsconfig.json
  const tsconfigContent = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: './dist',
      skipLibCheck: true,
      esModuleInterop: true,
    },
    include: ['src/**/*'],
  }
  writeFileSync(resolve(targetDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2) + '\n')

  // 5. Write scripts/build.mjs
  const buildScript = `import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  format: 'esm',
  sourcemap: true,
  external: [
    '@deepseek-ai/*',
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-tools',
  ],
})

console.log('Build completed: dist/index.js')
`
  writeFileSync(resolve(targetDir, 'scripts/build.mjs'), buildScript)

  // 6. Write README.md
  writeFileSync(resolve(targetDir, 'README.md'), `# ${pluginName}\n\nA plugin for DeepSeek Harness.\n`)

  console.log(`\x1b[32m✔ Plugin ${pluginName} created successfully!\x1b[0m\n`)
  console.log('Next steps:')
  console.log(`  cd ${pluginName}`)
  console.log('  pnpm install')
  console.log('  pnpm run build\n')
}

function runCheck() {
  printBanner()
  const targetDir = resolve(process.cwd(), args[1] || '.')
  console.log(`Auditing DSH plugin compliance in: \x1b[36m${targetDir}\x1b[0m\n`)

  let passed = 0
  let failed = 0

  function pass(msg) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`)
    passed++
  }

  function fail(msg) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`)
    failed++
  }

  // Check package.json
  const pkgPath = resolve(targetDir, 'package.json')
  if (!existsSync(pkgPath)) {
    fail('package.json not found.')
    process.exit(1)
  }
  pass('package.json exists.')

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

    // Check dsh.bundle
    if (pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch) {
      pass(`dsh.bundle manifest defined (patch: ${pkg.dsh.bundle.patch}).`)
    } else {
      fail('Missing dsh.bundle manifest in package.json (needed for dsh plugin add).')
    }

    // Check keywords
    if (pkg.keywords && pkg.keywords.includes('dsh-plugin')) {
      pass('Keywords contain "dsh-plugin".')
    } else {
      fail('package.json keywords should include "dsh-plugin" for market discovery.')
    }

    // Check dependencies (prevent bundling runtime)
    const deps = pkg.dependencies || {}
    const leaked = Object.keys(deps).filter(k => k.startsWith('@deepseek-ai/'))
    if (leaked.length === 0) {
      pass('No @deepseek-ai/* packages leaked into runtime dependencies.')
    } else {
      fail(`Found @deepseek-ai packages in dependencies: ${leaked.join(', ')}. Move them to peerDependencies or devDependencies.`)
    }
  } catch (err) {
    fail(`Failed to parse package.json: ${err.message}`)
  }

  // Check cordis.patch.yml
  const patchPath = resolve(targetDir, 'cordis.patch.yml')
  if (existsSync(patchPath)) {
    pass('cordis.patch.yml exists.')
  } else {
    fail('cordis.patch.yml is missing (required by dsh.bundle).')
  }

  // Check src/index.ts
  const srcPath = resolve(targetDir, 'src/index.ts')
  if (existsSync(srcPath)) {
    const srcCode = readFileSync(srcPath, 'utf8')
    if (srcCode.includes('apply')) {
      pass('src/index.ts exists and exports apply(ctx).')
    } else {
      fail('src/index.ts does not export an apply() lifecycle function.')
    }
  } else {
    fail('src/index.ts entry file not found.')
  }

  console.log(`\nAudit finished: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m.\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

switch (command) {
  case 'install':
    runInstall()
    break
  case 'status':
    runStatus()
    break
  case 'init':
    runInit()
    break
  case 'check':
    runCheck()
    break
  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp()
    break
}
