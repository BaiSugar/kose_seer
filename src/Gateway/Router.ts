/**
 * Gateway路由器
 * 负责将请求路由到对应的后端服务
 */
import { Logger } from '../shared/utils';
import { Config } from '../shared/config';
import { HeadInfo, CommandID, PacketBuilder } from '../shared/protocol';
import { ServiceRegistry } from './ServiceRegistry';
import { createServer, Server } from 'net';

/**
 * 路由器
 */
export class Router {
  private _registry: ServiceRegistry;
  private _rpcServer: Server;
  private _packetBuilder: PacketBuilder;

  constructor() {
    this._registry = new ServiceRegistry();
    this._rpcServer = createServer();
    this._packetBuilder = new PacketBuilder();
  }

  /**
   * 初始化路由器（启动RPC服务器，等待后端服务连接）
   */
  public async Initialize(): Promise<void> {
    Logger.Info('[Router] 启动RPC服务器，等待后端服务注册...');

    // 启动RPC服务器，监听后端服务连接
    await new Promise<void>((resolve) => {
      this._rpcServer.listen(Config.Gateway.rpcPort || 50000, Config.Gateway.host, () => {
        Logger.Info(`[Router] RPC服务器启动 ${Config.Gateway.host}:${Config.Gateway.rpcPort || 50000}`);
        resolve();
      });
    });

    // 处理后端服务连接
    this._rpcServer.on('connection', (socket) => {
      const address = `${socket.remoteAddress}:${socket.remotePort}`;
      Logger.Info(`[Router] 后端服务连接: ${address}`);

      // 等待服务发送注册信息
      let registered = false;
      const tempParser = new (require('../shared/protocol').PacketParser)();

      socket.on('data', (data) => {
        if (!registered) {
          // 第一个数据包应该是注册信息
          tempParser.Append(data);
          const packet = tempParser.TryParse();
          
          if (packet) {
            // 使用特殊的命令ID来识别服务类型
            // 例如: CmdID=9001表示RegistServer, 9002表示GameServer
            const serviceType = this.DetermineServiceType(packet.head.CmdID);
            
            if (serviceType) {
              const service = this._registry.RegisterService(serviceType, socket);
              registered = true;
              
              // 发送注册确认
              const response = this._packetBuilder.Build(packet.head.CmdID, 0, 0, Buffer.from('OK'));
              socket.write(response);
              
              // 设置数据处理
              socket.on('data', (responseData) => {
                this.HandleServiceResponse(service, responseData);
              });
            }
          }
        }
      });

      socket.on('error', (err) => {
        Logger.Error(`[Router] 后端服务错误: ${address}`, err);
      });

      socket.on('close', () => {
        Logger.Info(`[Router] 后端服务断开: ${address}`);
        // 查找并注销服务
        for (const service of this._registry.GetAllServices()) {
          if (service.socket === socket) {
            this._registry.UnregisterService(service.type);
            break;
          }
        }
      });
    });

    Logger.Info('[Router] 路由器初始化完成');
  }

  /**
   * 根据命令ID确定服务类型
   */
  private DetermineServiceType(cmdID: number): 'regist' | 'game' | 'email' | null {
    if (cmdID === 10001) return 'regist'; // SERVICE_REGISTER_REGIST
    if (cmdID === 10002) return 'game';   // SERVICE_REGISTER_GAME
    if (cmdID === 10003) return 'email';  // SERVICE_REGISTER_EMAIL
    return null;
  }

  /**
   * 处理服务响应
   */
  private HandleServiceResponse(service: any, data: Buffer): void {
    service.parser.Append(data);

    let packet;
    while ((packet = service.parser.TryParse()) !== null) {
      const { head, body } = packet;

      // 查找匹配的等待请求
      let matchedKey: string | null = null;

      for (const [key, request] of service.pendingRequests) {
        if (request.head.CmdID === head.CmdID) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        const request = service.pendingRequests.get(matchedKey);
        clearTimeout(request.timeout);
        service.pendingRequests.delete(matchedKey);

        // 重新构建响应包
        const response = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
        request.resolve(response);

        Logger.Debug(`[Router] 收到 ${service.type} 响应: CMD=${head.CmdID}`);
      }
    }
  }

  /**
   * 路由请求到对应的后端服务
   */
  public async Route(head: HeadInfo, body: Buffer, serverType: 'login' | 'game'): Promise<Buffer | null> {
    // 判断命令应该路由到哪个服务
    const targetServiceType = this.DetermineTargetService(head.CmdID, serverType);

    if (!targetServiceType) {
      Logger.Warn(`[Router] 未知的目标服务: CMD=${head.CmdID}`);
      return null;
    }

    const service = this._registry.GetService(targetServiceType);
    
    if (!service || !service.socket.writable) {
      Logger.Error(`[Router] 服务不可用: ${targetServiceType}`);
      return null;
    }

    return new Promise((resolve) => {
      // 生成请求ID
      const requestId = `${head.CmdID}_${head.UserID}_${Date.now()}`;

      // 设置超时
      const timeout = setTimeout(() => {
        service.pendingRequests.delete(requestId);
        Logger.Warn(`[Router] ${targetServiceType} 请求超时: CMD=${head.CmdID}`);
        resolve(null);
      }, 10000);

      // 保存等待中的请求
      service.pendingRequests.set(requestId, {
        head,
        resolve,
        timeout,
      });

      // 构建并发送请求
      const packet = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
      service.socket.write(packet);
      
      Logger.Debug(`[Router] 转发请求到 ${targetServiceType}: CMD=${head.CmdID}`);
    });
  }

  /**
   * 确定目标服务
   */
  private DetermineTargetService(cmdID: number, serverType: 'login' | 'game'): 'regist' | 'game' | null {
    // 注册相关命令路由到RegistServer
    const registCommands: Set<number> = new Set([
      CommandID.REGISTER,         // 2 - 注册账号
      CommandID.SEND_EMAIL_CODE,  // 3 - 发送邮箱验证码
      CommandID.REQUEST_REGISTER, // 1003 - 请求注册
    ]);

    if (registCommands.has(cmdID)) {
      return 'regist';
    }

    // 登录服务器的其他命令路由到GameServer（如服务器列表查询）
    if (serverType === 'login') {
      return 'game';
    }

    // 游戏服务器的命令路由到GameServer
    if (serverType === 'game') {
      return 'game';
    }

    return null;
  }

  /**
   * 关闭所有连接
   */
  public async Shutdown(): Promise<void> {
    Logger.Info('[Router] 正在关闭RPC服务器...');
    
    this._registry.Clear();
    
    await new Promise<void>((resolve) => {
      this._rpcServer.close(() => {
        Logger.Info('[Router] RPC服务器已关闭');
        resolve();
      });
    });
  }
}
