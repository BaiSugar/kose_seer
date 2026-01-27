/**
 * RPC客户端
 * 用于Gateway与后端服务通信
 */
import { Socket, createConnection } from 'net';
import { Logger } from '../../shared/utils';
import { HeadInfo, PacketParser, PacketBuilder } from '../../shared/protocol';

/**
 * 等待中的请求
 */
interface IPendingRequest {
  head: HeadInfo;
  resolve: (response: Buffer | null) => void;
  timeout: NodeJS.Timeout;
}

/**
 * RPC客户端
 */
export class RPCClient {
  private _serviceName: string;
  private _host: string;
  private _port: number;
  private _socket: Socket | null = null;
  private _connected: boolean = false;
  private _connecting: boolean = false;
  private _parser: PacketParser;
  private _packetBuilder: PacketBuilder;
  private _pendingRequests: Map<string, IPendingRequest> = new Map();
  private _reconnectTimer: NodeJS.Timeout | null = null;

  constructor(serviceName: string, host: string, port: number) {
    this._serviceName = serviceName;
    this._host = host;
    this._port = port;
    this._parser = new PacketParser();
    this._packetBuilder = new PacketBuilder();
  }

  /**
   * 连接到后端服务
   */
  public async Connect(): Promise<boolean> {
    if (this._connected) return true;
    if (this._connecting) return false;

    this._connecting = true;

    return new Promise((resolve) => {
      this._socket = createConnection({
        host: this._host,
        port: this._port,
      });

      this._socket.on('connect', () => {
        this._connected = true;
        this._connecting = false;
        Logger.Info(`[RPCClient] 已连接到 ${this._serviceName} ${this._host}:${this._port}`);
        resolve(true);
      });

      this._socket.on('data', (data) => {
        this.HandleResponse(data);
      });

      this._socket.on('error', (err) => {
        Logger.Error(`[RPCClient] ${this._serviceName} 连接错误`, err);
        this._connected = false;
        this._connecting = false;
        resolve(false);
      });

      this._socket.on('close', () => {
        Logger.Warn(`[RPCClient] ${this._serviceName} 连接已关闭`);
        this._connected = false;
        this._connecting = false;
        this.ScheduleReconnect();
      });

      // 连接超时
      setTimeout(() => {
        if (this._connecting) {
          this._connecting = false;
          this._socket?.destroy();
          Logger.Warn(`[RPCClient] ${this._serviceName} 连接超时`);
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
      Logger.Info(`[RPCClient] 尝试重新连接 ${this._serviceName}...`);
      await this.Connect();
    }, 5000);
  }

  /**
   * 转发请求到后端服务
   */
  public async Forward(head: HeadInfo, body: Buffer): Promise<Buffer | null> {
    // 按需连接
    if (!this._connected) {
      const connected = await this.Connect();
      if (!connected) {
        Logger.Error(`[RPCClient] 无法连接到 ${this._serviceName}`);
        return null;
      }
    }

    return new Promise((resolve) => {
      // 生成请求ID
      const requestId = `${head.CmdID}_${head.UserID}_${Date.now()}`;

      // 设置超时
      const timeout = setTimeout(() => {
        this._pendingRequests.delete(requestId);
        Logger.Warn(`[RPCClient] ${this._serviceName} 请求超时: CMD=${head.CmdID}`);
        resolve(null);
      }, 10000);

      // 保存等待中的请求
      this._pendingRequests.set(requestId, {
        head,
        resolve,
        timeout,
      });

      // 构建并发送请求
      const packet = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);

      if (this._socket && this._socket.writable) {
        this._socket.write(packet);
        Logger.Debug(`[RPCClient] 转发请求到 ${this._serviceName}: CMD=${head.CmdID}, UserID=${head.UserID}`);
      } else {
        clearTimeout(timeout);
        this._pendingRequests.delete(requestId);
        resolve(null);
      }
    });
  }

  /**
   * 处理后端服务的响应
   */
  private HandleResponse(data: Buffer): void {
    this._parser.Append(data);

    let packet;
    while ((packet = this._parser.TryParse()) !== null) {
      const { head, body } = packet;

      // 查找匹配的等待请求
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

        // 重新构建响应包
        const response = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
        matchedRequest.resolve(response);

        Logger.Debug(`[RPCClient] 收到 ${this._serviceName} 响应: CMD=${head.CmdID}, UserID=${head.UserID}`);
      } else {
        Logger.Warn(`[RPCClient] 收到 ${this._serviceName} 未匹配的响应: CMD=${head.CmdID}`);
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
