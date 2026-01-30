import { Logger } from '../utils';
import { ConfigLoader } from './ConfigLoader';
import { ConfigType } from './ConfigDefinitions';

/**
 * 配置注册表
 * 管理所有游戏配置的注册和加载
 */
export class ConfigRegistry {
  private static _instance: ConfigRegistry;
  private _configs: Map<string, any> = new Map();
  private _configPaths: Map<string, string> = new Map();
  private _configTypes: Map<string, ConfigType> = new Map();
  private _initialized: boolean = false;

  private constructor() {}

  public static get Instance(): ConfigRegistry {
    if (!ConfigRegistry._instance) {
      ConfigRegistry._instance = new ConfigRegistry();
    }
    return ConfigRegistry._instance;
  }

  /**
   * 注册配置
   * @param key 配置键名
   * @param path 配置文件路径（相对于config目录）
   * @param type 配置类型（JSON或XML）
   */
  public Register(key: string, path: string, type: ConfigType = ConfigType.JSON): void {
    this._configPaths.set(key, path);
    this._configTypes.set(key, type);
    Logger.Info(`[ConfigRegistry] 注册配置: ${key} -> ${path} (${type})`);
  }

  /**
   * 批量注册配置
   */
  public RegisterBatch(configs: Array<{ key: string; path: string; type?: ConfigType }>): void {
    for (const config of configs) {
      this.Register(config.key, config.path, config.type || ConfigType.JSON);
    }
  }

  /**
   * 初始化所有配置（在服务启动时调用）
   */
  public async Initialize(): Promise<void> {
    if (this._initialized) {
      Logger.Warn('[ConfigRegistry] 配置已初始化，跳过');
      return;
    }

    Logger.Info('[ConfigRegistry] 开始加载所有配置...');
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    for (const [key, path] of this._configPaths.entries()) {
      try {
        const type = this._configTypes.get(key) || ConfigType.JSON;
        let config: any = null;

        if (type === ConfigType.XML) {
          config = ConfigLoader.Instance.LoadXmlSync(path);
        } else {
          config = ConfigLoader.Instance.LoadJson(path);
        }

        if (config) {
          this._configs.set(key, config);
          successCount++;
          Logger.Info(`[ConfigRegistry] ✓ ${key}`);
        } else {
          failCount++;
          Logger.Warn(`[ConfigRegistry] ✗ ${key} (文件不存在或格式错误)`);
        }
      } catch (error) {
        failCount++;
        Logger.Error(`[ConfigRegistry] ✗ ${key} 加载失败`, error as Error);
      }
    }

    const elapsed = Date.now() - startTime;
    this._initialized = true;

    Logger.Info(
      `[ConfigRegistry] 配置加载完成: 成功=${successCount}, 失败=${failCount}, 耗时=${elapsed}ms`
    );
  }

  /**
   * 获取配置
   * @param key 配置键名
   * @returns 配置对象
   */
  public Get<T = any>(key: string): T | null {
    if (!this._initialized) {
      Logger.Warn(`[ConfigRegistry] 配置未初始化，尝试获取: ${key}`);
    }

    const config = this._configs.get(key);
    if (!config) {
      Logger.Warn(`[ConfigRegistry] 配置不存在: ${key}`);
      return null;
    }

    return config as T;
  }

  /**
   * 重新加载指定配置
   * @param key 配置键名
   */
  public async Reload(key: string): Promise<boolean> {
    const path = this._configPaths.get(key);
    if (!path) {
      Logger.Error(`[ConfigRegistry] 配置未注册: ${key}`);
      return false;
    }

    try {
      Logger.Info(`[ConfigRegistry] 开始重新加载配置: ${key} (路径: ${path})`);
      
      // 清除ConfigLoader缓存
      ConfigLoader.Instance.Reload(path);

      // 重新加载
      const type = this._configTypes.get(key) || ConfigType.JSON;
      let config: any = null;

      if (type === ConfigType.XML) {
        config = await ConfigLoader.Instance.LoadXml(path);
      } else {
        config = ConfigLoader.Instance.LoadJson(path);
      }

      if (config) {
        this._configs.set(key, config);
        Logger.Info(`[ConfigRegistry] ✓ 重新加载配置成功: ${key} (类型: ${type})`);
        return true;
      } else {
        Logger.Error(`[ConfigRegistry] ✗ 重新加载配置失败: ${key} (配置为空)`);
        return false;
      }
    } catch (error) {
      Logger.Error(`[ConfigRegistry] ✗ 重新加载配置异常: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * 重新加载所有配置
   */
  public async ReloadAll(): Promise<void> {
    Logger.Info('[ConfigRegistry] 重新加载所有配置...');
    this._configs.clear();
    this._initialized = false;
    ConfigLoader.Instance.Reload();
    await this.Initialize();
  }

  /**
   * 检查配置是否已加载
   */
  public IsLoaded(key: string): boolean {
    return this._configs.has(key);
  }

  /**
   * 获取所有已注册的配置键名
   */
  public GetRegisteredKeys(): string[] {
    return Array.from(this._configPaths.keys());
  }

  /**
   * 获取配置统计信息
   */
  public GetStats(): {
    registered: number;
    loaded: number;
    initialized: boolean;
  } {
    return {
      registered: this._configPaths.size,
      loaded: this._configs.size,
      initialized: this._initialized,
    };
  }

  /**
   * 重载指定配置（别名方法，用于GM Server）
   */
  public async ReloadConfig(key: string): Promise<boolean> {
    return await this.Reload(key);
  }

  /**
   * 获取所有配置（用于GM Server）
   */
  public GetAllConfigs(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this._configs.entries()) {
      result[key] = value;
    }
    return result;
  }
}
