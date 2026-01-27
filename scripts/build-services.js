/**
 * 独立服务打包脚本
 * 为每个服务创建独立的可执行文件
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 服务配置
const services = [
  { name: 'gateway', entry: 'dist/gateway-entry.js', output: 'gateway-server' },
  { name: 'game', entry: 'dist/game-entry.js', output: 'game-server' },
  { name: 'regist', entry: 'dist/regist-entry.js', output: 'regist-server' },
  { name: 'email', entry: 'dist/email-entry.js', output: 'email-server' },
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

// 打包每个服务
for (const service of services) {
  console.log(`[${service.name}] 正在打包...`);
  
  const outputPath = path.join(servicesDir, service.output);
  
  try {
    // 使用pkg打包
    execSync(
      `npx pkg ${service.entry} --targets node22-win-x64 --output ${outputPath}.exe --compress GZip`,
      { stdio: 'inherit' }
    );
    
    console.log(`[${service.name}] ✓ 打包完成: ${outputPath}.exe\n`);
  } catch (error) {
    console.error(`[${service.name}] ✗ 打包失败:`, error.message);
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
  'start-gateway.bat',
  'start-game.bat',
  'start-regist.bat',
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

- \`gateway-server.exe\` - 网关服务（监听9999和27777端口）
- \`game-server.exe\` - 游戏服务（RPC端口50002）
- \`regist-server.exe\` - 注册服务（RPC端口50001）
- \`email-server.exe\` - 邮件服务（RPC端口50003）
- \`proxy-server.exe\` - 代理服务（调试用，监听9000端口）

## 快速启动

### 方式一：一键启动所有服务（推荐）

双击运行 \`start-all.bat\`，会自动按顺序启动所有必需的服务。

### 方式二：单独启动服务

- \`start-gateway.bat\` - 启动网关服务
- \`start-game.bat\` - 启动游戏服务
- \`start-regist.bat\` - 启动注册服务
- \`start-proxy.bat\` - 启动代理服务（调试用）

### 停止服务

双击运行 \`stop-all.bat\` 停止所有正在运行的服务。

## 启动方式

### 完整部署（推荐）

**方式一：使用一键启动脚本**

\`\`\`bash
# 双击运行
start-all.bat
\`\`\`

**方式二：手动启动**

启动所有必需的服务：

\`\`\`bash
# 1. 启动后端服务
start regist-server.exe
start game-server.exe

# 2. 启动网关
start gateway-server.exe
\`\`\`

### 停止服务

\`\`\`bash
# 双击运行
stop-all.bat
\`\`\`

### 独立部署

可以将服务部署到不同的机器：

**机器1 - 网关服务器**
\`\`\`bash
gateway-server.exe
\`\`\`

**机器2 - 游戏服务器**
\`\`\`bash
game-server.exe
\`\`\`

**机器3 - 注册服务器**
\`\`\`bash
regist-server.exe
\`\`\`

## 配置

编辑 \`config/server.json\` 修改服务配置：

- \`services.gateway\` - 网关配置
- \`services.game\` - 游戏服务配置
- \`services.regist\` - 注册服务配置
- \`database\` - 数据库配置

## 注意事项

1. 确保 \`config/\` 目录与可执行文件在同一目录
2. 确保 \`data/\` 目录存在（用于数据库）
3. 日志文件会保存在 \`logs/\` 目录
4. 如果独立部署，需要修改配置文件中的host和port
`;

fs.writeFileSync(path.join(servicesDir, 'README.md'), readme);
console.log('✓ README创建完成\n');

console.log('========== 打包完成 ==========');
console.log(`输出目录: ${servicesDir}`);
