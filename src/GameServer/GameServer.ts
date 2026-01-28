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
import { PlayerManager } from './Game/Player/PlayerManager';
// Note: ItemManager, MapManager, PetManager are now created per-player in PlayerInstance
import { IHandler, IClientSession } from './Server/Packet/IHandler';
import { DatabaseManager } from '../DataBase';
import { DatabaseHelper } from '../DataBase/DatabaseHelper';
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
  private _gatewaySessions: Map<number, IClientSession> = new Map(); // 持久化的 Gateway Session

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

    Logger.Info(`[GameServer] 开始注册 Handler，共 ${registeredHandlers.size} 个`);

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
      
      // 记录任务相关的 Handler
      if (cmdID >= 2200 && cmdID <= 2210) {
        Logger.Info(`[GameServer] 注册任务 Handler: CMD=${cmdID}, Handler=${HandlerClass.name}`);
      }
    }

    Logger.Info(`[GameServer] 已注册 ${this._handlers.size} 个命令处理器`);
    
    // 检查 CMD 2201 是否注册
    if (this._handlers.has(2201)) {
      Logger.Info(`[GameServer] ✓ CMD 2201 (ACCEPT_TASK) 已注册`);
    } else {
      Logger.Warn(`[GameServer] ✗ CMD 2201 (ACCEPT_TASK) 未注册！`);
    }
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

    // 3.5. 加载任务配置
    Logger.Info('[GameServer] 加载任务配置...');
    const { TaskConfig } = await import('./Game/Task/TaskConfig');
    TaskConfig.Instance.Load();

    // 3.6. 启动自动保存任务（每5分钟）
    Logger.Info('[GameServer] 启动自动保存任务...');
    const { AutoSaveTask } = await import('./Game/System/AutoSaveTask');
    AutoSaveTask.Instance.Start(300000); // 每300秒（5分钟）保存一次

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
   * 支持返回多个响应（用于主动推送）
   */
  private async HandleGatewayRequest(head: HeadInfo, body: Buffer): Promise<Buffer[]> {
    console.log(`[GameServer.HandleGatewayRequest] 收到请求: CMD=${head.CmdID}, UserID=${head.UserID}`);
    
    // 检查是否需要转发到 RegistServer
    if (RegistServerProxy.ShouldForward(head.CmdID)) {
      const result = await RegistServerProxy.Instance.Forward(null as any, head, body);
      return result ? [result] : [];
    }

    const handler = this._handlers.get(head.CmdID);
    console.log(`[GameServer.HandleGatewayRequest] Handler 查找结果: CMD=${head.CmdID}, found=${handler ? 'yes' : 'no'}`);
    
    if (handler) {
      try {
        // 获取或创建持久的 Gateway Session
        let session = this._gatewaySessions.get(head.UserID);
        
        if (!session) {
          // 首次请求，创建持久的 Gateway Session
          session = {
            Socket: {
              write: (data: Buffer) => {
                // 占位函数，每次请求时会被重写
                return true;
              }
            } as any,
            Address: 'Gateway',
            PolicyHandled: true,
            UserID: head.UserID,
          } as IClientSession;
          
          this._gatewaySessions.set(head.UserID, session);
          Logger.Info(`[GameServer] 创建持久 Gateway Session: UserID=${head.UserID}`);
        }
        
        // 每次请求重置响应缓冲区数组（支持多个响应）
        const responseBuffers: Buffer[] = [];
        
        (session.Socket as any).write = (data: Buffer) => {
          responseBuffers.push(data);
          return true;
        };
        
        // 如果玩家已在线，添加 Player 实例
        if (head.UserID > 0) {
          const playerManager = PlayerManager.GetInstance(this._packetBuilder);
          const player = playerManager.GetPlayer(head.UserID);
          
          if (player) {
            session.Player = player;
          }
        }
        
        await handler.Handle(session, head, body);
        
        // 如果handler没有生成响应（例如玩家不在线导致提前返回）
        // 返回一个错误响应，避免Gateway请求超时
        if (responseBuffers.length === 0) {
          Logger.Warn(`[GameServer] Handler未生成响应，返回错误: CMD=${head.CmdID}, UserID=${head.UserID}`);
          responseBuffers.push(this._packetBuilder.Build(head.CmdID, head.UserID, 5000, Buffer.alloc(0)));
        } else {
          Logger.Info(`[GameServer] Handler生成 ${responseBuffers.length} 个响应: CMD=${head.CmdID}, UserID=${head.UserID}`);
          responseBuffers.forEach((buf, idx) => {
            Logger.Debug(`[GameServer]   响应 ${idx + 1}: ${buf.length} 字节`);
          });
        }
        
        // 返回handler写入的所有响应数据
        return responseBuffers;
      } catch (err) {
        Logger.Error(`处理Gateway请求失败 CMD=${head.CmdID}`, err instanceof Error ? err : undefined);
        // 返回错误响应
        return [this._packetBuilder.Build(head.CmdID, head.UserID, 5000, Buffer.alloc(0))];
      }
    } else {
      Logger.Warn(`未处理的Gateway请求 CMD=${head.CmdID}`);
      // 返回错误响应
      return [this._packetBuilder.Build(head.CmdID, head.UserID, 5001, Buffer.alloc(0))];
    }
  }

  /**
   * 停止服务器
   */
  public async Stop(): Promise<void> {
    if (!this._running) return;

    Logger.Info('[GameServer] 正在停止服务器...');

    // 1. 停止自动保存任务
    const { AutoSaveTask } = await import('./Game/System/AutoSaveTask');
    AutoSaveTask.Instance.Stop();

    // 2. 立即保存所有数据
    Logger.Info('[GameServer] 保存所有玩家数据...');
    await DatabaseHelper.Instance.SaveAll();

    // 3. 清理 Gateway Sessions
    this._gatewaySessions.clear();
    Logger.Info('[GameServer] 已清理所有 Gateway Sessions');

    // 4. 断开 Gateway 连接
    if (this._gatewayClient) {
      this._gatewayClient.Disconnect();
    }

    // 5. 关闭数据库连接
    await DatabaseManager.Instance.Shutdown();

    // 6. 关闭网络服务
    this._server.close(() => {
      this._running = false;
      Logger.Info('[GameServer] 已停止');
    });
  }

  /**
   * 移除 Gateway Session（玩家登出时调用）
   */
  public RemoveGatewaySession(userID: number): void {
    if (this._gatewaySessions.has(userID)) {
      this._gatewaySessions.delete(userID);
      Logger.Info(`[GameServer] 移除 Gateway Session: UserID=${userID}`);
    }
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
