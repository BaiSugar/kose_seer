import { GameServer } from './GameServer';
import { EmailServer } from './EmailServer';
import { RegistServer } from './RegistServer';
import { ProxyServer } from './ProxyServer';
import { GatewayServer } from './Gateway';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

/**
 * 命令行参数解析
 */
interface StartupOptions {
  gateway: boolean;
  game: boolean;
  email: boolean;
  regist: boolean;
  proxy: boolean;
  all: boolean;
  help: boolean;
}

function parseArgs(): StartupOptions {
  const args = process.argv.slice(2);
  const options: StartupOptions = {
    gateway: false,
    game: false,
    email: false,
    regist: false,
    proxy: false,
    all: false,
    help: false,
  };

  for (const arg of args) {
    switch (arg.toLowerCase()) {
      case '--gateway':
      case '-gw':
        options.gateway = true;
        break;
      case '--game':
      case '-g':
        options.game = true;
        break;
      case '--email':
      case '-e':
        options.email = true;
        break;
      case '--regist':
      case '-r':
        options.regist = true;
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
  if (!options.gateway && !options.game && !options.email && !options.regist && !options.proxy && !options.all && !options.help) {
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
  --gateway, -gw  启动网关服务器
  --game,    -g   启动游戏服务器
  --email,   -e   启动邮件服务器
  --regist,  -r   启动注册服务器
  --proxy,   -p   启动代理服务器
  --all,     -a   启动所有服务器 (默认)
  --help,    -h   显示帮助信息

示例:
  ${exeName} --gateway --game --regist  启动网关+游戏+注册服务器
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
  private _gatewayServer: GatewayServer | null = null;
  private _gameServer: GameServer | null = null;
  private _emailServer: EmailServer | null = null;
  private _registServer: RegistServer | null = null;
  private _proxyServer: ProxyServer | null = null;

  constructor() {
    // 延迟初始化，只创建需要的服务
  }

  /**
   * 根据选项启动服务
   */
  public async Start(options: StartupOptions): Promise<void> {
    const services: string[] = [];

    if (options.all || options.gateway) {
      this._gatewayServer = new GatewayServer();
      await this._gatewayServer.Start();
      services.push('网关服务器');
    }

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
      services.push('游戏服务器');
    }

    if (options.all || options.email) {
      this._emailServer = new EmailServer();
      this._emailServer.Start();
      services.push('邮件服务器');
    }

    if (options.all || options.regist) {
      this._registServer = new RegistServer();
      await this._registServer.Start();
      services.push('注册服务器');
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
    if (this._gatewayServer) await this._gatewayServer.Stop();
    if (this._gameServer) await this._gameServer.Stop();
    if (this._emailServer) this._emailServer.Stop();
    if (this._registServer) await this._registServer.Stop();
    if (this._proxyServer) this._proxyServer.Stop();
  }

  /**
   * 获取服务状态
   */
  public GetStatus(): { gateway: boolean; game: boolean; email: boolean; regist: boolean; proxy: boolean } {
    return {
      gateway: this._gatewayServer?.IsRunning ?? false,
      game: this._gameServer?.IsRunning ?? false,
      email: this._emailServer?.IsRunning ?? false,
      regist: this._registServer?.IsRunning ?? false,
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

// 处理进程退出
process.on('SIGINT', async () => {
  Logger.Info('收到退出信号...');
  await serviceManager.StopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.Info('收到终止信号...');
  await serviceManager.StopAll();
  process.exit(0);
});

export { ServiceManager };
