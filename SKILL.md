---
name: dsh-plugin-dev
description: DeepSeek Harness (DSH) 插件、扩展与技能开发权威规范。当需要为 DSH 编写自定义工具 (Tool)、拦截钩子 (Hook)、UI 扩展、服务提供方或打包发布 DSH 插件时使用。提供官方 Cordis 微内核架构契约、执行流水线、隔离调试与质量校验 SOP。
disable-model-invocation: false
user-invocable: true
when-to-use: 当任务涉及为 DeepSeek Harness (DSH) 开发插件、编写自定义工具、排查 Cordis 容器依赖注入或进行打包发布时使用。
---

# DeepSeek Harness (DSH) 插件与扩展开发权威技能指南

本技能向 AI 编程助手交付开发、调试、测试与发布 DeepSeek Harness 插件的完整官方架构契约与标准作业程序（SOP）。

---

## 1. 核心铁律（违反必翻车）

1. **绝对隔离测试**：严禁直接在用户的日常宿主目录 `~/.dsh` 中进行测试或写入配置文件。必须通过 `DSH_HOME="$(pwd)/.dsh-dev"` 配合本地 `.dsh-dev/` 目录进行隔离开发与冒烟测试。
2. **严格外部化依赖**：在构建打包脚本（esbuild / tsup）中，**必须**将所有 `@deepseek-ai/*` 命名空间及其衍生包（`@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools` 等）声明为 `external`。绝不能将运行时内置包打包进发布产物中。
3. **规范输出与展示分离**：工具主体 `execute` 必须返回符合 `output.schema` 的纯数据结构；面向模型的自然语言由 `output.render` 交付；UI 客户端卡片由纯函数 `presentCall` / `presentResult` 交付。严禁在 `execute` 中直接返回格式化自然语言。
4. **纯函数卡片原则**：`presentCall` 和 `presentResult` 会在实时输出和历史日志回放时重复执行，严禁在其中进行 I/O 操作、异步读取或调用时钟/随机数。
5. **协作式取消响应**：所有异步 I/O、HTTP 请求与外部子进程执行必须透传并监听 `exec.signal`，确保超时或用户取消操作能被及时终止。

---

## 2. 任务路由与决策树

根据用户的具体需求，查阅对应参考文档与执行 SOP：

| 开发任务 | 核心入口 | 关键规范参考 |
|---|---|---|
| **从零初始化插件项目** | [`playbooks/01-scaffolding.md`](playbooks/01-scaffolding.md) | 包含目录骨架、`package.json`、`tsconfig.json` 与 esbuild 外部化配置 |
| **开发模型工具 (Tool)** | [`playbooks/02-tool-plugin.md`](playbooks/02-tool-plugin.md) | 参阅 [`references/tools-contract.md`](references/tools-contract.md) 查看参数校验与卡片规范 |
| **开发权限门禁 / 安全拦截 (Hook)** | [`playbooks/03-hook-plugin.md`](playbooks/03-hook-plugin.md) | 参阅 [`references/execution-pipeline.md`](references/execution-pipeline.md) 查看流水线 5 阶段 |
| **编写单元测试 (Unit Test)** | [`references/plugin-testing.md`](references/plugin-testing.md) | 基于 Node 原生测试运行器的 Mock 上下文与取消测试 |
| **扩展配方与子代理 (Presets/Subagents)** | [`references/presets-and-subagents.md`](references/presets-and-subagents.md) | 包含 `ctx.preset` 注册与 `ctx.subagents` 隔离容器驱动 |
| **开发 UI 或事件流监听器** | [`references/ui-and-events.md`](references/ui-and-events.md) | 包含 `session/event` 监听、`assistant/chunk` 流式处理与 `followup`/`steer` 驱动 |
| **开发/组织 DSH 技能包 (Skills)** | [`references/skills-subsystem.md`](references/skills-subsystem.md) | 包含 6 级 Rank 发现优先级、`<name>/SKILL.md` 规范与会话目录按需披露机制 |
| **本地运行与隔离测试** | [`playbooks/04-isolated-dev.md`](playbooks/04-isolated-dev.md) | 包含 `.dsh-dev` 目录与 `cordis.yml` 装配清单配置 |
| **构建校验与发版前质检** | [`playbooks/05-verification.md`](playbooks/05-verification.md) | 包含 TypeScript 检查、产物审查、外部依赖泄漏排查与发布清单 |
| **生态目录收录与市场提交** | [`playbooks/06-ecosystem-listings.md`](playbooks/06-ecosystem-listings.md) | 包含 `awesome-dsh-plugin` 与 `dsh-market` 自动化收录提交 |

---

## 3. 标准开发工作流（Agent 必须遵循的步骤）

当用户要求「写一个 DSH 插件」时，Agent 必须按以下顺序推展：

```text
[需求确认] -> [SOP 01: 创建脚手架] -> [SOP 02/03: 实现功能] -> [SOP 04: 隔离测试] -> [SOP 05: 质检与交付]
```

1. **第一步（选型与脚手架）**：
   - 确定是纯后台插件（Host-only）还是全栈插件（Host + Client）。
   - 按 `playbooks/01-scaffolding.md` 生成基础工程结构，配置好构建脚本与 `@deepseek-ai/*` 外部化规则。
2. **第二步（功能实现）**：
   - 编写 `src/index.ts`，严格遵循 Cordis 插件规范（`name`, `inject`, `apply`）。
   - 工具插件遵循 `defineTool` 的强类型输入与输出 Schema。
3. **第三步（本地隔离验证）**：
   - 运行构建生成 `dist/index.js`。
   - 按 `playbooks/04-isolated-dev.md` 在本地 `.dsh-dev` 中编写最小测试配置并验证加载，确保没有污染宿主。
4. **第四步（发版前质检）**：
   - 按 `playbooks/05-verification.md` 执行 `pnpm verify` 和 `pack --dry-run`，确认依赖无泄漏后向用户交付。
