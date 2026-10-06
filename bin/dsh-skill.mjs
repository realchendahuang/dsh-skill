#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0] || 'help'

const home = homedir()

const useColor = (Boolean(process.stdout.isTTY) || Boolean(process.env.FORCE_COLOR)) && !process.env.NO_COLOR
const paint = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text)
const green = text => paint(32, text)
const yellow = text => paint(33, text)
const red = text => paint(31, text)
const cyan = text => paint(36, text)

const TARGETS = {
  dsh: resolve(process.env.DSH_HOME || resolve(home, '.dsh'), 'skills/dsh-plugin-dev'),
  claude: resolve(home, '.claude/skills/dsh-plugin-dev'),
  codex: resolve(home, '.agents/skills/dsh-plugin-dev'),
  antigravity: resolve(home, '.gemini/config/skills/dsh-plugin-dev'),
}

const CLI_SHIM_PATHS = [resolve(home, '.local/bin/dsh-skill'), resolve(home, '.local/bin/dsh-skill.cmd')]

function printBanner() {
  console.log(cyan(`
   ___  _____ __  __   ____  __ ___ __   __
  / _ \\/ __/ // / /  / __/ / //_// // / / /
 / // /\\ \\/ _  / /__ \\ \\  / ,<  / // /_/ /_
/____/___/_//_/____/___/ /_/|_|/_//_/____(_)
  DeepSeek Harness Plugin & Skill Development Kit
  `))
}

function printHelp() {
  printBanner()
  console.log(`
Usage:
  dsh-skill install [target]            Install skill to agent environments & link CLI
  dsh-skill status                      Check installation status across platforms
  dsh-skill init <name> [--type <t>]    Scaffold a DSH plugin (tool, hook, or skill)
  dsh-skill check [path]                Verify DSH plugin compliance and rules
  dsh-skill update                      Refresh installed skills and CLI across platforms
  dsh-skill uninstall                   Remove skill from all platforms and unlink CLI
  dsh-skill help                        Show this help message

Options for init:
  --type tool       Scaffold a standard Tool Plugin (default)
  --type hook       Scaffold an Execution Guard & Security Hook Plugin
  --type skill      Scaffold an Agent Skill Bundle

Install Targets:
  all           Install to all detected platforms (default)
  dsh           Install to DeepSeek Harness (~/.dsh/skills/dsh-plugin-dev)
  claude        Install to Claude Code (~/.claude/skills/dsh-plugin-dev)
  codex         Install to OpenAI Codex / Cursor (~/.agents/skills/dsh-plugin-dev)
  antigravity   Install to Google Antigravity (~/.gemini/config/skills/dsh-plugin-dev)
`)
}

function printVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'))
    console.log(pkg.version)
  } catch {
    console.error('Unable to determine version (package.json not found).')
    process.exit(1)
  }
}

// Refresh installs wipe the destination to avoid stale leftover files,
// but only when it is a directory this tool owns (marked by SKILL.md)
// and never the repository itself.
function cleanStaleInstall(destPath) {
  if (resolve(destPath) === rootDir) return
  if (!existsSync(destPath)) return
  if (!existsSync(resolve(destPath, 'SKILL.md'))) return
  rmSync(destPath, { recursive: true, force: true })
}

function installTo(targetName, destPath) {
  try {
    cleanStaleInstall(destPath)
    mkdirSync(destPath, { recursive: true })
    const itemsToCopy = ['SKILL.md', 'references', 'playbooks', 'templates', 'bin']
    for (const item of itemsToCopy) {
      const src = resolve(rootDir, item)
      const dst = resolve(destPath, item)
      if (src === dst) {
        continue
      }
      if (existsSync(src)) {
        cpSync(src, dst, { recursive: true })
      }
    }
    console.log(green(`✔ Installed to ${targetName}:`) + ` ${destPath}`)
    return true
  } catch (err) {
    console.error(red(`✖ Failed to install to ${targetName}:`) + ` ${err.message}`)
    return false
  }
}

function installCliShim() {
  try {
    const localBin = resolve(home, '.local/bin')
    mkdirSync(localBin, { recursive: true })
    const primaryDir = TARGETS.codex || TARGETS.dsh
    const scriptTarget = resolve(primaryDir, 'bin/dsh-skill.mjs')

    if (process.platform === 'win32') {
      const shimPath = resolve(localBin, 'dsh-skill.cmd')
      const shimContent = [
        '@echo off',
        'where node >nul 2>nul',
        'if %errorlevel% neq 0 (',
        '  echo Error: Node.js is required to run dsh-skill CLI.',
        '  exit /b 1',
        ')',
        `node "${scriptTarget}" %*`,
        '',
      ].join('\r\n')
      writeFileSync(shimPath, shimContent)
      console.log(green('✔ CLI executable linked to:') + ` ${shimPath}`)
    } else {
      const shimPath = resolve(localBin, 'dsh-skill')
      const shimContent = `#!/usr/bin/env bash
if command -v node >/dev/null 2>&1; then
  exec node "${scriptTarget}" "$@"
else
  echo "Error: Node.js is required to run dsh-skill CLI." >&2
  exit 1
fi
`
      writeFileSync(shimPath, shimContent, { mode: 0o755 })
      console.log(green('✔ CLI executable linked to:') + ` ${shimPath}`)
    }
    return true
  } catch (err) {
    console.error(red('✖ Failed to install CLI shim:') + ` ${err.message}`)
    return false
  }
}

function runInstall() {
  printBanner()
  const targetArg = (args[1] || 'all').toLowerCase()
  let ok = true

  if (targetArg === 'all') {
    console.log('Installing dsh-plugin-dev skill to all platforms...\n')
    for (const [name, path] of Object.entries(TARGETS)) {
      ok = installTo(name, path) && ok
    }
    ok = installCliShim() && ok
  } else if (TARGETS[targetArg]) {
    console.log(`Installing dsh-plugin-dev skill to ${targetArg}...\n`)
    ok = installTo(targetArg, TARGETS[targetArg]) && ok
    ok = installCliShim() && ok
  } else {
    console.error(red(`Unknown target: ${targetArg}`))
    console.log('Available targets: all, dsh, claude, codex, antigravity')
    process.exit(1)
  }

  if (!ok) {
    console.error(`\n${red('Installation finished with errors.')} Please review the output above.\n`)
    process.exit(1)
  }

  console.log(`\n${cyan('Installation complete!')} Your AI agent now has full mastery over DSH plugin development.\n`)
}

function shimInstalled() {
  return CLI_SHIM_PATHS.some(path => existsSync(path))
}

function runStatus() {
  printBanner()
  console.log('Skill Installation Status across platforms:\n')
  for (const [name, path] of Object.entries(TARGETS)) {
    const isInstalled = existsSync(resolve(path, 'SKILL.md'))
    const statusText = isInstalled ? green('Installed') : yellow('Not Installed')
    console.log(`- ${name.padEnd(12)}: ${statusText} (${path})`)
  }
  const shimPath = CLI_SHIM_PATHS.find(path => existsSync(path)) || CLI_SHIM_PATHS[0]
  const shimText = shimInstalled() ? green('Installed') : yellow('Not Installed')
  console.log(`- ${'cli (PATH)'.padEnd(12)}: ${shimText} (${shimPath})`)
  console.log('')
}

function resolveTemplate(templateDirName) {
  let templateDir = resolve(rootDir, templateDirName)
  if (existsSync(resolve(templateDir, 'src/index.ts')) || existsSync(resolve(templateDir, 'SKILL.md'))) {
    return templateDir
  }
  for (const candPath of Object.values(TARGETS)) {
    const cand = resolve(candPath, templateDirName)
    if (existsSync(resolve(cand, 'src/index.ts')) || existsSync(resolve(cand, 'SKILL.md'))) {
      return cand
    }
  }
  return null
}

function failInit(message) {
  console.error(red('Error:') + ` ${message}`)
  process.exit(1)
}

function runInit() {
  printBanner()
  const pluginName = args[1]
  if (!pluginName) {
    failInit('Please provide a plugin name.')
  }

  // npm package naming rules: letters, digits and - _ . ~ (no leading . or _)
  if (!/^[a-z0-9][a-z0-9-._~]*$/i.test(pluginName)) {
    failInit(`"${pluginName}" is not a valid plugin name. Use letters, digits and - _ . ~ (must start with a letter or digit).`)
  }

  // Parse type flag: --type <type> or --template <type>
  let templateType = 'tool'
  const typeIndex = args.findIndex(a => a === '--type' || a === '--template' || a === '-t')
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    templateType = args[typeIndex + 1].toLowerCase()
  }
  if (!['tool', 'hook', 'skill'].includes(templateType)) {
    failInit(`Unknown template type "${templateType}". Available types: tool, hook, skill.`)
  }

  const targetDir = resolve(process.cwd(), pluginName)
  if (existsSync(targetDir)) {
    failInit(`Directory ${pluginName} already exists.`)
  }

  console.log(`Scaffolding new DSH ${templateType} in ${cyan(pluginName)}...\n`)

  if (templateType === 'skill') {
    const templateSkill = resolveTemplate('templates/skill-bundle')
    if (!templateSkill) {
      failInit('Skill template not found (templates/skill-bundle/SKILL.md). Please reinstall dsh-skill.')
    }
    mkdirSync(targetDir, { recursive: true })
    mkdirSync(resolve(targetDir, 'references'), { recursive: true })
    mkdirSync(resolve(targetDir, 'playbooks'), { recursive: true })
    const skillContent = readFileSync(resolve(templateSkill, 'SKILL.md'), 'utf8')
      .replace(/<skill-name>/g, pluginName)
    writeFileSync(resolve(targetDir, 'SKILL.md'), skillContent)
    console.log(green(`✔ Skill bundle ${pluginName} created successfully!`) + '\n')
    return
  }

  // tool or hook plugin
  const templateDirName = templateType === 'hook' ? 'templates/hook-plugin' : 'templates/tool-plugin'
  const templateDir = resolveTemplate(templateDirName)
  if (!templateDir) {
    failInit(`Template not found (${templateDirName}/src/index.ts). Please reinstall dsh-skill.`)
  }

  mkdirSync(resolve(targetDir, 'src'), { recursive: true })
  mkdirSync(resolve(targetDir, 'scripts'), { recursive: true })

  // 1. Copy template files
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
      build: 'node scripts/build.mjs && tsc --emitDeclarationOnly',
      typecheck: 'tsc --noEmit',
      verify: 'npm run typecheck && npm run build',
    },
    keywords: ['dsh-plugin', 'deepseek-harness'],
    peerDependencies: {
      '@deepseek-ai/cordis': '>=1.0.0',
      ...(templateType === 'tool' ? { '@deepseek-ai/dsh-tools': '>=1.0.0' } : {}),
    },
    devDependencies: {
      '@deepseek-ai/cordis': '^1.0.0',
      ...(templateType === 'tool' ? { '@deepseek-ai/dsh-tools': '^1.0.0' } : {}),
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
  const externalList = [
    "'@deepseek-ai/*'",
    "'@deepseek-ai/cordis'",
    ...(templateType === 'tool' ? ["'@deepseek-ai/dsh-tools'"] : []),
  ]
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
    ${externalList.join(',\n    ')}
  ],
})

console.log('Build completed: dist/index.js')
`
  writeFileSync(resolve(targetDir, 'scripts/build.mjs'), buildScript)

  // 6. Write README.md
  writeFileSync(resolve(targetDir, 'README.md'), `# ${pluginName}\n\nA ${templateType} plugin for DeepSeek Harness.\n`)

  console.log(green(`✔ Plugin ${pluginName} (${templateType}) created successfully!`) + '\n')
  console.log('Next steps:')
  console.log(`  cd ${pluginName}`)
  console.log('  pnpm install')
  console.log('  pnpm run build\n')
}

function runCheck() {
  printBanner()
  const targetDir = resolve(process.cwd(), args[1] || '.')
  console.log(`Auditing DSH plugin compliance in: ${cyan(targetDir)}\n`)

  let passed = 0
  let failed = 0

  function pass(msg) {
    console.log(`${green('[PASS]')} ${msg}`)
    passed++
  }

  function fail(msg) {
    console.log(`${red('[FAIL]')} ${msg}`)
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

  // Check tsconfig.json
  const tsconfigPath = resolve(targetDir, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    pass('tsconfig.json exists.')
  } else {
    fail('tsconfig.json not found.')
  }

  // Check src/index.ts
  const srcPath = resolve(targetDir, 'src/index.ts')
  if (existsSync(srcPath)) {
    const srcCode = readFileSync(srcPath, 'utf8')
    const applyPattern = /export\s+(?:default\s+)?(?:async\s+)?function\s+apply\b|export\s+(?:const|let|var)\s+apply\b/
    if (applyPattern.test(srcCode)) {
      pass('src/index.ts exists and exports apply(ctx).')
    } else {
      fail('src/index.ts does not export an apply() lifecycle function.')
    }
  } else {
    fail('src/index.ts entry file not found.')
  }

  // Check build script externalization if exists
  const buildMjsPath = resolve(targetDir, 'scripts/build.mjs')
  if (existsSync(buildMjsPath)) {
    const buildCode = readFileSync(buildMjsPath, 'utf8')
    if (buildCode.includes('@deepseek-ai/*')) {
      pass('scripts/build.mjs correctly externalizes @deepseek-ai/* packages.')
    } else {
      fail('scripts/build.mjs does not declare @deepseek-ai/* as external.')
    }
  }

  console.log(`\nAudit finished: ${green(`${passed} passed`)}, ${red(`${failed} failed`)}.\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

function runUpdate() {
  printBanner()
  console.log('Refreshing installed skills across all platforms...\n')
  let ok = true
  for (const [name, path] of Object.entries(TARGETS)) {
    if (existsSync(path)) {
      ok = installTo(name, path) && ok
    }
  }
  ok = installCliShim() && ok
  if (!ok) {
    console.error(`\n${red('Update finished with errors.')} Please review the output above.\n`)
    process.exit(1)
  }
  console.log(`\n${cyan('Update completed successfully!')}\n`)
}

function runUninstall() {
  printBanner()
  console.log('Uninstalling dsh-plugin-dev from local platforms...\n')
  let count = 0
  for (const [name, path] of Object.entries(TARGETS)) {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true })
      console.log(green(`✔ Removed from ${name}:`) + ` ${path}`)
      count++
    }
  }
  for (const shimPath of CLI_SHIM_PATHS) {
    if (existsSync(shimPath)) {
      rmSync(shimPath, { force: true })
      console.log(green('✔ Removed CLI executable:') + ` ${shimPath}`)
      count++
    }
  }
  console.log(`\n${cyan('Uninstallation complete!')} Cleaned up ${count} items.\n`)
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
  case 'update':
    runUpdate()
    break
  case 'uninstall':
    runUninstall()
    break
  case 'version':
  case '--version':
  case '-v':
    printVersion()
    break
  case 'help':
  case '--help':
  case '-h':
    printHelp()
    break
  default:
    console.error(red(`Unknown command: ${command}`) + '\n')
    printHelp()
    process.exit(1)
}
