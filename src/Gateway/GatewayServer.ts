/**
 * Gateway服务器（单端口版本）
 * 作为前端入口，负责接收客户端连接并路由到后端服务
 */
import { createServer, Server } from 'net';
import { Logger } from '../shared/utils';
import { Config } from '../shared/config';
import { HeadInfo } from '../shared/protocol';
import { Router } from './Router';
import { GatewaySessionManager } from './SessionManager';
import { PolicyHandler } from './PolicyHandler';

/**
 * Gateway服务器
 */
export class GatewayServer {
  private _server: Server;
  private _sessionManager: GatewaySessionManager;
  private _router: Router;
  private _running: boolean = false;

  constructor() {
    this._server = createServer();
    this._sessionManager = new GatewaySessionManager();
    this._router = new Router();
    
    this.setupServer();
  }

  /**
   * 设置服务器连接处理
   */
  private setupServer(): void {
    this._server.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[Gateway] 客户端连接: ${address}`);

      const session = this._sessionManager.CreateSession(socket, 'main');

      socket.on('data', (data) => {
        this.handleData(session, data);
      });

      socket.on('error', (err) => {
        Logger.Error(`[Gateway] 连接错误: ${address}`, err);
      });

      socket.on('close', () => {
        Logger.Info(`[Gateway] 连接断开: ${address}`);
        
        // 如果有 userId，通知 GameServer 玩家下线
        if (session.userId) {
          Logger.Info(`[Gateway] 通知 GameServer 玩家 ${session.userId} 下线`);
          // 通过 Router 通知 GameServer
          this._router.NotifyPlayerDisconnect(session.userId).catch(err => {
            Logger.Error(`[Gateway] 通知玩家下线失败: ${session.userId}`, err);
          });
        }
        
        this._sessionManager.RemoveSession(session.id);
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  private async handleData(session: any, data: Buffer): Promise<void> {
    // 检查是否是 Flash Socket Policy 请求
    if (!session.policyHandled) {
      Logger.Debug(`[Gateway] 检查策略请求: ${session.address}, 数据长度=${data.length}`);
      if (PolicyHandler.Handle(session.socket, data, session.address)) {
        session.policyHandled = true;
        Logger.Info(`[Gateway] 策略文件已发送: ${session.address}`);
        return;
      }
      session.policyHandled = true;
    }

    session.parser.Append(data);

    let packet;
    while ((packet = session.parser.TryParse()) !== null) {
      await this.processPacket(session, packet.head, packet.body);
    }
  }

  /**
   * 处理数据包（支持多个响应）
   */
  private async processPacket(
    session: any,
    head: HeadInfo,
    body: Buffer
  ): Promise<void> {
    try {
      // 记录 userId 到 session（用于断线通知）
      if (head.UserID > 0 && !session.userId) {
        session.userId = head.UserID;
        Logger.Debug(`[Gateway] 记录会话 UserID: ${head.UserID}`);
      }
      
      Logger.Debug(`[Gateway] 处理数据包: CMD=${head.CmdID}, UserID=${head.UserID}`);
      
      // 路由请求到对应的后端服务（可能返回多个响应）
      const responses = await this._router.Route(head, body);

      Logger.Debug(`[Gateway] 收到 ${responses.length} 个响应: CMD=${head.CmdID}`);

      if (responses.length > 0 && session.socket.writable) {
        // 发送所有响应给客户端
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          Logger.Info(`[Gateway] 发送响应 ${i + 1}/${responses.length} 给客户端: CMD=${head.CmdID}, 大小=${response.length} 字节`);
          session.socket.write(response);
        }
      } else {
        if (responses.length === 0) {
          Logger.Warn(`[Gateway] 响应为空: CMD=${head.CmdID}`);
        }
        if (!session.socket.writable) {
          Logger.Warn(`[Gateway] Socket 不可写: CMD=${head.CmdID}`);
        }
      }
    } catch (err) {
      Logger.Error(`[Gateway] 处理数据包失败 CMD=${head.CmdID}`, err instanceof Error ? err : undefined);
    }
  }

  /**
   * 启动服务器
   */
  public async Start(): Promise<void> {
    if (this._running) return;

    Logger.Info('[Gateway] 正在启动...');

    // 调试：打印配置信息
    Logger.Info(`[Gateway] 配置信息: host=${Config.Gateway.host}, port=${Config.Gateway.port}, rpcPort=${Config.Gateway.rpcPort}`);

    // 初始化路由器（连接到后端服务）
    await this._router.Initialize();

    const port = Config.Gateway.port;
    const host = Config.Gateway.host;

    // 启动服务器
    await new Promise<void>((resolve) => {
      this._server.listen(port, host, () => {
        Logger.Info(`[Gateway] 服务器启动成功: ${host}:${port}`);
        resolve();
      });
    });

    this._running = true;
    Logger.Info('[Gateway] 启动成功');
  }

  /**
   * 停止服务器
   */
  public async Stop(): Promise<void> {
    if (!this._running) return;

    Logger.Info('[Gateway] 正在停止...');

    // 断开所有后端连接
    await this._router.Shutdown();

    // 关闭服务器
    await new Promise<void>((resolve) => {
      this._server.close(() => {
        Logger.Info('[Gateway] 服务器已停止');
        resolve();
      });
    });

    this._running = false;
    Logger.Info('[Gateway] 已停止');
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
