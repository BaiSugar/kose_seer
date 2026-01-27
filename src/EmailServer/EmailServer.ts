import { createServer, Server } from 'net';
import { Logger } from '../shared/utils';
import { Config } from '../shared/config';

/**
 * 邮件服务器 (预留)
 * 负责处理游戏内邮件系统
 */
export class EmailServer {
  private _server: Server;
  private _running: boolean = false;

  constructor() {
    this._server = createServer();
    this.SetupConnectionHandler();
  }

  private SetupConnectionHandler(): void {
    this._server.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[EmailServer] 客户端接入: ${address}`);

      socket.on('data', (_data) => {
        // TODO: 实现邮件协议处理
      });

      socket.on('error', (err) => {
        Logger.Error(`[EmailServer] Socket错误: ${address}`, err);
      });

      socket.on('close', () => {
        Logger.Info(`[EmailServer] 客户端断开: ${address}`);
      });
    });
  }

  /**
   * 启动服务器
   */
  public Start(): void {
    if (this._running) return;

    this._server.listen(Config.Email.rpcPort, Config.Email.host, () => {
      this._running = true;
      Logger.Info(`[EmailServer] 启动成功 ${Config.Email.host}:${Config.Email.rpcPort}`);
    });
  }

  /**
   * 停止服务器
   */
  public Stop(): void {
    if (!this._running) return;

    this._server.close(() => {
      this._running = false;
      Logger.Info('[EmailServer] 已停止');
    });
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
