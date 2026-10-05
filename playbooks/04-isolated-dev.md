# SOP 04: 本地隔离开发与冒烟测试（Isolated Dev & Smoke Test）

严禁在开发测试插件时直接向宿主环境 `~/.dsh` 进行安装或修改！任何未经充分测试的插件如果在全局配置中挂载，极易导致主环境配置损坏或 Agent 无法启动。

## 1. 原则与机制

- **环境隔离**：在插件仓库根目录创建 `.dsh-dev/` 作为一次性隔离运行目录（该目录必须在 `.gitignore` 中）。
- **环境变量劫持**：通过设置 `DSH_HOME` 指向本地隔离目录：
  ```bash
  export DSH_HOME="$(pwd)/.dsh-dev"
  ```
- **专用装配配置**：在 `.dsh-dev/cordis.yml` 中声明挂载当前正在开发的插件产物。

## 2. 隔离调试标准流程

### 步骤 1：构建插件产物
```bash
pnpm build
```
确保 `dist/index.js` 产物已生成。

### 步骤 2：初始化隔离目录与配置
在项目根目录执行：
```bash
mkdir -p .dsh-dev
cat << 'EOF' > .dsh-dev/cordis.yml
# 仅用于本地调试当前插件的隔离配置
plugins:
  # 挂载基础服务
  "@deepseek-ai/dsh-core": {}
  "@deepseek-ai/dsh-tools": {}
  
  # 挂载本地正在开发的插件产物
  "../dist/index.js": {}
EOF
```

### 步骤 3：在隔离环境中启动 DSH
```bash
DSH_HOME="$(pwd)/.dsh-dev" dsh --headless
```
或者启动 Web 界面进行交互自测：
```bash
DSH_HOME="$(pwd)/.dsh-dev" dsh
```

## 3. 冒烟测试检查点

在隔离环境中运行以下测试：
1. **启动自检**：DSH 正常启动，没有出现 `Cannot find module '@deepseek-ai/cordis'` 或依赖冲突报错。
2. **工具列表自检**：在会话中输入 `/tools` 或询问模型 `有哪些可用工具`，确认新注册的工具成功出现在可见目录中。
3. **调用自检**：让模型执行一次该工具，观察参数校验、执行返回与 UI 卡片是否正常渲染。
4. **清理验证**：退出后检查开发者的全局目录 `~/.dsh`，确认没有被写入任何临时文件。
