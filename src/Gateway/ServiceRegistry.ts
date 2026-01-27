/**
 * 服务注册中心
 * 管理后端服务的注册和连接
 */
import { Socket } from 'net';
import { Logger } from '../shared/utils';
import { PacketParser, HeadInfo } from '../shared/protocol';

/**
 * 注册的服务信息
 */
export interface IRegisteredService {
  name: string;
  type: 'regist' | 'game' | 'email';
  socket: Socket;
  parser: PacketParser;
  address: string;
  connectedAt: number;
  pendingRequests: Map<string, any>;
}

/**
 * 服务注册中心
 */
export class ServiceRegistry {
  private _services: Map<string, IRegisteredService> = new Map();

  /**
   * 注册服务
   */
  public RegisterService(
    type: 'regist' | 'game' | 'email',
    socket: Socket
  ): IRegisteredService {
    const address = `${socket.remoteAddress}:${socket.remotePort}`;
    const name = `${type}_${Date.now()}`;

    const service: IRegisteredService = {
      name,
      type,
      socket,
      parser: new PacketParser(),
      address,
      connectedAt: Date.now(),
      pendingRequests: new Map(),
    };

    this._services.set(type, service);
    Logger.Info(`[ServiceRegistry] 服务注册: ${type} (${address})`);

    return service;
  }

  /**
   * 注销服务
   */
  public UnregisterService(type: string): void {
    const service = this._services.get(type);
    if (service) {
      this._services.delete(type);
      Logger.Info(`[ServiceRegistry] 服务注销: ${type}`);
    }
  }

  /**
   * 获取服务
   */
  public GetService(type: 'regist' | 'game' | 'email'): IRegisteredService | undefined {
    return this._services.get(type);
  }

  /**
   * 检查服务是否可用
   */
  public IsServiceAvailable(type: 'regist' | 'game' | 'email'): boolean {
    const service = this._services.get(type);
    return service !== undefined && service.socket.writable;
  }

  /**
   * 获取所有服务
   */
  public GetAllServices(): IRegisteredService[] {
    return Array.from(this._services.values());
  }

  /**
   * 清理所有服务
   */
  public Clear(): void {
    for (const service of this._services.values()) {
      service.socket.destroy();
    }
    this._services.clear();
  }
}
