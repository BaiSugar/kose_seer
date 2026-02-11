import { ConfigRegistry } from './ConfigRegistry';
import { ConfigKeys } from './ConfigDefinitions';

/**
 * 服务器基础信息接口（仅静态配置）
 */
export interface IServerBaseInfo {
  onlineID: number;   // 服务器ID
  ip: string;         // 服务器IP
  port: number;       // 服务器端口
}

/**
 * 客户端配置接口
 */
export interface IClientConfig {
  servers: IServerBaseInfo[];
}

/**
 * 客户端配置管理器
 * 用于管理发送给客户端的服务器列表（仅静态配置）
 * userCnt 和 friends 需要实时获取
 */
export class ClientConfig {
  private static _instance: ClientConfig;

  private constructor() {}

  public static get Instance(): ClientConfig {
    if (!ClientConfig._instance) {
      ClientConfig._instance = new ClientConfig();
    }
    return ClientConfig._instance;
  }

  /**
   * 获取服务器基础配置列表
   */
  public get Servers(): IServerBaseInfo[] {
    const config = ConfigRegistry.Instance.Get<IClientConfig>(ConfigKeys.CLIENT_CONFIG);
    
    if (!config || !config.servers || config.servers.length === 0) {
      return this.GetDefaultServers();
    }
    
    return config.servers;
  }

  /**
   * 获取默认服务器配置
   */
  private GetDefaultServers(): IServerBaseInfo[] {
    return [
      {
        onlineID: 1,
        ip: '127.0.0.1',
        port: 9999
      }
    ];
  }
}
