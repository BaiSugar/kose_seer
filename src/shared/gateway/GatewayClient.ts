/**
 * Gateway客户端
 * 后端服务使用此客户端连接到Gateway并注册
 */
import { Socket, createConnection } from 'net';
import { Logger } from '../utils';
import { PacketParser, PacketBuilder, HeadInfo } from '../protocol';

/**
 * Gateway客户端
 */
export class GatewayClient {
  private _serviceName: string;
  private _serviceType: 'regist' | 'game' | 'email';
  private _gatewayHost: string;
  private _gatewayPort: number;
  private _socket: Socket | null = null;
  private _connected: boolean = false;
  private _parser: PacketParser;
  private _packetBuilder: PacketBuilder;
  private _reconnectTimer: NodeJS.Timeout | null = null;
  private _onRequest: ((head: HeadInfo, body: Buffer) => Promise<Buffer | null>) | null = null;

  constructor(
    serviceName: string,
    serviceType: 'regist' | 'game' | 'email',
    gatewayHost: string,
    gatewayPort: number
  ) {
    this._serviceName = serviceName;
    this._serviceType = serviceType;
    this._gatewayHost = gatewayHost;
    this._gatewayPort = gatewayPort;
    this._parser = new PacketParser();
    this._packetBuilder = new PacketBuilder();
  }

  /**
   * 设置请求处理器
   */
  public SetRequestHandler(handler: (head: HeadInfo, body: Buffer) => Promise<Buffer | null>): void {
    this._onRequest = handler;
  }

  /**
   * 连接到Gateway并注册
   */
  public async Connect(): Promise<boolean> {
    if (this._connected) return true;

    return new Promise((resolve) => {
      this._socket = createConnection({
        host: this._gatewayHost,
        port: this._gatewayPort,
      });

      this._socket.on('connect', () => {
        Logger.Info(`[GatewayClient] 已连接到Gateway ${this._gatewayHost}:${this._gatewayPort}`);
        
        // 发送注册请求
        const registerCmdID = this.GetRegisterCmdID();
        const registerPacket = this._packetBuilder.Build(registerCmdID, 0, 0, Buffer.from(this._serviceName));
        this._socket!.write(registerPacket);
      });

      this._socket.on('data', (data) => {
        this.HandleData(data, resolve);
      });

      this._socket.on('error', (err) => {
        Logger.Error(`[GatewayClient] 连接错误`, err);
        this._connected = false;
        resolve(false);
      });

      this._socket.on('close', () => {
        Logger.Warn(`[GatewayClient] 连接已关闭`);
        this._connected = false;
        this.ScheduleReconnect();
      });

      // 连接超时
      setTimeout(() => {
        if (!this._connected) {
          this._socket?.destroy();
          Logger.Warn(`[GatewayClient] 连接超时`);
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * 获取注册命令ID
   */
  private GetRegisterCmdID(): number {
    switch (this._serviceType) {
      case 'regist': return 10001; // SERVICE_REGISTER_REGIST
      case 'game': return 10002;   // SERVICE_REGISTER_GAME
      case 'email': return 10003;  // SERVICE_REGISTER_EMAIL
      default: return 10000;
    }
  }

  /**
   * 处理接收到的数据
   */
  private HandleData(data: Buffer, connectResolve?: (value: boolean) => void): void {
    this._parser.Append(data);

    let packet;
    while ((packet = this._parser.TryParse()) !== null) {
      const { head, body } = packet;

      // 如果是注册响应
      if (!this._connected && head.CmdID === this.GetRegisterCmdID()) {
        this._connected = true;
        Logger.Info(`[GatewayClient] 注册成功: ${this._serviceName}`);
        if (connectResolve) {
          connectResolve(true);
        }
        continue;
      }

      // 处理Gateway转发的请求
      if (this._onRequest) {
        this._onRequest(head, body).then((response) => {
          if (response && this._socket && this._socket.writable) {
            this._socket.write(response);
          }
        }).catch((err) => {
          Logger.Error(`[GatewayClient] 处理请求失败 CMD=${head.CmdID}`, err);
        });
      }
    }
  }

  /**
   * 计划重连
   */
  private ScheduleReconnect(): void {
    if (this._reconnectTimer) return;

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      Logger.Info(`[GatewayClient] 尝试重新连接Gateway...`);
      await this.Connect();
    }, 5000);
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
  }

  /**
   * 是否已连接
   */
  public get IsConnected(): boolean {
    return this._connected;
  }
}
