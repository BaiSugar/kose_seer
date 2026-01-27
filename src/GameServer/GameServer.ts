import { createServer, Server } from 'net';
import { Config } from '../shared/config';
import { ConfigRegistry, GetGameConfigRegistrations } from '../shared/config';
import { PacketBuilder, HeadInfo } from '../shared/protocol';
import { Logger, Handlers, InjectType } from '../shared';
import { SessionManager, IInternalSession } from './Server/Session';
import { PolicyHandler } from './Server/PolicyHandler';
import { RegistServerProxy } from './Server/Proxy';
import { LoginManager } from './Game/Login';
import { ServerManager } from './Game/Server';
// Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
import { IHandler } from './Server/Packet/IHandler';
import { DatabaseManager } from '../DataBase';
import { GatewayClient } from '../shared/gateway';

// 导入所有Handler以触发装饰器注册
import './Server/Packet/Recv';

/**
 * 游戏服务器
 */
export class GameServer {
  private _server: Server;
  private _sessionManager: SessionManager;
  private _packetBuilder: PacketBuilder;
  private _loginManager: LoginManager;
  private _serverManager: ServerManager;
  // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
  private _handlers: Map<number, IHandler>;
  private _running: boolean = false;
  private _gatewayClient: GatewayClient | null = null;

  constructor() {
    this._server = createServer();
    this._sessionManager = new SessionManager('1');
    this._packetBuilder = new PacketBuilder('1');
    this._loginManager = new LoginManager(this._packetBuilder);
    this._serverManager = new ServerManager(this._packetBuilder);
    // Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
    // this._mapManager = new MapManager();
    // this._petManager = new PetManager();
    // this._itemManager = new ItemManager();
    this._handlers = new Map();

    this.RegisterHandlers();
    this.SetupConnectionHandler();
  }

  /**
   * 注册命令处理器 (通过装饰器自动注册)
   */
  private RegisterHandlers(): void {
    const registeredHandlers = Handlers.GetAll();

    for (const [cmdID, HandlerClass] of registeredHandlers) {
      let handler: IHandler;

      // 根据装饰器声明的 InjectType 注入依赖
      switch (HandlerClass.INJECT) {
        case InjectType.LOGIN_MANAGER:
          handler = new HandlerClass(this._loginManager);
          break;
        case InjectType.SERVER_MANAGER:
          handler = new HandlerClass(this._serverManager);
          break;
        // Note: MAP_MANAGER, PET_MANAGER, ITEM_MANAGER cases removed
        // These managers are now accessed via player.XxxManager
        default:
          handler = new HandlerClass();
          break;
      }

      this._handlers.set(cmdID, handler);
    }

    Logger.Info(`已注册 ${this._handlers.size} 个命令处理器`);
  }

  /**
   * 设置连接处理
   */
  private SetupConnectionHandler(): void {
    this._server.on('connection', (socket) => {
      const session = this._sessionManager.CreateSession(socket);

      socket.on('data', (data) => {
        this.HandleData(session, data);
      });

      socket.on('error', (err) => {
        Logger.Error(`Socket错误: ${session.Address}`, err);
      });

      socket.on('close', () => {
        this._sessionManager.RemoveSession(session.Address);
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  private HandleData(session: IInternalSession, data: Buffer): void {
    // 检查是否是 Flash Socket Policy 请求
    if (!session.PolicyHandled) {
      if (PolicyHandler.Handle(session.Socket, data, session.Address)) {
        session.PolicyHandled = true;
        return;
      }
      session.PolicyHandled = true;
    }

    session.Parser.Append(data);

    let packet;
    while ((packet = session.Parser.TryParse()) !== null) {
      this.ProcessPacket(session, packet.head, packet.body);
    }
  }

  /**
   * 处理数据包
   */
  private async ProcessPacket(session: IInternalSession, head: HeadInfo, body: Buffer): Promise<void> {
    // 检查是否需要转发到 RegistServer
    if (RegistServerProxy.ShouldForward(head.CmdID)) {
      const response = await RegistServerProxy.Instance.Forward(session.Socket, head, body);
      if (response && session.Socket.writable) {
        session.Socket.write(response);
        Logger.Debug(`[GameServer] 转发响应已发送: CMD=${head.CmdID}`);
      } else {
        Logger.Warn(`[GameServer] 转发失败: CMD=${head.CmdID}`);
      }
      return;
    }

    const handler = this._handlers.get(head.CmdID);
    if (handler) {
      try {
        await handler.Handle(session, head, body);
      } catch (err) {
        Logger.Error(`处理命令失败 CMD=${head.CmdID}`, err instanceof Error ? err : undefined);
      }
    } else {
      Logger.Warn(`未处理的命令 CMD=${head.CmdID}`);
    }
  }

  /**
   * 启动服务器
   */
  public async Start(): Promise<void> {
    if (this._running) return;

    Logger.Info('[GameServer] 正在启动...');

    // 1. 注册游戏配置
    Logger.Info('[GameServer] 注册游戏配置...');
    const gameConfigs = GetGameConfigRegistrations();
    ConfigRegistry.Instance.RegisterBatch(gameConfigs);

    // 2. 初始化配置系统
    Logger.Info('[GameServer] 初始化配置系统...');
    await ConfigRegistry.Instance.Initialize();

    // 3. 初始化数据库
    Logger.Info('[GameServer] 初始化数据库...');
    await DatabaseManager.Instance.Initialize();

    // 4. 启动网络服务
    this._server.listen(Config.Game.rpcPort, Config.Game.host, () => {
      this._running = true;
      Logger.Info(`[GameServer] 启动成功 ${Config.Game.host}:${Config.Game.rpcPort}`);
      
      // 输出配置统计
      const stats = ConfigRegistry.Instance.GetStats();
      Logger.Info(`[GameServer] 配置加载: ${stats.loaded}/${stats.registered} 个`);
    });

    // 5. 连接到Gateway
    if (Config.Gateway.enabled) {
      this._gatewayClient = new GatewayClient(
        'GameServer',
        'game',
        Config.Gateway.host,
        Config.Gateway.rpcPort
      );

      // 设置请求处理器
      this._gatewayClient.SetRequestHandler(async (head, body) => {
        return await this.HandleGatewayRequest(head, body);
      });

      const connected = await this._gatewayClient.Connect();
      if (connected) {
        Logger.Info('[GameServer] 已注册到Gateway');
      } else {
        Logger.Warn('[GameServer] 无法连接到Gateway，将在后台重试');
      }
    }
  }

  /**
   * 处理来自Gateway的请求
   */
  private async HandleGatewayRequest(head: HeadInfo, body: Buffer): Promise<Buffer | null> {
    // 检查是否需要转发到 RegistServer
    if (RegistServerProxy.ShouldForward(head.CmdID)) {
      return await RegistServerProxy.Instance.Forward(null as any, head, body);
    }

    const handler = this._handlers.get(head.CmdID);
    if (handler) {
      try {
        // 创建临时会话用于处理Gateway请求
        const tempSession: any = {
          Socket: null, // Gateway请求不需要socket
          Address: 'Gateway',
          Parser: null,
          PolicyHandled: true,
        };
        
        await handler.Handle(tempSession, head, body);
        
        // 返回响应（如果handler有设置响应）
        return this._packetBuilder.Build(head.CmdID, head.UserID, 0, Buffer.alloc(0));
      } catch (err) {
        Logger.Error(`处理Gateway请求失败 CMD=${head.CmdID}`, err instanceof Error ? err : undefined);
        return null;
      }
    } else {
      Logger.Warn(`未处理的Gateway请求 CMD=${head.CmdID}`);
      return null;
    }
  }

  /**
   * 停止服务器
   */
  public async Stop(): Promise<void> {
    if (!this._running) return;

    if (this._gatewayClient) {
      this._gatewayClient.Disconnect();
    }

    await DatabaseManager.Instance.Shutdown();

    this._server.close(() => {
      this._running = false;
      Logger.Info('[GameServer] 已停止');
    });
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
