import { Logger } from '../utils';
import { ConfigLoader } from './ConfigLoader';
import { ConfigKeys, ConfigPaths } from './ConfigDefinitions';

/**
 * 服务配置接口
 */
export interface IServerConfig {
  services: {
    game: {
      enabled: boolean;
      port: number;
      host: string;
    };
    regist: {
      enabled: boolean;
    };
    email: {
      enabled: boolean;
    };
    gm: {
      enabled: boolean;
      port: number;
      host: string;
      localMode?: boolean;
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
    const configPath = ConfigPaths[ConfigKeys.SERVER_CONFIG];
    Logger.Info(`[ServerConfig] 正在加载配置: ${configPath}`);
    
    const config = ConfigLoader.Instance.LoadJson<IServerConfig>(configPath);
    
    if (!config) {
      Logger.Warn('[ServerConfig] 配置文件加载失败，使用默认配置');
      return this.GetDefaultConfig();
    }
    
    return config;
  }

  /**
   * 获取默认配置
   */
  private GetDefaultConfig(): IServerConfig {
    return {
      services: {
        game: {
          enabled: true,
          port: 9999,
          host: '0.0.0.0'
        },
        regist: {
          enabled: true
        },
        email: {
          enabled: true
        },
        gm: {
          enabled: true,
          port: 3002,
          host: '0.0.0.0',
          localMode: true
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
   * 获取GMServer配置
   */
  public get GM() {
    return this._config.services.gm;
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
    const configPath = ConfigPaths[ConfigKeys.SERVER_CONFIG];
    ConfigLoader.Instance.Reload(configPath);
    this._config = this.LoadConfig();
    Logger.Info('[ServerConfig] 配置已重新加载');
  }
}

// 导出单例
export const Config = ServerConfig.Instance;
