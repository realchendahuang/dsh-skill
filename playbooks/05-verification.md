# SOP 05: 质量校验与发版前检查（Verification Checklist）

在将插件发布到 npm 或提交到 DSH 插件市场之前，必须严格执行全套质量卡点检查。

## 1. 自动化校验流程

运行项目配置的校验脚本：
```bash
# 1. 严格 TypeScript 类型检查
pnpm typecheck

# 2. 生产构建打包
pnpm build

# 3. 产物完整性与体积审查
pnpm pack --dry-run
```

## 2. 产物包内容审查（`pnpm pack --dry-run`）

审查输出的文件清单，确保满足以下铁律：
- [ ] 包含了编译后的 `dist/index.js`（以及 `dist/index.d.ts`）。
- [ ] 包含了 `README.md` 与 `LICENSE`。
- [ ] **绝对没有**将 `src/` 源码、测试文件、`scripts/` 或 `.dsh-dev` 混入安装包。
- [ ] 包体积在合理范围内（未打包多余的第三方大库）。

## 3. 依赖泄漏排查（反编译检查）

检查 `dist/index.js`，搜索确认：
- 没有将 `@deepseek-ai/cordis` 打包进单文件内部（必须保持外部引用 `import ... from '@deepseek-ai/cordis'`）。
- 没有遗漏任何未外部化的 DSH 运行时内置包。

## 4. GitHub Actions CI 与 npm 发版

建议在 `.github/workflows/release.yml` 中配置 npm Trusted Publishing，仅通过推送版本 Tag 触发自动发版：
- 格式规范：`v0.1.0`
- 确保 package.json 中的 `version` 与 Tag 一致。
