import { GameServer } from './GameServer';
import { ProxyServer } from './ProxyServer';
import { GMServer } from './GMServer/GMServer';
import { Logger } from './shared/utils';
import { Config } from './shared/config';
import { ConfigRegistry } from './shared/config/ConfigRegistry';
import { GetGameConfigRegistrations } from './shared/config/ConfigDefinitions';
import { CommandManager } from './shared/command';
import {
  HelpCommand,
  PlayerCommand,
  GiveCommand,
  ReloadCommand,
  ClearCommand,
  ExitCommand,
  StatusCommand,
  ConfigCommand,
  MemoryCommand,
  UptimeCommand,
  GCCommand,
  AnnounceCommand
} from './shared/command/commands';
import { DatabaseManager, MigrationRunner } from './DataBase';
import * as fs from 'fs';
import * as path from 'path';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

/**
 * 初始化数据库
 * 首次运行时自动创建数据库文件和表结构
 */
async function initializeDatabase(): Promise<void> {
  try {
    Logger.Info('[Startup] 检查数据库...');
    
    // 如果是 SQLite，检查数据库文件是否存在
    if (Config.Database.type === 'sqlite') {
      const dbPath = Config.Database.path;
      if (!dbPath) {
        throw new Error('SQLite 数据库路径未配置');
      }
      
      const dbDir = path.dirname(dbPath);
      
      // 确保数据目录存在
      if (!fs.existsSync(dbDir)) {
        Logger.Info(`[Startup] 创建数据目录: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const isFirstRun = !fs.existsSync(dbPath);
      if (isFirstRun) {
        Logger.Info('[Startup] 首次运行，正在初始化数据库...');
      }
    }
    
    // 初始化数据库连接
    await DatabaseManager.Instance.Initialize();
    
    // 运行数据库迁移
    Logger.Info('[Startup] 检查数据库迁移...');
    const runner = new MigrationRunner();
    await runner.RunAll();
    
    Logger.Info('[Startup] 数据库初始化完成');
  } catch (err) {
    Logger.Error('[Startup] 数据库初始化失败', err as Error);
    throw err;
  }
}

/**
 * 命令行参数解析
 */
interface StartupOptions {
  game: boolean;
  gm: boolean;
  proxy: boolean;
  all: boolean;
  help: boolean;
}

function parseArgs(): StartupOptions {
  const args = process.argv.slice(2);
  const options: StartupOptions = {
    game: false,
    gm: false,
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
      case '--gm':
      case '-m':
        options.gm = true;
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
  if (!options.game && !options.gm && !options.proxy && !options.all && !options.help) {
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
  --gm,      -m   启动 GM 管理服务器
  --proxy,   -p   启动代理服务器
  --all,     -a   启动所有服务器 (默认)
  --help,    -h   显示帮助信息

示例:
  ${exeName} --game                     启动游戏服务器
  ${exeName} --gm                       只启动 GM 服务器
  ${exeName} --game --gm                启动游戏和 GM 服务器
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
  private _gmServer: GMServer | null = null;
  private _proxyServer: ProxyServer | null = null;

  constructor() {
    // 延迟初始化，只创建需要的服务
  }

  /**
   * 根据选项启动服务
   */
  public async Start(options: StartupOptions): Promise<void> {
    const services: string[] = [];
    const skipped: string[] = [];

    // 启动游戏服务器
    if (options.all || options.game) {
      if (Config.Game.enabled) {
        // 初始化数据库（首次运行会自动创建表）
        await initializeDatabase();
        
        // 只在启动GameServer时加载战斗效果系统和游戏配置
        await import('./GameServer/Game/Battle/effects');
        Logger.Info('[Startup] 战斗效果系统已加载');
        
        // 注册并加载游戏配置
        ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
        await ConfigRegistry.Instance.Initialize();
        Logger.Info('[Startup] 游戏配置已成功全部加载');
        
        this._gameServer = new GameServer();
        await this._gameServer.Start();
        services.push('游戏服务器（包含注册和邮件功能）');
      } else {
        skipped.push('游戏服务器（配置中已禁用）');
      }
    }

    // 启动 GM 服务器
    if (options.all || options.gm) {
      if (Config.GM.enabled) {
        // 如果游戏服务器未启动，需要先加载配置
        if (!this._gameServer) {
          ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
          await ConfigRegistry.Instance.Initialize();
          Logger.Info('[Startup] 游戏配置已加载（GM Server）');
        }
        
        this._gmServer = new GMServer();
        this._gmServer.start();
        services.push('GM 管理服务器');
      } else {
        skipped.push('GM 管理服务器（配置中已禁用）');
      }
    }

    // 启动代理服务器
    if (options.all || options.proxy) {
      if (Config.Proxy.enabled) {
        this._proxyServer = new ProxyServer();
        this._proxyServer.Start();
        services.push('代理服务器');
      } else {
        skipped.push('代理服务器（配置中已禁用）');
      }
    }

    Logger.Info(`========================================`);
    if (services.length > 0) {
      Logger.Info(`✓ 已启动服务: ${services.join(', ')}`);
    }
    if (skipped.length > 0) {
      Logger.Info(`✗ 跳过服务: ${skipped.join(', ')}`);
    }
    if (services.length === 0 && skipped.length === 0) {
      Logger.Warn('没有启动任何服务，请检查配置文件或命令行参数');
    }
    Logger.Info(`========================================`);
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
    
    if (this._gmServer) {
      Logger.Info('[ServiceManager] 停止 GM 服务器...');
      // GM Server 目前没有 Stop 方法，可以后续添加
      // const gmStopPromise = this._gmServer.stop().catch((err) => {
      //   Logger.Error('[ServiceManager] 停止 GM 服务器失败', err as Error);
      // });
      // stopPromises.push(gmStopPromise);
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
  public GetStatus(): { game: boolean; gm: boolean; proxy: boolean } {
    return {
      game: this._gameServer?.IsRunning ?? false,
      gm: this._gmServer !== null,
      proxy: this._proxyServer?.IsRunning ?? false,
    };
  }

  /**
   * 获取服务器实例（用于控制台命令）
   */
  public GetServers() {
    return {
      game: this._gameServer,
      gm: this._gmServer,
      proxy: this._proxyServer
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

// 创建命令管理器
const commandManager = CommandManager.getInstance();

// 注册所有命令
commandManager.registerCommands([
  // 系统命令
  HelpCommand,
  ClearCommand,
  ExitCommand,
  
  // 服务器管理命令
  StatusCommand,
  ConfigCommand,
  MemoryCommand,
  UptimeCommand,
  GCCommand,
  ReloadCommand,
  AnnounceCommand,
  
  // GM 命令（只在游戏服务器启动时注册）
  ...(options.all || options.game ? [
    PlayerCommand,
    GiveCommand
  ] : [])
]);

// 启动服务
serviceManager.Start(options).then(() => {
  // 服务启动成功后，启动控制台
  if (process.stdin.isTTY) {
    commandManager.start();
  }
}).catch((err: Error) => {
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
      
      // 清理命令管理器
      if (commandManager) {
        commandManager.stop();
      }
      
      process.exit(1);
    } else {
      Logger.Warn('正在关闭中，请稍候... (再次按 Ctrl+C 强制退出)');
    }
    return;
  }
  
  isShuttingDown = true;
  Logger.Info(`收到 ${signal} 信号，正在关闭服务...`);
  
  // 先关闭命令管理器，防止阻止退出
  if (commandManager) {
    commandManager.stop();
  }
  
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

// Windows 特殊处理已由 ConsoleCommands 处理，这里不再需要

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
