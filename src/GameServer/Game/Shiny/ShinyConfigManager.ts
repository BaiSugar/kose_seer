import { ConfigRegistry } from '../../../shared/config/ConfigRegistry';
import { ConfigKeys } from '../../../shared/config/ConfigDefinitions';
import { IShinyConfigFile, IShinyConfigItem } from '../../../shared/config/game/interfaces/IShinyConfig';
import { Logger } from '../../../shared/utils/Logger';

/**
 * 异色配置管理器
 * 负责加载、缓存和提供异色配置
 */
export class ShinyConfigManager {
  private static _instance: ShinyConfigManager;
  private _configs: Map<number, IShinyConfigItem> = new Map();
  private _version: number = 0;
  private _loaded: boolean = false;

  public static get Instance(): ShinyConfigManager {
    if (!ShinyConfigManager._instance) {
      ShinyConfigManager._instance = new ShinyConfigManager();
    }
    return ShinyConfigManager._instance;
  }

  /**
   * 加载异色配置
   */
  public async Load(): Promise<void> {
    if (this._loaded) {
      Logger.Debug('[ShinyConfigManager] 配置已加载，跳过');
      return;
    }

    try {
      const configFile = ConfigRegistry.Instance.Get<IShinyConfigFile>(ConfigKeys.SHINY_CONFIGS);
      if (!configFile) {
        Logger.Warn('[ShinyConfigManager] 异色配置文件未找到');
        return;
      }

      this._configs.clear();
      for (const config of configFile.configs) {
        if (config.enabled) {
          this._configs.set(config.shinyId, config);
        }
      }

      // 使用配置文件的 version 字段，如果没有则使用秒级时间戳
      this._version = configFile.version || Math.floor(Date.now() / 1000);
      this._loaded = true;
      Logger.Info(`[ShinyConfigManager] 加载了 ${this._configs.size} 个异色配置, version=${this._version}`);
    } catch (error) {
      Logger.Error('[ShinyConfigManager] 加载异色配置失败', error as Error);
    }
  }

  /**
   * 获取所有异色配置
   */
  public GetAllConfigs(): IShinyConfigItem[] {
    return Array.from(this._configs.values());
  }

  /**
   * 获取配置版本号
   */
  public GetVersion(): number {
    return this._version;
  }

  /**
   * 获取配置 JSON 字符串（用于发送给客户端）
   */
  public GetConfigJson(): string {
    const exportData = {
      version: this._version,
      configs: Array.from(this._configs.values())
    };
    return JSON.stringify(exportData);
  }

  /**
   * 获取指定异色配置
   */
  public GetConfig(shinyId: number): IShinyConfigItem | undefined {
    return this._configs.get(shinyId);
  }

  /**
   * 配置是否已加载
   */
  public IsLoaded(): boolean {
    return this._loaded;
  }

  /**
   * 热重载配置
   */
  public async Reload(): Promise<void> {
    this._loaded = false;  // 重置加载状态
    await ConfigRegistry.Instance.Reload(ConfigKeys.SHINY_CONFIGS);
    await this.Load();
    Logger.Info('[ShinyConfigManager] 配置已热重载');
  }

  /**
   * 获取统计信息
   */
  public GetStats(): { total: number; version: number } {
    return {
      total: this._configs.size,
      version: this._version
    };
  }
}
