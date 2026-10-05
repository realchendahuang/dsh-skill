# SOP 06: 生态目录收录与市场提交（Ecosystem Listings）

开发完成并验证通过的 DSH 插件，应提交到官方与社区目录，以便开发者在客户端中一键搜索与安装。

## 1. 核心发现渠道与市场

| 渠道 | 类型 | 发现与收录方式 |
|---|---|---|
| **dsh-market** | DSH 内置应用市场 | 自动同步 `awesome-dsh-plugin` 清单，用户在 DSH 设置中一键安装 |
| **awesome-dsh-plugin** | 官方社区精选目录 | 向 GitHub 仓库提交收录 PR（单 YAML 文件） |
| **dsh-find-plugin** | Agent 对话搜索插件 | 自动爬取包含 `dsh-plugin` GitHub Topic 的可用插件 |
| **npm Registry** | 全球包管理器 | 带 `dsh-plugin` keyword 发布到 npm |

---

## 2. 提交到 `awesome-dsh-plugin` 标准流程

官方收录由脚本自动解析，每个插件只需要在 `data/plugins/` 下添加**单一 YAML 文件**：

### 步骤 1：确认满足收录门槛
- [ ] 仓库 `package.json` 声明了 `dsh.bundle: { "patch": "./cordis.patch.yml" }`。
- [ ] 仓库根目录存在真实的 `cordis.patch.yml`。
- [ ] 仓库包含真实可用代码（拒绝纯 README 或占位仓库）。
- [ ] 为 GitHub 仓库添加了 `dsh-plugin` 标签（Topic）。
- [ ] 仓库创建满 1 天（CI 自动校验防脚本刷榜）。

### 步骤 2：创建条目文件
Fork `https://github.com/awesome-dsh-plugin/awesome-dsh-plugin`，创建文件：
`data/plugins/<owner>__<repo>.yml`

示例：`data/plugins/realchendahuang__dsh-skill.yml`
```yaml
url: https://github.com/realchendahuang/dsh-skill
name: realchendahuang/dsh-skill
category: skill
description:
  en: Official plugin & skill development kit for DeepSeek Harness.
  zh: DeepSeek Harness 官方规范插件与技能开发库。
```

> **注意**：
> - `description.en` 必须以句号（`.`）结尾；如果描述中包含 `: `（冒号加空格），必须用单引号包裹字符串。
> - `category` 可选值：`skill`、`tools`、`ui`、`model`、`workflow`、`git`、`dev`、`security`、`session` 等。

### 步骤 3：提交 PR
提交 PR 并等待自动化 CI 检查合并。合并后，DSH 用户即可通过 `dshmarket` 搜索到你的插件。
