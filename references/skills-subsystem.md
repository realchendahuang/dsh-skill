# DSH Skills 子系统与多端发现机制

DeepSeek Harness 原生具备完备的 Skills 子系统（由 `@deepseek-ai/dsh-skill` 提供服务）。它负责发现、校验可复用的指令包，并按需向模型动态披露。

## 1. 发现根目录与优先级判定（Discovery Priority）

DSH 本地提供方按严格的数值 Rank 从小到大扫描各根目录，**低数值优先（数字越小优先级越高）**：

| Rank | 来源标识 | 物理路径 | 适用场景 |
|---|---|---|---|
| **100** | `project-dsh` | `<projectRoot>/.dsh/skills` | 当前仓库专用的 DSH 专有技能 |
| **200** | `project-agents` | `<projectRoot>/.agents/skills` | 跨 Agent 共享的项目级标准技能目录 |
| **300** | `custom` | `Config.customSkillDirs` | 用户自定义配置目录 |
| **400** | `user-dsh` | `~/.dsh/skills` | 开发者本机全局生效的 DSH 技能 |
| **500** | `user-agents` | `~/.agents/skills` | 开发者本机全局跨 Agent 技能 |
| **600** | `bundled` | `Config.bundledSkillDir` | DSH 随包内置分发的技能 |

> **覆盖规则**：同名技能以高优先级（Rank 较小者）为准。项目内的 `.dsh/skills` 会自动覆盖全局 `~/.dsh/skills` 中的同名条目。

## 2. 技能命名与文件结构规范

- **命名规范**：必须符合 kebab-case（正则 `^[a-z0-9]+(?:-[a-z0-9]+)*$`），例如 `dsh-plugin-dev`、`db-migrate`。
- **形态支持**：
  1. **目录包形态（推荐）**：`<name>/SKILL.md`，可附带 `references/`、`scripts/` 等相对资源；
  2. **单文件平铺形态**：`<name>.md`，适用于无外挂资源的极简指令。
  *(注：不支持深层嵌套递归检索)*

## 3. YAML Frontmatter 元数据契约

技能入口文件顶部支持以下规范字段：

```markdown
---
name: dsh-plugin-dev
description: DeepSeek Harness 插件与扩展开发权威规范。开发、调试、测试与发布 DSH 插件时使用。
disable-model-invocation: false
user-invocable: true
when-to-use: 当用户要求开发 DSH 插件、排查 Cordis 服务注入或编写自定义工具时。
---

# 技能正文...
```

- `description`：必填。模型在技能目录中看到的简要说明（默认上限 500 字符）。
- `disable-model-invocation`：设为 `true` 时，模型自主调用列表中不呈现，仅能由人类用户手动触发。
- `user-invocable`：设为 `false` 时，仅供模型按需调用，隐藏在人类快捷指令之外。

## 4. 动态上下文注入机制（Token 优化设计）

DSH 为了避免将所有技能正文无脑塞入上下文导致 Token 爆炸与 KV Cache 失效，采用了**两阶段按需披露机制**：

1. **第一阶段：轻量目录注入**
   在会话的第一步，DSH 通过 `<system-reminder>` 向模型注入 `<available_skills>` 列表，仅包含每个技能的 `name` 与 XML 转义后的 `description`，**绝对不包含正文和绝对路径**。
2. **第二阶段：按需加载 (`skill` 工具)**
   当模型识别到需要某个技能时，显式调用内置工具 `skill({ name: 'dsh-plugin-dev' })`。DSH 才会即时读取完整正文并封装为 `<skill_content>` 返回给模型。
3. **动态摘要追踪（Digest Invalidation）**
   当文件系统中的技能被新增、修改或删除时，文件监视器（Chokidar）触发 `skills/change`。DSH 会计算新目录的摘要 digest，只有发生变化时才在下一步注入增量目录替换消息。
