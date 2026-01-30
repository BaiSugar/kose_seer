/**
 * 独立服务打包脚本
 * 为每个服务创建独立的可执行文件
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 服务配置
const services = [
  { name: 'game', entry: 'dist/game-entry.js', output: 'game-server' },
  { name: 'gm', entry: 'dist/gm-entry.js', output: 'gm-server' },
  { name: 'proxy', entry: 'dist/proxy-entry.js', output: 'proxy-server' },
];

// 输出目录
const releaseDir = path.join(__dirname, '../release');
const servicesDir = path.join(releaseDir, 'services');

// 创建输出目录
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

console.log('========== 开始打包独立服务 ==========\n');

// 检测平台
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

let target = 'node20-win-x64';
let extension = '.exe';

if (isLinux) {
  target = 'node20-linux-x64';
  extension = '';
} else if (isMac) {
  target = 'node20-macos-x64';
  extension = '';
}

console.log(`检测到平台: ${process.platform}`);
console.log(`使用目标: ${target}\n`);

// 打包每个服务
for (const service of services) {
  console.log(`[${service.name}] 正在打包...`);
  
  const outputPath = path.join(servicesDir, service.output + extension);
  
  try {
    // 使用pkg打包，添加超时和重试配置
    const pkgCommand = `npx pkg ${service.entry} --targets ${target} --output "${outputPath}" --compress GZip`;
    
    console.log(`  执行命令: ${pkgCommand}`);
    
    execSync(pkgCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        PKG_CACHE_PATH: path.join(__dirname, '../.pkg-cache'),
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      timeout: 300000 // 5分钟超时
    });
    
    console.log(`[${service.name}] ✓ 打包完成: ${outputPath}\n`);
  } catch (error) {
    console.error(`[${service.name}] ✗ 打包失败:`, error.message);
    console.error('提示: 如果是网络问题，请稍后重试或手动下载 pkg 缓存');
    process.exit(1);
  }
}

// 复制配置文件
console.log('复制配置文件...');
const configSrc = path.join(__dirname, '../config');
const configDest = path.join(servicesDir, 'config');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(configSrc, configDest);
console.log('✓ 配置文件复制完成\n');

// 复制启动脚本
console.log('复制启动脚本...');
const batFiles = [
  'start-all.bat',
  'start-game.bat',
  'start-gm.bat',
  'start-proxy.bat',
  'stop-all.bat'
];

for (const batFile of batFiles) {
  const srcPath = path.join(__dirname, '..', batFile);
  const destPath = path.join(servicesDir, batFile);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ ${batFile}`);
  }
}
console.log('✓ 启动脚本复制完成\n');

// 创建data目录
const dataDir = path.join(servicesDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
console.log('✓ 数据目录创建完成\n');

// 创建logs目录
const logsDir = path.join(servicesDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
console.log('✓ 日志目录创建完成\n');

// 复制 ProxyServer 的 public 目录
console.log('复制 ProxyServer Web GUI...');
const publicSrc = path.join(__dirname, '../src/ProxyServer/public');
const publicDest = path.join(servicesDir, 'public');

if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, publicDest);
  console.log('✓ Web GUI 复制完成\n');
} else {
  console.log('⚠ 未找到 public 目录\n');
}

// 创建README
const readme = `# KOSE Server - 独立服务

## 服务列表

- \`game-server${extension}\` - 游戏服务（包含登录、注册功能，监听9999端口）
- \`gm-server${extension}\` - GM管理服务（Web管理界面，监听3002端口）
- \`proxy-server${extension}\` - 代理服务（调试用，监听9999端口，**不能与 GameServer 同时运行**）

## 快速启动

### 生产环境（推荐）

${isWindows ? '双击运行 `start-all.bat`' : '运行 `./start-all.sh`'} 启动所有服务（游戏+GM）。

或者分别启动：
- ${isWindows ? '双击 `start-game.bat`' : '运行 `./start-game.sh`'} - 启动游戏服务
- ${isWindows ? '双击 `start-gm.bat`' : '运行 `./start-gm.sh`'} - 启动GM管理服务

### 调试模式

${isWindows ? '双击运行 `start-proxy.bat`' : '运行 `./start-proxy.sh`'} 启动代理服务进行协议调试。

**注意：ProxyServer 和 GameServer 不能同时运行！**

### 停止服务

${isWindows ? '双击运行 `stop-all.bat`' : '运行 `./stop-all.sh`'} 停止所有正在运行的服务。

## 启动方式

### 生产部署

启动游戏服务：

\`\`\`bash
${isWindows ? 'start game-server.exe' : './game-server &'}
\`\`\`

启动GM管理服务：

\`\`\`bash
${isWindows ? 'start gm-server.exe' : './gm-server &'}
\`\`\`

### GM管理界面

启动 GM Server 后，访问：http://localhost:3002

**本地模式 vs 远程模式：**
- 本地模式（\`localMode: true\`）：无需登录，直接访问所有功能
- 远程模式（\`localMode: false\`）：需要使用游戏账号登录，并且账号需要在白名单中

配置方式：编辑 \`config/server.json\`：
\`\`\`json
{
  "services": {
    "gm": {
      "enabled": true,
      "port": 3002,
      "host": "0.0.0.0",
      "localMode": true
    }
  }
}
\`\`\`

### 调试模式

**重要：使用 ProxyServer 前必须先停止 GameServer！**

1. 停止 GameServer（如果正在运行）
2. 启动 ProxyServer：

\`\`\`bash
${isWindows ? 'start proxy-server.exe' : './proxy-server &'}
\`\`\`

3. 访问 http://localhost:9000 查看 Web GUI
4. 客户端连接到 9999 端口（ProxyServer 会转发到 GameServer）

### 停止服务

\`\`\`bash
${isWindows ? 'stop-all.bat' : './stop-all.sh'}
\`\`\`

## 配置

编辑 \`config/server.json\` 修改服务配置：

- \`services.game\` - 游戏服务配置（端口、数据库等）
- \`services.gm\` - GM管理服务配置（端口、本地模式开关）
- \`services.proxy\` - 代理服务配置（调试用）
- \`services.regist\` - 注册功能配置（enabled 开关）
- \`services.email\` - 邮件功能配置（enabled 开关）
- \`database\` - 数据库配置

## 架构说明

本服务器采用微服务架构：

- **GameServer**: 包含所有游戏功能（登录、注册、游戏逻辑），监听 9999 端口
- **GMServer**: Web管理界面，用于管理玩家、配置、服务器等，监听 3002 端口
- **ProxyServer**: 可选的调试工具，用于协议分析，监听 9999 端口

**重要提示：**
- ProxyServer 和 GameServer 都监听 9999 端口，因此不能同时运行
- GMServer 可以独立运行，也可以和 GameServer 一起运行
- 生产环境推荐同时运行 GameServer + GMServer
- ProxyServer 仅用于开发调试，用于抓包分析协议

## 使用场景

### 场景一：正常游戏运行
\`\`\`
客户端 (9999) → GameServer
管理员 (3002) → GMServer → 数据库
\`\`\`

启动 GameServer 和 GMServer，客户端连接游戏，管理员通过 Web 界面管理。

### 场景二：协议调试
\`\`\`
客户端 (9999) → ProxyServer (9000 Web GUI) → GameServer (内部)
\`\`\`

启动 ProxyServer（不启动 GameServer），ProxyServer 会自动启动内部 GameServer 并转发流量。

## 注意事项

1. 确保 \`config/\` 目录与可执行文件在同一目录
2. 确保 \`data/\` 目录存在（用于数据库）
3. 日志文件会保存在 \`logs/\` 目录
4. 客户端连接端口为 9999
5. GM管理界面端口为 3002
6. **ProxyServer 和 GameServer 不能同时启动**
7. ProxyServer 的 Web GUI 访问地址：http://localhost:9000
8. GMServer 的管理界面访问地址：http://localhost:3002
`;

fs.writeFileSync(path.join(servicesDir, 'README.md'), readme);
console.log('✓ README创建完成\n');

console.log('========== 打包完成 ==========');
console.log(`输出目录: ${servicesDir}`);
console.log(`平台: ${process.platform}`);
console.log(`目标: ${target}`);