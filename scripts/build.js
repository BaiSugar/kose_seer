/**
 * KOSE Server 打包脚本
 *
 * 用法: node scripts/build.js [win|linux|macos|all]
 *
 * 流程:
 * 1. 清理旧的 dist/ 和 release/win/ 输出
 * 2. TypeScript 编译服务端代码
 * 3. 构建 Web GM 前端
 * 4. 使用 @yao-pkg/pkg 打包为可执行文件
 * 5. 组装发布包到 release/win/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 项目根目录
const ROOT = path.resolve(__dirname, '..');

// 平台配置
const PLATFORM_CONFIG = {
  win: {
    target: 'node22-win-x64',
    exeName: 'kose_server.exe',
    releaseDir: 'release/win',
  },
  linux: {
    target: 'node22-linux-x64',
    exeName: 'kose_server',
    releaseDir: 'release/linux',
  },
  macos: {
    target: 'node22-macos-x64',
    exeName: 'kose_server',
    releaseDir: 'release/macos',
  },
};

// 解析命令行参数
const args = process.argv.slice(2);
const platform = args[0] || 'win';

if (platform === 'all') {
  for (const p of Object.keys(PLATFORM_CONFIG)) {
    build(p);
  }
} else if (PLATFORM_CONFIG[platform]) {
  build(platform);
} else {
  console.error(`未知平台: ${platform}`);
  console.error('支持的平台: win, linux, macos, all');
  process.exit(1);
}

function build(platform) {
  const config = PLATFORM_CONFIG[platform];
  const releaseDir = path.join(ROOT, config.releaseDir);

  console.log('========================================');
  console.log(`  KOSE Server 打包 - ${platform}`);
  console.log('========================================\n');

  // 1. 清理
  step('清理旧的输出目录', () => {
    rmDir(path.join(ROOT, 'dist'));
    rmDir(releaseDir);
  });

  // 2. TypeScript 编译
  step('编译 TypeScript', () => {
    run('npx tsc', ROOT);
  });

  // 3. 构建 Web GM 前端
  step('构建 Web GM 前端', () => {
    const webDir = path.join(ROOT, 'web');
    if (!fs.existsSync(path.join(webDir, 'node_modules'))) {
      console.log('  安装 Web GM 依赖...');
      run('npm install', webDir);
    }
    run('npm run build', webDir);
  });

  // 4. pkg 打包
  step('pkg 打包为可执行文件', () => {
    const pkgBin = path.join(ROOT, 'node_modules', '.bin', 'pkg');
    const entryPoint = path.join(ROOT, 'dist', 'index.js');
    const outputExe = path.join(releaseDir, config.exeName);

    // 确保输出目录存在
    mkDir(releaseDir);

    const cmd = `"${pkgBin}" "${entryPoint}" --target ${config.target} --output "${outputExe}"`;
    run(cmd, ROOT);
  });

  // 5. 组装发布包
  step('组装发布包', () => {
    // 复制 better-sqlite3 原生模块
    const sqliteNativeSrc = path.join(
      ROOT,
      'node_modules',
      'better-sqlite3',
      'build',
      'Release',
      'better_sqlite3.node'
    );
    if (fs.existsSync(sqliteNativeSrc)) {
      const buildDir = path.join(releaseDir, 'build', 'Release');
      mkDir(buildDir);
      fs.copyFileSync(sqliteNativeSrc, path.join(buildDir, 'better_sqlite3.node'));
      console.log('  已复制 better-sqlite3 原生模块');
    } else {
      console.warn('  警告: better-sqlite3 原生模块不存在，数据库可能无法工作');
    }

    // 复制 web-gm 前端静态文件
    const webDistSrc = path.join(ROOT, 'web', 'dist');
    const webGmDest = path.join(releaseDir, 'web-gm');
    if (fs.existsSync(webDistSrc)) {
      copyDir(webDistSrc, webGmDest);
      console.log('  已复制 Web GM 前端');
    } else {
      console.warn('  警告: Web GM 构建产物不存在，跳过');
    }

    // 复制 config 目录
    const configDest = path.join(releaseDir, 'config');
    mkDir(configDest);

    // 复制 server.json.default
    const defaultConfig = path.join(ROOT, 'config', 'server.json.default');
    if (fs.existsSync(defaultConfig)) {
      fs.copyFileSync(defaultConfig, path.join(configDest, 'server.json.default'));
      // 同时复制一份作为 server.json（用户可直接使用）
      fs.copyFileSync(defaultConfig, path.join(configDest, 'server.json'));
      console.log('  已复制配置文件');
    }

    // 复制 client.json
    const clientConfig = path.join(ROOT, 'config', 'client.json');
    if (fs.existsSync(clientConfig)) {
      fs.copyFileSync(clientConfig, path.join(configDest, 'client.json'));
      console.log('  已复制客户端配置');
    }

    // 复制 config/data 目录（游戏配置数据）
    const dataDir = path.join(ROOT, 'config', 'data');
    if (fs.existsSync(dataDir)) {
      copyDir(dataDir, path.join(configDest, 'data'));
      console.log('  已复制游戏配置数据');
    }

    // 复制 ProxyServer/public 目录
    const proxySrc = path.join(ROOT, 'src', 'ProxyServer', 'public');
    if (fs.existsSync(proxySrc)) {
      copyDir(proxySrc, path.join(releaseDir, 'public'));
      console.log('  已复制 ProxyServer 静态资源');
    }

    // 生成启动脚本（仅 Windows）
    if (platform === 'win') {
      generateBatScripts(releaseDir, config.exeName);
      console.log('  已生成启动脚本');
    }

    // 创建必要的空目录
    mkDir(path.join(releaseDir, 'data'));
    mkDir(path.join(releaseDir, 'logs'));

    // 生成 README.txt
    generateReadme(releaseDir, config.exeName);
    console.log('  已生成 README.txt');
  });

  console.log('\n========================================');
  console.log(`  打包完成！输出目录: ${config.releaseDir}`);
  console.log('========================================\n');
}

// ========== 辅助函数 ==========

function step(name, fn) {
  console.log(`[${name}]`);
  const start = Date.now();
  fn();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  完成 (${elapsed}s)\n`);
}

function run(cmd, cwd) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  删除: ${path.relative(ROOT, dir)}`);
  }
}

function mkDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  mkDir(dest);
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

function generateBatScripts(releaseDir, exeName) {
  // start-all.bat
  fs.writeFileSync(
    path.join(releaseDir, 'start-all.bat'),
    [
      '@echo off',
      'chcp 65001 >nul',
      'title KOSE Server',
      '',
      'if not exist "config\\server.json" (',
      '    echo [ERROR] config\\server.json not found',
      '    echo Please copy config\\server.json.default to config\\server.json',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      'if not exist "data" mkdir data >nul 2>&1',
      'if not exist "logs" mkdir logs >nul 2>&1',
      '',
      'echo Starting all services...',
      'echo.',
      `${exeName} --all`,
      '',
      'pause',
      '',
    ].join('\r\n'),
  );

  // start-game.bat
  fs.writeFileSync(
    path.join(releaseDir, 'start-game.bat'),
    [
      '@echo off',
      'chcp 65001 >nul',
      'title KOSE Server - Game',
      '',
      'if not exist "config\\server.json" (',
      '    echo [ERROR] config\\server.json not found',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      'if not exist "data" mkdir data >nul 2>&1',
      'if not exist "logs" mkdir logs >nul 2>&1',
      '',
      'echo Starting game service...',
      'echo.',
      `${exeName} --game`,
      '',
      'pause',
      '',
    ].join('\r\n'),
  );

  // start-gm.bat
  fs.writeFileSync(
    path.join(releaseDir, 'start-gm.bat'),
    [
      '@echo off',
      'chcp 65001 >nul',
      'title KOSE Server - GM',
      '',
      'if not exist "config\\server.json" (',
      '    echo [ERROR] config\\server.json not found',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      'if not exist "data" mkdir data >nul 2>&1',
      'if not exist "logs" mkdir logs >nul 2>&1',
      '',
      'echo Starting GM service...',
      'echo Web GM: http://localhost:3002',
      'echo.',
      `${exeName} --gm`,
      '',
      'pause',
      '',
    ].join('\r\n'),
  );

  // stop-all.bat
  fs.writeFileSync(
    path.join(releaseDir, 'stop-all.bat'),
    [
      '@echo off',
      'chcp 65001 >nul',
      'title KOSE Server - Stop',
      '',
      'echo Stopping all services...',
      'echo.',
      '',
      `taskkill /F /IM ${exeName} 2>nul`,
      'if %errorlevel% equ 0 (',
      '    echo [OK] kose_server stopped',
      ') else (',
      '    echo [--] kose_server not running',
      ')',
      '',
      'echo.',
      'pause',
      '',
    ].join('\r\n'),
  );
}

function generateReadme(releaseDir, exeName) {
  fs.writeFileSync(
    path.join(releaseDir, 'README.txt'),
    [
      'KOSE Server',
      '========================================',
      '',
      'Quick Start:',
      '  1. Edit config/server.json (database, ports)',
      '  2. Edit config/client.json (server IP for clients)',
      '  3. Run start-all.bat',
      '',
      'Important Config:',
      '  config/server.json - Server binding (use 0.0.0.0)',
      '  config/client.json - Client connection address',
      '    Local:  127.0.0.1',
      '    LAN:    192.168.x.x',
      '    Public: your-domain.com or public IP',
      '',
      'Scripts:',
      '  start-all.bat   - Start all services',
      '  start-game.bat  - Start game service only',
      '  start-gm.bat    - Start GM service only',
      '  stop-all.bat    - Stop all services',
      '',
      'Command Line:',
      `  ${exeName} --all      Start all (default)`,
      `  ${exeName} --game     Start game service`,
      `  ${exeName} --gm       Start GM service`,
      `  ${exeName} --proxy    Start proxy service`,
      `  ${exeName} --help     Show help`,
      '',
      'Web GM Panel:',
      '  http://localhost:3002',
      '',
      'Directories:',
      '  config/   - Configuration files',
      '  data/     - Database files',
      '  logs/     - Log files',
      '  web-gm/   - Web GM static files',
      '',
      'Deployment:',
      '  1. server.json host: "0.0.0.0" (server binding)',
      '  2. client.json ip: "your-ip" (client connection)',
      '  3. Open firewall ports: 9999, 3002',
      '',
    ].join('\r\n'),
  );
}
