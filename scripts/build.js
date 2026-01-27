/**
 * 打包脚本
 * 用于将服务端打包成可执行文件
 *
 * 使用方法:
 *   node scripts/build.js [platform]
 *
 * 平台选项:
 *   win    - Windows x64
 *   linux  - Linux x64
 *   macos  - macOS x64
 *   all    - 所有平台
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.argv[2] || 'win';

const targets = {
  win: 'node22-win-x64',
  linux: 'node22-linux-x64',
  macos: 'node22-macos-x64',
  all: 'node22-win-x64,node22-linux-x64,node22-macos-x64'
};

const outputNames = {
  win: 'kose_server.exe',
  linux: 'kose_server',
  macos: 'kose_server-macos'
};

function main() {
  console.log('========================================');
  console.log('  KOSE Server 打包工具');
  console.log('========================================\n');

  // 1. 确保 release 目录存在
  const releaseDir = path.join(__dirname, '..', 'release');
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
    console.log('✓ 创建 release 目录');
  }

  // 2. 编译 TypeScript
  console.log('\n[1/3] 编译 TypeScript...');
  try {
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✓ TypeScript 编译完成');
  } catch (err) {
    console.error('✗ TypeScript 编译失败');
    process.exit(1);
  }

  // 3. 运行 pkg 打包
  console.log(`\n[2/3] 打包 ${platform} 可执行文件...`);

  const target = targets[platform];
  if (!target) {
    console.error(`✗ 未知平台: ${platform}`);
    console.log('支持的平台: win, linux, macos, all');
    process.exit(1);
  }

  try {
    if (platform === 'all') {
      execSync(`npx pkg . --targets ${target} --out-path release/`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    } else {
      const output = path.join('release', outputNames[platform]);
      execSync(`npx pkg . --targets ${target} --output ${output}`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    }
    console.log('✓ 打包完成');
  } catch (err) {
    console.error('✗ 打包失败');
    process.exit(1);
  }

  // 4. 复制配置文件和必要资源
  console.log('\n[3/3] 复制配置文件...');

  const configDir = path.join(__dirname, '..', 'config');
  const releaseConfigDir = path.join(releaseDir, 'config');

  if (fs.existsSync(configDir)) {
    if (!fs.existsSync(releaseConfigDir)) {
      fs.mkdirSync(releaseConfigDir, { recursive: true });
    }

    // 复制配置文件和目录
    const configFiles = fs.readdirSync(configDir);
    for (const file of configFiles) {
      const src = path.join(configDir, file);
      const dst = path.join(releaseConfigDir, file);
      const stat = fs.statSync(src);
      
      if (stat.isDirectory()) {
        copyDir(src, dst);
        console.log(`  复制: config/${file}/`);
      } else {
        fs.copyFileSync(src, dst);
        console.log(`  复制: config/${file}`);
      }
    }
  }

  // 复制 data 目录 (SQLite 数据库目录)
  const dataDir = path.join(releaseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('  创建: data/');
  }

  // 复制原生模块 (better-sqlite3)
  if (platform === 'win' || platform === 'all') {
    copyNativeModule('win32', releaseDir);
  }
  if (platform === 'linux' || platform === 'all') {
    copyNativeModule('linux', releaseDir);
  }
  if (platform === 'macos' || platform === 'all') {
    copyNativeModule('darwin', releaseDir);
  }

  console.log('\n========================================');
  console.log('  打包完成!');
  console.log('========================================');
  console.log(`\n输出目录: ${releaseDir}`);
  console.log('\n运行前请确保:');
  console.log('  1. config/ 目录下有正确的配置文件');
  console.log('  2. data/ 目录存在 (SQLite 数据库)');
  if (platform !== 'all') {
    console.log(`\n运行命令: ${platform === 'win' ? '.\\release\\kose_server.exe' : './release/kose_server'}`);
  }
}

function copyNativeModule(platform, releaseDir) {
  // better-sqlite3 的原生模块需要单独处理
  // pkg 无法自动打包原生模块，需要复制整个模块目录
  const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
  const sqliteDir = path.join(nodeModulesDir, 'better-sqlite3');

  if (!fs.existsSync(sqliteDir)) {
    console.log(`  警告: 未找到 better-sqlite3 模块`);
    return;
  }

  // 复制整个 better-sqlite3 模块到 release/node_modules
  const targetNodeModules = path.join(releaseDir, 'node_modules', 'better-sqlite3');
  copyDir(sqliteDir, targetNodeModules);
  console.log(`  复制: node_modules/better-sqlite3`);

  // 同时复制 bindings 依赖 (better-sqlite3 需要)
  const bindingsDir = path.join(nodeModulesDir, 'bindings');
  if (fs.existsSync(bindingsDir)) {
    const targetBindings = path.join(releaseDir, 'node_modules', 'bindings');
    copyDir(bindingsDir, targetBindings);
    console.log(`  复制: node_modules/bindings`);
  }

  // 复制 file-uri-to-path 依赖
  const fileUriDir = path.join(nodeModulesDir, 'file-uri-to-path');
  if (fs.existsSync(fileUriDir)) {
    const targetFileUri = path.join(releaseDir, 'node_modules', 'file-uri-to-path');
    copyDir(fileUriDir, targetFileUri);
    console.log(`  复制: node_modules/file-uri-to-path`);
  }
}

function copyDir(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

main();
