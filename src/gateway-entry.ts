/**
 * Gateway服务独立入口
 */
import { GatewayServer } from './Gateway';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

const gateway = new GatewayServer();

gateway.Start().catch((err: Error) => {
  Logger.Error('Gateway启动失败', err);
  process.exit(1);
});

// 优雅退出处理
let isShuttingDown = false;
let shutdownTimeout: NodeJS.Timeout | null = null;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    Logger.Warn('正在关闭中，请稍候... (再次按 Ctrl+C 强制退出)');
    
    // 如果再次收到信号，强制退出
    if (shutdownTimeout) {
      Logger.Warn('强制退出');
      process.exit(1);
    }
    return;
  }
  
  isShuttingDown = true;
  Logger.Info(`收到 ${signal} 信号，正在关闭服务...`);
  
  // 设置超时，10秒后强制退出
  shutdownTimeout = setTimeout(() => {
    Logger.Error('关闭超时，强制退出');
    process.exit(1);
  }, 10000);
  
  try {
    await gateway.Stop();
    Logger.Info('Gateway 已安全关闭');
    
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
    }
    
    process.exit(0);
  } catch (err) {
    Logger.Error('关闭过程中出错', err as Error);
    
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
    }
    
    process.exit(1);
  }
}

// 处理 Ctrl+C (SIGINT)
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// 处理 kill 命令 (SIGTERM)
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

// Windows 特殊处理 - 使用 readline 捕获 Ctrl+C
if (process.platform === 'win32') {
  const readline = require('readline');
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('SIGINT', () => {
      // Windows 下 readline 的 SIGINT 事件
      process.emit('SIGINT' as any);
    });
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  Logger.Error('未捕获的异常', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.Error('未处理的 Promise 拒绝', reason as Error);
  gracefulShutdown('unhandledRejection');
});
