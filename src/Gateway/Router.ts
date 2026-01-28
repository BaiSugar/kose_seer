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
   * 处理服务响应（支持多个响应）
   */
  private HandleServiceResponse(service: any, data: Buffer): void {
    service.parser.Append(data);

    let packet;
    while ((packet = service.parser.TryParse()) !== null) {
      const { head, body } = packet;

      // 查找匹配的等待请求
      let matchedKey: string | null = null;

      // 对于登录相关的CMD，UserID可能在请求时为0，响应时才有真实值
      // 所以只用CmdID匹配，按FIFO顺序（第一个匹配的）
      const isLoginCommand = this.IsLoginCommand(head.CmdID);
      const isBattleResponse = this.IsBattleResponse(head.CmdID);

      for (const [key, request] of service.pendingRequests) {
        if (isLoginCommand) {
          // 登录命令：只匹配CmdID（FIFO）
          if (request.head.CmdID === head.CmdID) {
            matchedKey = key;
            break;
          }
        } else if (isBattleResponse) {
          // 战斗响应（2503-2506）：这些是通知包，匹配最近的战斗请求（2408, 2404-2411）
          if (this.IsBattleRequest(request.head.CmdID) && request.head.UserID === head.UserID) {
            matchedKey = key;
            break;
          }
        } else if (this.IsBattleRequest(head.CmdID)) {
          // 战斗请求的确认响应（如 2408 -> 2408）：精确匹配 CmdID 和 UserID
          if (request.head.CmdID === head.CmdID && request.head.UserID === head.UserID) {
            matchedKey = key;
            break;
          }
        } else {
          // 普通命令：只匹配 UserID（允许不同的 CmdID，支持多响应）
          // 这样 ENTER_MAP(2001) 可以收到 LIST_MAP_PLAYER(2003) 和 MAP_OGRE_LIST(2004)
          if (request.head.UserID === head.UserID) {
            matchedKey = key;
            break;
          }
        }
      }

      if (matchedKey) {
        const request = service.pendingRequests.get(matchedKey);
        
        // 重新构建响应包
        const response = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
        
        // 将响应添加到响应数组
        if (!request.responses) {
          request.responses = [];
        }
        request.responses.push(response);
        
        Logger.Debug(`[Router] 收到 ${service.type} 响应 ${request.responses.length}: CMD=${head.CmdID}, UserID=${head.UserID}`);
        
        // 清除旧的超时
        if (request.completionTimeout) {
          clearTimeout(request.completionTimeout);
        }
        
        // 设置响应完成超时（50ms 内如果没有新响应，则认为响应完成）
        request.completionTimeout = setTimeout(() => {
          // 超时后返回所有已收集的响应
          clearTimeout(request.timeout); // 清除主超时
          service.pendingRequests.delete(matchedKey!);
          request.resolve(request.responses || []);
          Logger.Debug(`[Router] 响应完成: 请求CMD=${request.head.CmdID}, 共 ${request.responses?.length || 0} 个响应`);
        }, 50); // 50ms 内如果没有新响应，则认为响应完成
        
      } else {
        Logger.Warn(`[Router] 收到未匹配的响应: CMD=${head.CmdID}, UserID=${head.UserID}, 当前等待请求数=${service.pendingRequests.size}`);
      }
    }
  }

  /**
   * 判断是否是登录相关命令（请求时UserID可能为0）
   */
  private IsLoginCommand(cmdID: number): boolean {
    return cmdID === CommandID.MAIN_LOGIN_IN ||      // 104 主登录
           cmdID === CommandID.REGISTER ||           // 2 注册
           cmdID === CommandID.SEND_EMAIL_CODE ||    // 3 发送验证码
           cmdID === CommandID.REQUEST_REGISTER;     // 1003 请求注册
  }

  /**
   * 判断是否是战斗请求命令
   */
  private IsBattleRequest(cmdID: number): boolean {
    return cmdID === CommandID.READY_TO_FIGHT ||      // 2404 准备战斗
           cmdID === CommandID.USE_SKILL ||           // 2405 使用技能
           cmdID === CommandID.USE_PET_ITEM ||        // 2406 使用道具
           cmdID === CommandID.CHANGE_PET ||          // 2407 更换精灵
           cmdID === CommandID.FIGHT_NPC_MONSTER ||   // 2408 挑战野怪
           cmdID === CommandID.CATCH_MONSTER ||       // 2409 捕捉精灵
           cmdID === CommandID.ESCAPE_FIGHT ||        // 2410 逃跑
           cmdID === CommandID.CHALLENGE_BOSS;        // 2411 挑战BOSS
  }

  /**
   * 判断是否是战斗响应/通知命令
   */
  private IsBattleResponse(cmdID: number): boolean {
    return cmdID === CommandID.NOTE_READY_TO_FIGHT || // 2503 准备战斗通知
           cmdID === CommandID.NOTE_START_FIGHT ||    // 2504 开始战斗通知
           cmdID === CommandID.NOTE_USE_SKILL ||      // 2505 使用技能通知
           cmdID === CommandID.FIGHT_OVER;            // 2506 战斗结束
  }

  /**
   * 路由请求到对应的后端服务（支持返回多个响应）
   */
  public async Route(head: HeadInfo, body: Buffer): Promise<Buffer[]> {
    Logger.Debug(`[Router] Route 被调用: CMD=${head.CmdID}, UserID=${head.UserID}`);
    
    // 判断命令应该路由到哪个服务
    const targetServiceType = this.DetermineTargetService(head.CmdID);
    Logger.Debug(`[Router] 目标服务类型: ${targetServiceType}`);

    if (!targetServiceType) {
      Logger.Warn(`[Router] 未知的目标服务: CMD=${head.CmdID}`);
      return [];
    }

    const service = this._registry.GetService(targetServiceType);
    Logger.Debug(`[Router] 获取服务: ${service ? 'found' : 'not found'}, writable=${service?.socket.writable}`);
    
    if (!service || !service.socket.writable) {
      Logger.Error(`[Router] 服务不可用: ${targetServiceType}, CMD=${head.CmdID}`);
      Logger.Error(`[Router] 当前已注册服务: ${Array.from(this._registry.GetAllServices()).map(s => s.type).join(', ') || '无'}`);
      return [];
    }

    Logger.Debug(`[Router] 准备转发请求到 ${targetServiceType}: CMD=${head.CmdID}`);
    
    return new Promise((resolve) => {
      try {
        Logger.Debug(`[Router] Promise 开始执行: CMD=${head.CmdID}`);
        
        // 生成请求ID
        const requestId = `${head.CmdID}_${head.UserID}_${Date.now()}`;
        Logger.Debug(`[Router] 生成请求ID: ${requestId}`);

        // 设置超时
        const timeout = setTimeout(() => {
          const request = service.pendingRequests.get(requestId);
          service.pendingRequests.delete(requestId);
          Logger.Warn(`[Router] ${targetServiceType} 请求超时: CMD=${head.CmdID}`);
          resolve(request?.responses || []);
        }, 10000);
        Logger.Debug(`[Router] 设置超时: 10秒`);

        // 保存等待中的请求
        service.pendingRequests.set(requestId, {
          head,
          resolve,
          timeout,
          responses: [], // 用于收集多个响应
        });
        Logger.Debug(`[Router] 保存等待请求: ${requestId}, 当前等待数=${service.pendingRequests.size}`);

        // 构建并发送请求
        Logger.Info(`[Router] 准备构建数据包: CMD=${head.CmdID}`);
        const packet = this._packetBuilder.Build(head.CmdID, head.UserID, head.Result, body);
        Logger.Info(`[Router] 数据包构建完成: CMD=${head.CmdID}, 大小=${packet.length} 字节`);
        
        Logger.Info(`[Router] 准备写入 socket: CMD=${head.CmdID}`);
        const writeResult = service.socket.write(packet);
        Logger.Info(`[Router] Socket.write 返回: ${writeResult}`);
        
        Logger.Info(`[Router] 转发请求到 ${targetServiceType}: CMD=${head.CmdID}`);
      } catch (err) {
        Logger.Error(`[Router] Promise 执行异常: CMD=${head.CmdID}`, err as Error);
        resolve([]);
      }
    });
  }

  /**
   * 确定目标服务
   */
  private DetermineTargetService(cmdID: number): 'regist' | 'game' | null {
    // 注册相关命令路由到RegistServer
    const registCommands: Set<number> = new Set([
      CommandID.REGISTER,         // 2 - 注册账号
      CommandID.SEND_EMAIL_CODE,  // 3 - 发送邮箱验证码
      CommandID.REQUEST_REGISTER, // 1003 - 请求注册
    ]);

    if (registCommands.has(cmdID)) {
      return 'regist';
    }

    // 其他所有命令路由到GameServer (包括 104 主登录, 108 创建角色)
    return 'game';
  }

  /**
   * 通知玩家断开连接
   */
  public async NotifyPlayerDisconnect(userID: number): Promise<void> {
    Logger.Info(`[Router] 通知玩家 ${userID} 断开连接`);
    
    const service = this._registry.GetService('game');
    if (!service || !service.socket.writable) {
      Logger.Warn(`[Router] GameServer 不可用，无法通知玩家下线: ${userID}`);
      return;
    }

    // 发送一个特殊的命令通知 GameServer 玩家下线
    // 使用 CMD 10004 (PLAYER_DISCONNECT)
    const packet = this._packetBuilder.Build(10004, userID, 0, Buffer.alloc(0));
    service.socket.write(packet);
    Logger.Info(`[Router] 已通知 GameServer 玩家 ${userID} 下线`);
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
