import { GameServer } from './GameServer';
import { ProxyServer } from './ProxyServer';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

/**
 * 命令行参数解析
 */
interface StartupOptions {
  game: boolean;
  proxy: boolean;
  all: boolean;
  help: boolean;
}

function parseArgs(): StartupOptions {
  const args = process.argv.slice(2);
  const options: StartupOptions = {
    game: false,
    proxy: false,
    all: false,
    help: false,
  };

  for (const arg of args) {
    switch (arg.toLowerCase()) {
      case '--game':
      case '-g':
        options.game = true;
        break;
      case '--proxy':
      case '-p':
        options.proxy = true;
        break;
      case '--all':
      case '-a':
        options.all = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  // 如果没有指定任何服务，默认启动所有
  if (!options.game && !options.proxy && !options.all && !options.help) {
    options.all = true;
  }

  return options;
}

function printHelp(): void {
  // 检测是否为打包后的exe运行
  const isPkg = (process as any).pkg !== undefined;
  const exeName = isPkg ? 'kose_server.exe' : 'node index.js';

  console.log(`
KOSE Server - 赛尔号怀旧服服务端

用法: ${exeName} [选项]

选项:
  --game,    -g   启动游戏服务器（包含注册和邮件功能）
  --proxy,   -p   启动代理服务器
  --all,     -a   启动所有服务器 (默认)
  --help,    -h   显示帮助信息

示例:
  ${exeName} --game                     启动游戏服务器
  ${exeName} --proxy                    只启动代理服务器
  ${exeName} --all                      启动所有服务器
  ${exeName}                            启动所有服务器 (默认)
`);
}

/**
 * 服务管理器
 * 统一管理所有服务的启动和停止
 */
class ServiceManager {
  private _gameServer: GameServer | null = null;
  private _proxyServer: ProxyServer | null = null;

  constructor() {
    // 延迟初始化，只创建需要的服务
  }

  /**
   * 根据选项启动服务
   */
  public async Start(options: StartupOptions): Promise<void> {
    const services: string[] = [];

    if (options.all || options.game) {
      // 只在启动GameServer时加载战斗效果系统和游戏配置
      await import('./GameServer/Game/Battle/effects');
      Logger.Info('[Startup] 战斗效果系统已加载');
      
      // 加载游戏配置
      const { SkillConfig, SkillEffectConfig } = await import('./shared/config');
      SkillConfig.Load();
      SkillEffectConfig.Load();
      
      this._gameServer = new GameServer();
      await this._gameServer.Start();
      services.push('游戏服务器（包含注册和邮件功能）');
    }

    if (options.all || options.proxy) {
      this._proxyServer = new ProxyServer();
      this._proxyServer.Start();
      services.push('代理服务器');
    }

    if (services.length > 0) {
      Logger.Info(`已启动服务: ${services.join(', ')}`);
    }
  }

  /**
   * 停止所有已启动的服务
   */
  public async StopAll(): Promise<void> {
    Logger.Info('========== 停止服务 ==========');
    
    const stopPromises: Promise<void>[] = [];
    
    if (this._gameServer) {
      Logger.Info('[ServiceManager] 停止游戏服务器...');
      const gameStopPromise = this._gameServer.Stop().catch((err) => {
        Logger.Error('[ServiceManager] 停止游戏服务器失败', err as Error);
      });
      stopPromises.push(gameStopPromise);
    }
    
    if (this._proxyServer) {
      Logger.Info('[ServiceManager] 停止代理服务器...');
      const proxyStopPromise = this._proxyServer.Stop().catch((err) => {
        Logger.Error('[ServiceManager] 停止代理服务器失败', err as Error);
      });
      stopPromises.push(proxyStopPromise);
    }
    
    // 等待所有服务停止，最多等待 8 秒
    await Promise.race([
      Promise.all(stopPromises),
      new Promise<void>((resolve) => setTimeout(() => {
        Logger.Warn('[ServiceManager] 停止服务超时，强制继续');
        resolve();
      }, 8000))
    ]);
    
    Logger.Info('[ServiceManager] 所有服务已停止');
  }

  /**
   * 获取服务状态
   */
  public GetStatus(): { game: boolean; proxy: boolean } {
    return {
      game: this._gameServer?.IsRunning ?? false,
      proxy: this._proxyServer?.IsRunning ?? false,
    };
  }
}

// 解析命令行参数
const options = parseArgs();

// 显示帮助信息
if (options.help) {
  printHelp();
  process.exit(0);
}

// 创建服务管理器并启动
const serviceManager = new ServiceManager();
serviceManager.Start(options).catch((err: Error) => {
  Logger.Error('启动服务失败', err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
});

// 优雅退出处理
let isShuttingDown = false;
let shutdownTimeout: NodeJS.Timeout | null = null;
let forceExitCount = 0;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    forceExitCount++;
    
    if (forceExitCount >= 2) {
      Logger.Warn('强制退出');
      process.exit(1);
    } else {
      Logger.Warn('正在关闭中，请稍候... (再次按 Ctrl+C 强制退出)');
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
    await serviceManager.StopAll();
    Logger.Info('所有服务已安全关闭');
    
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
      shutdownTimeout = null;
    }
    
    // 强制清理所有定时器和句柄
    Logger.Info('清理所有资源...');
    
    // 给一点时间让日志输出完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 立即退出，不等待任何异步操作
    process.exit(0);
  } catch (err) {
    Logger.Error('关闭过程中出错', err as Error);
    
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
      shutdownTimeout = null;
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
    
    // 防止 readline 阻止进程退出
    rl.on('close', () => {
      // 不做任何事，让进程正常退出
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

export { ServiceManager };
