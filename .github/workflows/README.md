# GitHub Actions 工作流说明

本项目包含三个自动化工作流，用于持续集成和发布管理。

## 📋 工作流列表

### 1. CI (ci.yml)
**触发条件：**
- 推送到 `main`、`master` 或 `develop` 分支
- 向 `main` 或 `master` 分支提交 Pull Request

**功能：**
- 安装依赖
- TypeScript 类型检查
- 编译构建
- 验证构建产物

**用途：** 确保每次代码提交都能成功编译和构建

---

### 2. Build and Release (build.yml)
**触发条件：**
- 推送到主要分支
- 推送标签（v*）
- Pull Request
- 手动触发

**功能：**
- 多平台构建（Windows、Linux、macOS）
- 多 Node.js 版本测试（18.x、20.x）
- 代码检查和格式化验证
- 自动创建 GitHub Release（仅标签推送时）

**用途：** 全面的构建测试和自动发布

---

### 3. Release (release.yml)
**触发条件：**
- 推送版本标签（v*.*.*）
- 手动触发（可指定版本号）

**功能：**
- 构建 Windows 和 Linux 发行版
- 打包可执行文件和配置文件
- 生成启动脚本
- 创建 GitHub Release 并上传构建产物
- 自动生成更新日志

**用途：** 正式版本发布

---

## 🚀 使用指南

### 日常开发
1. 提交代码到 `develop` 分支
2. CI 工作流自动运行，验证代码
3. 创建 Pull Request 到 `main` 分支
4. CI 再次验证，确保可以合并

### 发布新版本

#### 方法一：使用 Git 标签（推荐）
```bash
# 1. 确保代码已提交
git add .
git commit -m "Release v1.0.0"

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送标签到 GitHub
git push origin v1.0.0
```

#### 方法二：手动触发
1. 访问 GitHub 仓库的 Actions 页面
2. 选择 "Release" 工作流
3. 点击 "Run workflow"
4. 输入版本号（如 v1.0.0）
5. 点击 "Run workflow" 按钮

### 查看构建结果
1. 访问仓库的 Actions 页面
2. 查看工作流运行状态
3. 下载构建产物（Artifacts）
4. 查看 Releases 页面获取正式发布版本

---

## 📦 构建产物

### Windows 版本
- 文件名：`seer-server-windows-v*.zip`
- 包含：
  - `gateway-server.exe`
  - `game-server.exe`
  - `regist-server.exe`
  - `proxy-server.exe`
  - `*.bat` 启动脚本
  - `server.json.default` 配置模板
  - `README.md` 说明文档

### Linux 版本
- 文件名：`seer-server-linux-v*.tar.gz`
- 包含：
  - `gateway-server`
  - `game-server`
  - `regist-server`
  - `proxy-server`
  - `*.sh` 启动脚本
  - `server.json.default` 配置模板
  - `README.md` 说明文档

---

## 🔧 配置说明

### 修改触发分支
编辑 `.github/workflows/*.yml` 文件中的 `on.push.branches` 部分：

```yaml
on:
  push:
    branches:
      - main          # 修改为你的主分支名
      - develop       # 添加其他分支
```

### 修改 Node.js 版本
编辑 `build.yml` 中的 `matrix.node-version`：

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # 添加或删除版本
```

### 添加环境变量
在工作流文件中添加 `env` 部分：

```yaml
jobs:
  build:
    runs-on: windows-latest
    env:
      NODE_ENV: production
      DATABASE_TYPE: sqlite
```

---

## 🐛 故障排查

### 构建失败
1. 检查 Actions 日志中的错误信息
2. 确保 `package.json` 中的脚本正确
3. 验证 TypeScript 配置
4. 本地运行 `npm run build` 测试

### 发布失败
1. 确保标签格式正确（v1.0.0）
2. 检查 GitHub Token 权限
3. 验证构建产物是否生成

### 权限问题
如果遇到权限错误，需要在仓库设置中：
1. Settings → Actions → General
2. Workflow permissions → Read and write permissions
3. 勾选 "Allow GitHub Actions to create and approve pull requests"

---

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Node.js Action](https://github.com/actions/setup-node)
- [Upload Artifact](https://github.com/actions/upload-artifact)
- [Create Release](https://github.com/softprops/action-gh-release)

---

## 💡 最佳实践

1. **版本号规范**：使用语义化版本（Semantic Versioning）
   - 主版本号：不兼容的 API 修改
   - 次版本号：向下兼容的功能性新增
   - 修订号：向下兼容的问题修正

2. **分支策略**：
   - `main/master`：稳定版本
   - `develop`：开发版本
   - `feature/*`：功能分支
   - `hotfix/*`：紧急修复

3. **提交信息**：使用清晰的提交信息
   ```
   feat: 添加新功能
   fix: 修复 bug
   docs: 更新文档
   refactor: 重构代码
   test: 添加测试
   chore: 构建/工具变动
   ```

4. **测试**：在本地测试通过后再推送
   ```bash
   npm run build
   npm run build:services
   ```
