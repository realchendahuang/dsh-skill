# DSH 插件打包与发布契约（Packaging & Bundling Rules）

为了保证插件能在 DSH 容器中平稳挂载，必须遵循严格的构建外部化与包元数据规范。

## 1. 宿主与前端双端分离（Host vs Client Dual Runtime）

DSH 插件分为两层运行环境：

| 环境 | 运行环境 | 职责 | 产物规范 |
|---|---|---|---|
| **Host** | Node.js 进程 | 运行在 Cordis 微内核中，访问文件系统、子进程、注册工具和钩子 | 单文件 CJS/ESM，`dist/index.js` |
| **Client** | 浏览器 Web 客户端 | 运行在 DSH 前端界面，负责渲染自定义 UI 面板、Conversation Node | 浏览器端 Bundle，`dist/client.js` |

*如果插件只是后端功能（纯工具、API 适配器、权限钩子），声明为纯 Host 插件（Headless）即可，无需编译 Client 产物。*

## 2. 外部依赖规则（External Dependencies 铁律）

在编写 `esbuild.config.mjs` 或 `tsup.config.ts` 构建脚本时，必须将所有 `@deepseek-ai/*` 命名空间下的包声明为 `external`：

```javascript
// esbuild 示例
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/index.js',
  format: 'esm',
  // 必须外部化！严禁打入产物包！
  external: [
    '@deepseek-ai/*',
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-tools',
    '@deepseek-ai/dsh-session',
    '@deepseek-ai/dsh-llm',
  ],
})
```

### 为什么必须外部化？
- DSH 宿主在启动时已预载了完整的核心依赖树。
- 如果插件把 `@deepseek-ai/cordis` 或 `@deepseek-ai/dsh-tools` 打包进自己的 `dist`，会导致**原型链断裂、Symbol 实例不相等**（例如 `exec.token` 比对失效、`instanceof` 判定失败），导致工具无法注册或会话崩溃。

## 3. `package.json` 元数据规范

发布到 npm 或 GitHub 的插件需要符合以下元数据字段要求：

```json
{
  "name": "dsh-plugin-example",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
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
    "typescript": "^5.5.0",
    "esbuild": "^0.23.0"
  }
}
```

- **`files` 白名单**：确保只打包 `dist`、`README.md` 与 `LICENSE`，严禁将源码 `src/` 或测试文件无意推到发布包中。
- **`keywords`**：包含 `dsh-plugin` 与 `deepseek-harness`，以便被各大 DSH 插件市场与目录自动索引收录。
