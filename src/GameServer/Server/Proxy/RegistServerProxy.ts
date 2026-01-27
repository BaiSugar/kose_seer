/**
 * 注册服务器代理
 * 负责将注册相关命令转发到 RegistServer
 */
import { Socket, createConnection } from 'net';
import { Logger } from '../../../shared/utils';
import { Config } from '../../../shared/config';
import { PacketParser, PacketBuilder, HeadInfo, CommandID } from '../../../shared/protocol';

// 需要转发的命令ID
const FORWARD_COMMANDS: Set<number> = new Set([
  CommandID.REGISTER,         // 2 - 注册账号
  CommandID.SEND_EMAIL_CODE,  // 3 - 发送邮箱验证码
  CommandID.REQUEST_REGISTER, // 1003 - 请求注册
]);

/**
 * 等待中的请求
 */
interface IPendingRequest {
  clientSocket: Socket;
  head: HeadInfo;
  resolve: (response: Buffer | null) => void;
  timeout: NodeJS.Timeout;
}

/**
 * 注册服务器代理 (单例)
 */
export class RegistServerProxy {
  private static _instance: RegistServerProxy;
  private _socket: Socket | null = null;
  private _connected: boolean = false;
  private _connecting: boolean = false;
  private _parser: PacketParser;
  private _packetBuilder: PacketBuilder;
  private _pendingRequests: Map<string, IPendingRequest> = new Map();
  private _reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this._parser = new PacketParser();
    this._packetBuilder = new PacketBuilder();
  }

  /**
   * 获取单例实例
   */
  public static get Instance(): RegistServerProxy {
    if (!RegistServerProxy._instance) {
      RegistServerProxy._instance = new RegistServerProxy();
    }
    return RegistServerProxy._instance;
  }

  /**
   * 检查命令是否需要转发
   */
  public static ShouldForward(cmdID: number): boolean {
    return FORWARD_COMMANDS.has(cmdID);
  }

  /**
   * 连接到 RegistServer
   */
  public async Connect(): Promise<boolean> {
    if (this._connected) return true;
    if (this._connecting) return false;

    this._connecting = true;

    return new Promise((resolve) => {
      this._socket = createConnection({
        host: Config.Regist.host,
        port: Config.Regist.rpcPort,
      });

      this._socket.on('connect', () => {
        this._connected = true;
        this._connecting = false;
        Logger.Info(`[RegistServerProxy] 已连接到 RegistServer ${Config.Regist.host}:${Config.Regist.rpcPort}`);
        resolve(true);
      });

      this._socket.on('data', (data) => {
        this.HandleResponse(data);
      });

      this._socket.on('error', (err) => {
        Logger.Error('[RegistServerProxy] 连接错误', err);
        this._connected = false;
        this._connecting = false;
        resolve(false);
      });

      this._socket.on('close', () => {
        Logger.Warn('[RegistServerProxy] 连接已关闭');
        this._connected = false;
        this._connecting = false;
        this.ScheduleReconnect();
      });

      // 连接超时
      setTimeout(() => {
        if (this._connecting) {
          this._connecting = false;
          this._socket?.destroy();
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * 计划重连
   */
  private ScheduleReconnect(): void {
    if (this._reconnectTimer) return;

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      Logger.Info('[RegistServerProxy] 尝试重新连接...');
      await this.Connect();
    }, 5000);
  }

  /**
   * 转发请求到 RegistServer
   */
  public async Forward(clientSocket: Socket, head: HeadInfo, body: Buffer): Promise<Buffer | null> {
    // 确保已连接
    if (!this._connected) {
      const connected = await this.Connect();
      if (!connected) {
        Logger.Error('[RegistServerProxy] 无法连接到 RegistServer');
        return null;
      }
    }

    return new Promise((resolve) => {
      // 生成请求ID (使用 cmdID + userID + 时间戳)
      const requestId = `${head.CmdID}_${head.UserID}_${Date.now()}`;

      // 设置超时
      const timeout = setTimeout(() => {
        this._pendingRequests.delete(requestId);
        Logger.Warn(`[RegistServerProxy] 请求超时: CMD=${head.CmdID}`);
        resolve(null);
      }, 10000);

      // 保存等待中的请求
      this._pendingRequests.set(requestId, {
        clientSocket,
        head,
        resolve,
        timeout,
      });

      // 构建并发送请求到 RegistServer
      const packet = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);

      if (this._socket && this._socket.writable) {
        this._socket.write(packet);
        Logger.Debug(`[RegistServerProxy] 转发请求: CMD=${head.CmdID}, UserID=${head.UserID}`);
      } else {
        clearTimeout(timeout);
        this._pendingRequests.delete(requestId);
        resolve(null);
      }
    });
  }

  /**
   * 处理 RegistServer 的响应
   */
  private HandleResponse(data: Buffer): void {
    this._parser.Append(data);

    let packet;
    while ((packet = this._parser.TryParse()) !== null) {
      const { head, body } = packet;

      // 查找匹配的等待请求 (按 cmdID 匹配，因为 RegistServer 可能改变 userID)
      let matchedRequest: IPendingRequest | null = null;
      let matchedKey: string | null = null;

      for (const [key, request] of this._pendingRequests) {
        if (request.head.CmdID === head.CmdID) {
          matchedRequest = request;
          matchedKey = key;
          break;
        }
      }

      if (matchedRequest && matchedKey) {
        clearTimeout(matchedRequest.timeout);
        this._pendingRequests.delete(matchedKey);

        // 重新构建响应包 (保持原始格式)
        const response = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
        matchedRequest.resolve(response);

        Logger.Debug(`[RegistServerProxy] 收到响应: CMD=${head.CmdID}, UserID=${head.UserID}, Result=${head.Result}`);
      } else {
        Logger.Warn(`[RegistServerProxy] 收到未匹配的响应: CMD=${head.CmdID}`);
      }
    }
  }

  /**
   * 断开连接
   */
  public Disconnect(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if (this._socket) {
      this._socket.destroy();
      this._socket = null;
    }

    this._connected = false;
    this._connecting = false;

    // 清理所有等待中的请求
    for (const [, request] of this._pendingRequests) {
      clearTimeout(request.timeout);
      request.resolve(null);
    }
    this._pendingRequests.clear();
  }

  /**
   * 是否已连接
   */
  public get IsConnected(): boolean {
    return this._connected;
  }
}
