/**
 * Gateway服务器
 * 作为前端入口，负责接收客户端连接并路由到后端服务
 */
import { createServer, Server, Socket } from 'net';
import { Logger } from '../shared/utils';
import { Config } from '../shared/config';
import { HeadInfo, PacketParser, CommandID } from '../shared/protocol';
import { Router } from './Router';
import { GatewaySessionManager } from './SessionManager';
import { PolicyHandler } from './PolicyHandler';

/**
 * Gateway服务器
 */
export class GatewayServer {
  private _loginServer: Server;
  private _gameServer: Server;
  private _sessionManager: GatewaySessionManager;
  private _router: Router;
  private _running: boolean = false;

  constructor() {
    this._loginServer = createServer();
    this._gameServer = createServer();
    this._sessionManager = new GatewaySessionManager();
    this._router = new Router();
    
    this.SetupLoginServer();
    this.SetupGameServer();
  }

  /**
   * 设置登录服务器连接处理
   */
  private SetupLoginServer(): void {
    this._loginServer.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[Gateway] 登录服务器接入: ${address}`);

      const session = this._sessionManager.CreateSession(socket, 'login');

      socket.on('data', (data) => {
        this.HandleData(session, data, 'login');
      });

      socket.on('error', (err) => {
        Logger.Error(`[Gateway] 登录连接错误: ${address}`, err);
      });

      socket.on('close', () => {
        Logger.Info(`[Gateway] 登录连接断开: ${address}`);
        this._sessionManager.RemoveSession(session.id);
      });
    });
  }

  /**
   * 设置游戏服务器连接处理
   */
  private SetupGameServer(): void {
    this._gameServer.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[Gateway] 游戏服务器接入: ${address}`);

      const session = this._sessionManager.CreateSession(socket, 'game');

      socket.on('data', (data) => {
        this.HandleData(session, data, 'game');
      });

      socket.on('error', (err) => {
        Logger.Error(`[Gateway] 游戏连接错误: ${address}`, err);
      });

      socket.on('close', () => {
        Logger.Info(`[Gateway] 游戏连接断开: ${address}`);
        this._sessionManager.RemoveSession(session.id);
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  private HandleData(session: any, data: Buffer, serverType: 'login' | 'game'): void {
    // 检查是否是 Flash Socket Policy 请求
    if (!session.policyHandled) {
      if (PolicyHandler.Handle(session.socket, data, session.address)) {
        session.policyHandled = true;
        return;
      }
      session.policyHandled = true;
    }

    session.parser.Append(data);

    let packet;
    while ((packet = session.parser.TryParse()) !== null) {
      this.ProcessPacket(session, packet.head, packet.body, serverType);
    }
  }

  /**
   * 处理数据包
   */
  private async ProcessPacket(
    session: any,
    head: HeadInfo,
    body: Buffer,
    serverType: 'login' | 'game'
  ): Promise<void> {
    try {
      // 路由请求到对应的后端服务
      const response = await this._router.Route(head, body, serverType);

      if (response && session.socket.writable) {
        session.socket.write(response);
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

    // 初始化路由器（连接到后端服务）
    await this._router.Initialize();

    // 启动登录服务器
    await new Promise<void>((resolve) => {
      this._loginServer.listen(Config.Gateway.loginPort, Config.Gateway.host, () => {
        Logger.Info(`[Gateway] 登录服务器启动 ${Config.Gateway.host}:${Config.Gateway.loginPort}`);
        resolve();
      });
    });

    // 启动游戏服务器
    await new Promise<void>((resolve) => {
      this._gameServer.listen(Config.Gateway.gamePort, Config.Gateway.host, () => {
        Logger.Info(`[Gateway] 游戏服务器启动 ${Config.Gateway.host}:${Config.Gateway.gamePort}`);
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
      this._loginServer.close(() => {
        Logger.Info('[Gateway] 登录服务器已停止');
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      this._gameServer.close(() => {
        Logger.Info('[Gateway] 游戏服务器已停止');
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
