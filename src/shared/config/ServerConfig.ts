import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils';

/**
 * 服务配置接口
 */
export interface IServerConfig {
  services: {
    gateway: {
      enabled: boolean;
      loginPort: number;
      gamePort: number;
      rpcPort: number;
      host: string;
    };
    regist: {
      enabled: boolean;
      rpcPort: number;
      host: string;
    };
    game: {
      enabled: boolean;
      rpcPort: number;
      host: string;
    };
    email: {
      enabled: boolean;
      rpcPort: number;
      host: string;
    };
    proxy: {
      enabled: boolean;
      listenPort: number;
      listenHost: string;
      webPort: number;
      loginServer: {
        host: string;
        port: number;
      };
      gameServer: {
        host: string;
        port: number;
      };
    };
  };
  database: {
    type: 'sqlite' | 'postgresql' | 'mysql';
    path?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    options?: {
      verbose?: boolean;
      [key: string]: any;
    };
  };
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    directory: string;
    maxFiles: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

/**
 * 服务器配置管理器
 */
export class ServerConfig {
  private static _instance: ServerConfig;
  private _config: IServerConfig;

  private constructor() {
    this._config = this.LoadConfig();
  }

  public static get Instance(): ServerConfig {
    if (!ServerConfig._instance) {
      ServerConfig._instance = new ServerConfig();
    }
    return ServerConfig._instance;
  }

  /**
   * 加载配置文件
   */
  private LoadConfig(): IServerConfig {
    try {
      const configPath = join(process.cwd(), 'config', 'server.json');
      const configData = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData) as IServerConfig;
      
      Logger.Info(`[ServerConfig] 配置文件加载成功: ${configPath}`);
      return config;
    } catch (error) {
      Logger.Error('[ServerConfig] 配置文件加载失败，使用默认配置', error as Error);
      return this.GetDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  private GetDefaultConfig(): IServerConfig {
    return {
      services: {
        gateway: {
          enabled: true,
          loginPort: 9999,
          gamePort: 27777,
          rpcPort: 50000,
          host: '0.0.0.0'
        },
        regist: {
          enabled: true,
          rpcPort: 50001,
          host: 'localhost'
        },
        game: {
          enabled: true,
          rpcPort: 50002,
          host: 'localhost'
        },
        email: {
          enabled: true,
          rpcPort: 50003,
          host: 'localhost'
        },
        proxy: {
          enabled: false,
          listenPort: 9000,
          listenHost: '127.0.0.1',
          webPort: 8080,
          loginServer: {
            host: '115.238.192.7',
            port: 9999
          },
          gameServer: {
            host: '115.238.192.7',
            port: 27777
          }
        }
      },
      database: {
        type: 'sqlite',
        path: 'data/seer.db',
        options: {
          verbose: false
        }
      },
      redis: {
        enabled: false,
        host: 'localhost',
        port: 6379,
        db: 0
      },
      logging: {
        level: 'info',
        directory: 'logs',
        maxFiles: 30
      },
      security: {
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        lockoutDuration: 300
      }
    };
  }

  /**
   * 获取完整配置
   */
  public get Config(): IServerConfig {
    return this._config;
  }

  /**
   * 获取Gateway配置
   */
  public get Gateway() {
    return this._config.services.gateway;
  }

  /**
   * 获取RegistServer配置
   */
  public get Regist() {
    return this._config.services.regist;
  }

  /**
   * 获取GameServer配置
   */
  public get Game() {
    return this._config.services.game;
  }

  /**
   * 获取EmailServer配置
   */
  public get Email() {
    return this._config.services.email;
  }

  /**
   * 获取ProxyServer配置
   */
  public get Proxy() {
    return this._config.services.proxy;
  }

  /**
   * 获取数据库配置
   */
  public get Database() {
    return this._config.database;
  }

  /**
   * 获取Redis配置
   */
  public get Redis() {
    return this._config.redis;
  }

  /**
   * 获取日志配置
   */
  public get Logging() {
    return this._config.logging;
  }

  /**
   * 获取安全配置
   */
  public get Security() {
    return this._config.security;
  }

  /**
   * 重新加载配置
   */
  public Reload(): void {
    this._config = this.LoadConfig();
    Logger.Info('[ServerConfig] 配置已重新加载');
  }
}

// 导出单例
export const Config = ServerConfig.Instance;
