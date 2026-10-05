# SOP 01: 创建 DSH 插件工程脚手架

本手册指导 Agent 如何为用户从零初始化一个标准的 DeepSeek Harness 插件项目。

## 1. 确定项目类型与命名

- **包名规则**：采用 `dsh-<slug>` 或 `@scope/dsh-<slug>` 格式（例如 `dsh-git-tools`、`dsh-auto-reviewer`）。
- **运行模式判断**：
  - 纯功能插件（命令行工具、权限守卫、API 集成）：使用 `host-only` 纯后台架构，不引入前端构建复杂度。
  - 带独立交互页面的插件：包含 Host 与 Client 双入口。

## 2. 目录骨架初始化

执行以下目录初始化：

```text
dsh-my-plugin/
├── src/
│   └── index.ts          # Host 入口 (Cordis 插件)
├── scripts/
│   └── build.mjs         # esbuild 打包脚本
├── .gitignore
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## 3. 标准配置模版

### `package.json`
```json
{
  "name": "dsh-my-plugin",
  "version": "0.1.0",
  "description": "My plugin for DeepSeek Harness",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "node scripts/build.mjs",
    "typecheck": "tsc --noEmit",
    "verify": "pnpm typecheck && pnpm build"
  },
  "keywords": [
    "dsh-plugin",
    "deepseek-harness"
  ],
  "peerDependencies": {
    "@deepseek-ai/cordis": ">=1.0.0",
    "@deepseek-ai/dsh-tools": ">=1.0.0"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^1.0.0",
    "@deepseek-ai/dsh-tools": "^1.0.0",
    "esbuild": "^0.23.0",
    "typescript": "^5.5.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

### `scripts/build.mjs`
```javascript
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/index.js',
  format: 'esm',
  sourcemap: true,
  external: [
    '@deepseek-ai/*',
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-tools',
  ],
})
console.log('Build completed successfully.')
```
