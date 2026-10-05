# dsh-skill · DeepSeek Harness 官方规范开发技能库

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/Runtime-DeepSeek%20Harness-brightgreen.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/realchendahuang/dsh-skill/pulls)

为 AI 编程助手（Claude Code、Codex、Antigravity、Cursor 及 DSH 自身）提供权威的 DeepSeek Harness 插件与扩展开发规范。

---

## 为什么需要这个 Skill？

让编程 Agent 写一个 DSH 插件时，最大的痛点往往是 **AI 在缺少工程约束的情况下到处碰运气**：

- **微内核与注入机制盲猜**：不知道底层基于 Cordis 容器，漏写 `inject` 或搞错全局与局部作用域。
- **打包配置翻车**：不知道 `@deepseek-ai/*` 属于运行时注入的内置依赖，直接把 `@deepseek-ai/cordis` 打包进单文件产物，导致原型链断裂和 Symbol 匹配失效。
- **宿主环境污染**：直接向日常使用的 `~/.dsh` 目录安装测试，把开发者的主配置搞崩。
- **输出与卡片混淆**：把面向模型的自然语言和 UI 客户端卡片混写在工具主体中，无法在流式生成和会话日志中干净回放。

**本仓库把官方源码中的架构契约、执行流水线与隔离开发测试流程，完整沉淀为标准 Agent 技能。装上之后，AI 编程助手将严格按规范输出代码，不再盲猜。**

---

## 包含的官方规范与资产

```text
dsh-skill/
├── SKILL.md                 # 核心技能入口（Agent 读取此文件路由全流程）
├── references/              # 官方架构硬契约（基于 DeepSeek Harness 源码提炼）
│   ├── cordis-runtime.md    # Cordis 微内核、apply 契约、作用域与生命周期 Disposer
│   ├── tools-contract.md    # defineTool 规范、Schema 校验、纯函数 UI 卡片与超时取消
│   ├── execution-pipeline.md # 工具执行 5 阶段（pre-execute、guard、execute、post-execute、result）
│   ├── skills-subsystem.md  # 原生 Skills 体系、6 级 Rank 发现优先级与两阶段按需披露机制
│   ├── ui-and-events.md     # session/event 实时流式事件、assistant/chunk 与反向驱动
│   └── packaging-rules.md   # 外部化铁律、Host/Client 双端规范与 package.json 元数据
├── playbooks/               # Agent 标准作业程序（SOP）
│   ├── 01-scaffolding.md    # 从零初始化插件工程脚手架
│   ├── 02-tool-plugin.md    # 编写标准模型工具插件
│   ├── 03-hook-plugin.md    # 编写权限门禁与安全拦截钩子
│   ├── 04-isolated-dev.md   # .dsh-dev 本地隔离调试与冒烟测试
│   └── 05-verification.md   # 发版前严格质量质检与依赖排查清单
└── templates/               # 经过验证的最小可用模版代码
    ├── tool-plugin/         # 基础工具插件骨架
    ├── hook-plugin/         # 权限拦截门禁骨架
    └── skill-bundle/        # 标准技能包骨架
```

---

## 如何安装与使用

### 1. 在 DeepSeek Harness 中使用（原生支持）

#### 全局安装（对所有项目生效）：
```bash
git clone https://github.com/realchendahuang/dsh-skill.git "${DSH_HOME:-$HOME/.dsh}/skills/dsh-plugin-dev"
```

#### 项目级安装（仅对当前仓库生效）：
```bash
git clone https://github.com/realchendahuang/dsh-skill.git .dsh/skills/dsh-plugin-dev
```

### 2. 在 Claude Code 中使用

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/realchendahuang/dsh-skill.git ~/.claude/skills/dsh-plugin-dev
```

### 3. 在 OpenAI Codex 中使用

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/realchendahuang/dsh-skill.git ~/.agents/skills/dsh-plugin-dev
```

### 4. 在 Google Antigravity 中使用

```bash
mkdir -p ~/.gemini/config/skills
git clone https://github.com/realchendahuang/dsh-skill.git ~/.gemini/config/skills/dsh-plugin-dev
```

---

## 体验示例

安装后，直接对你的 AI 编程助手输入：

```text
帮我用官方规范开发一个 DSH 工具插件 dsh-curl-tools，提供发送 HTTP GET 请求的工具，并在本地隔离环境中完成测试。
```

Agent 会自动识别并加载本技能：
1. 建立符合规范的 `package.json` 并配置 esbuild 外部化依赖；
2. 编写基于 `defineTool` 的强类型参数校验与 UI 展示卡片；
3. 在 `.dsh-dev/` 隔离环境中启动测试，绝不修改日常配置；
4. 运行类型检查与产物审查后向你交付。

---

## 相关生态

- [DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)
- [dsh-guide (一条消息的旅行 · 交互式源码解析)](https://chendahuang.com/dsh)

---

## License

[MIT License](LICENSE) · Copyright (c) 2026 [realchendahuang](https://github.com/realchendahuang)
