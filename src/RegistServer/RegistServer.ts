/**
 * 注册服务器
 * 负责处理用户注册、账号验证等
 */
import { createServer, Server, Socket } from 'net';
import { Logger, BufferWriter } from '../shared/utils';
import { Config } from '../shared/config';
import { HeadInfo, PacketParser, PacketBuilder, CommandID } from '../shared/protocol';
import { DatabaseManager } from '../DataBase';
import { RegistManager, RegisterResult } from './RegistManager';
import { GatewayClient } from '../shared/gateway';

/**
 * 客户端会话信息
 */
interface IClientSession {
  socket: Socket;
  address: string;
  parser: PacketParser;
}

export class RegistServer {
  private _server: Server;
  private _running: boolean = false;
  private _manager: RegistManager;
  private _packetBuilder: PacketBuilder;
  private _gatewayClient: GatewayClient | null = null;

  constructor() {
    this._server = createServer();
    this._manager = new RegistManager();
    this._packetBuilder = new PacketBuilder();
    this.SetupConnectionHandler();
  }

  /**
   * 启动服务器
   */
  public async Start(): Promise<void> {
    if (this._running) return;

    // 初始化数据库
    await DatabaseManager.Instance.Initialize();

    this._server.listen(Config.Regist.rpcPort, Config.Regist.host, () => {
      this._running = true;
      Logger.Info(`[RegistServer] 启动成功 ${Config.Regist.host}:${Config.Regist.rpcPort}`);
    });

    // 定期清理过期验证码
    setInterval(() => {
      this._manager.CleanupExpiredCodes();
    }, 300000); // 5分钟

    // 连接到Gateway
    if (Config.Gateway.enabled) {
      this._gatewayClient = new GatewayClient(
        'RegistServer',
        'regist',
        Config.Gateway.host,
        Config.Gateway.rpcPort
      );

      // 设置请求处理器
      this._gatewayClient.SetRequestHandler(async (head, body) => {
        return await this.HandleGatewayRequest(head, body);
      });

      const connected = await this._gatewayClient.Connect();
      if (connected) {
        Logger.Info('[RegistServer] 已注册到Gateway');
      } else {
        Logger.Warn('[RegistServer] 无法连接到Gateway，将在后台重试');
      }
    }
  }

  /**
   * 处理来自Gateway的请求
   */
  private async HandleGatewayRequest(head: HeadInfo, body: Buffer): Promise<Buffer[]> {
    Logger.Info(`[RegistServer] 收到Gateway请求: ${head.CmdID} (${head.UserID})`);

    let response: Buffer | null = null;

    switch (head.CmdID) {
      case CommandID.REGISTER: // 2 - 注册账号
        response = await this.HandleRegister(head, body);
        break;
      case CommandID.SEND_EMAIL_CODE: // 3 - 发送邮箱验证码
        response = await this.HandleSendEmailCode(head, body);
        break;
      case CommandID.REQUEST_REGISTER: // 1003 - 请求注册
        response = await this.HandleRequestRegister(head);
        break;
      default:
        Logger.Warn(`[RegistServer] 未知命令: ${head.CmdID}`);
        break;
    }

    return response ? [response] : [];
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
      Logger.Info('[RegistServer] 已停止');
    });
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }

  /**
   * 设置连接处理器
   */
  private SetupConnectionHandler(): void {
    this._server.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[RegistServer] 客户端接入: ${address}`);

      const session: IClientSession = {
        socket,
        address,
        parser: new PacketParser()
      };

      socket.on('data', (data) => {
        this.HandleData(session, data);
      });

      socket.on('error', (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        Logger.Error(`[RegistServer] Socket错误: ${address}`, error);
      });

      socket.on('close', () => {
        Logger.Info(`[RegistServer] 客户端断开: ${address}`);
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  private async HandleData(session: IClientSession, data: Buffer): Promise<void> {
    try {
      // 追加数据到解析器
      session.parser.Append(data);

      // 尝试解析数据包
      let packet: { head: HeadInfo; body: Buffer } | null;
      while ((packet = session.parser.TryParse()) !== null) {
        const { head, body } = packet;

        Logger.Info(`[RegistServer] 收到命令: ${head.CmdID} (${head.UserID})`);

        let response: Buffer | null = null;

        switch (head.CmdID) {
          case CommandID.REGISTER: // 2 - 注册账号
            response = await this.HandleRegister(head, body);
            break;
          case CommandID.SEND_EMAIL_CODE: // 3 - 发送邮箱验证码
            response = await this.HandleSendEmailCode(head, body);
            break;
          case CommandID.REQUEST_REGISTER: // 1003 - 请求注册
            response = await this.HandleRequestRegister(head);
            break;
          default:
            Logger.Warn(`[RegistServer] 未知命令: ${head.CmdID}`);
            break;
        }

        if (response && session.socket.writable) {
          session.socket.write(response);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[RegistServer] 处理数据失败: ${session.address}`, error);
    }
  }

  /**
   * 处理注册请求 (REGISTER = 2)
   * 请求: password(32) + emailAddress(64) + emailCode(32) + emailCodeRes(32)
   * 响应: result=错误码 (0=成功), userID=新米米号
   *       客户端通过 ParseLoginSocketError.parse(result) 显示错误信息
   */
  private async HandleRegister(head: HeadInfo, body: Buffer): Promise<Buffer> {
    try {
      // 确保包体长度足够
      if (body.length < 160) {
        Logger.Warn('[RegistServer] 注册请求包体长度不足');
        return this._packetBuilder.Build(head.CmdID, 0, RegisterResult.SYSTEM_ERROR, Buffer.alloc(0));
      }

      // 解析请求 (需要移除null字节填充)
      const password = body.toString('utf8', 0, 32).replace(/\0/g, '').trim();       // 32字节密码
      const emailAddress = body.toString('utf8', 32, 96).replace(/\0/g, '').trim();  // 64字节邮箱
      const emailCode = body.toString('utf8', 96, 128).replace(/\0/g, '').trim();     // 32字节验证码
      const emailCodeRes = body.toString('utf8', 128, 160).replace(/\0/g, '').trim(); // 32字节验证码响应

      Logger.Info(`[RegistServer] 注册请求: email=${emailAddress}, password长度=${password.length}`);

      // 处理注册
      const result = await this._manager.HandleRegister(password, emailAddress, emailCode, emailCodeRes);

      // 构建响应 (result=错误码, userID=新米米号)
      return this._packetBuilder.Build(head.CmdID, result.userId, result.result, Buffer.alloc(0));

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistServer] 处理注册请求失败', error);

      return this._packetBuilder.Build(head.CmdID, 0, RegisterResult.SYSTEM_ERROR, Buffer.alloc(0));
    }
  }

  /**
   * 处理请求注册 (REQUEST_REGISTER = 1003)
   * 这个命令可能是用于获取注册信息或检查注册状态
   */
  private async HandleRequestRegister(head: HeadInfo): Promise<Buffer> {
    // 暂时返回成功响应
    return this._packetBuilder.Build(head.CmdID, 0, 0, Buffer.alloc(0));
  }

  /**
   * 处理发送邮箱验证码 (SEND_EMAIL_CODE = 3)
   * 请求: emailAddress(64)
   * 响应: emailCodeRes(32)
   */
  private async HandleSendEmailCode(head: HeadInfo, body: Buffer): Promise<Buffer> {
    try {
      // 确保包体长度足够
      if (body.length < 64) {
        Logger.Warn('[RegistServer] 发送验证码请求包体长度不足');
        return this._packetBuilder.Build(head.CmdID, 0, RegisterResult.SYSTEM_ERROR, Buffer.alloc(0));
      }

      // 解析请求
      const emailAddress = body.toString('utf8', 0, 64).replace(/\0/g, '').trim();

      Logger.Info(`[RegistServer] 发送验证码请求: email=${emailAddress}`);

      // 发送验证码
      const result = await this._manager.SendEmailCode(emailAddress);

      if (!result.success) {
        return this._packetBuilder.Build(head.CmdID, 0, result.error || RegisterResult.SYSTEM_ERROR, Buffer.alloc(0));
      }

      // 构建响应 - 返回验证码响应 (32字节)
      const writer = new BufferWriter(32);
      writer.WriteString(result.codeRes || '', 32);

      return this._packetBuilder.Build(head.CmdID, 0, 0, writer.ToBuffer());

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistServer] 处理发送验证码请求失败', error);

      return this._packetBuilder.Build(head.CmdID, 0, RegisterResult.SYSTEM_ERROR, Buffer.alloc(0));
    }
  }
}
