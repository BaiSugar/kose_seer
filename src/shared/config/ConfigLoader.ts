import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { Logger } from '../utils';

/**
 * 配置加载器
 * 负责加载和管理游戏配置文件
 */
export class ConfigLoader {
  private static _instance: ConfigLoader;
  private _configCache: Map<string, any> = new Map();
  private _configDir: string;

  private constructor() {
    // 配置文件目录：项目根目录/config
    this._configDir = path.join(process.cwd(), 'config');
    Logger.Info(`[ConfigLoader] 配置目录: ${this._configDir}`);
  }

  public static get Instance(): ConfigLoader {
    if (!ConfigLoader._instance) {
      ConfigLoader._instance = new ConfigLoader();
    }
    return ConfigLoader._instance;
  }

  /**
   * 静态方法：加载配置文件（兼容旧API）
   * @param filename 配置文件名
   * @param defaultConfig 默认配置
   * @returns 配置对象
   */
  public static Load<T>(filename: string, defaultConfig: T): T {
    return ConfigLoader.Instance.LoadWithDefault(filename, defaultConfig);
  }

  /**
   * 加载配置文件并提供默认值
   * @param filename 配置文件名（相对于config目录）
   * @param defaultConfig 默认配置
   * @returns 配置对象
   */
  public LoadWithDefault<T>(filename: string, defaultConfig: T): T {
    const config = this.LoadJson<T>(filename);
    return config || defaultConfig;
  }

  /**
   * 加载JSON配置文件
   * @param relativePath 相对于config目录的路径，如 'game/map-ogres.json'
   * @returns 配置对象
   */
  public LoadJson<T = any>(relativePath: string): T | null {
    // 检查缓存
    if (this._configCache.has(relativePath)) {
      return this._configCache.get(relativePath) as T;
    }

    const fullPath = path.join(this._configDir, relativePath);

    try {
      if (!fs.existsSync(fullPath)) {
        Logger.Warn(`[ConfigLoader] 配置文件不存在: ${fullPath}`);
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const config = JSON.parse(content) as T;

      // 缓存配置
      this._configCache.set(relativePath, config);

      Logger.Info(`[ConfigLoader] 加载配置: ${relativePath}`);
      return config;
    } catch (error) {
      Logger.Error(`[ConfigLoader] 加载配置失败: ${relativePath}`, error as Error);
      return null;
    }
  }

  /**
   * 重新加载配置（清除缓存）
   * @param relativePath 相对路径，如果不指定则清除所有缓存
   */
  public Reload(relativePath?: string): void {
    if (relativePath) {
      this._configCache.delete(relativePath);
      Logger.Info(`[ConfigLoader] 重新加载配置: ${relativePath}`);
    } else {
      this._configCache.clear();
      Logger.Info(`[ConfigLoader] 清除所有配置缓存`);
    }
  }

  /**
   * 获取配置目录路径
   */
  public GetConfigDir(): string {
    return this._configDir;
  }

  /**
   * 检查配置文件是否存在
   */
  public Exists(relativePath: string): boolean {
    const fullPath = path.join(this._configDir, relativePath);
    return fs.existsSync(fullPath);
  }

  /**
   * 加载XML配置文件
   * @param relativePath 相对于config目录的路径，如 'data/pets.xml'
   * @returns 配置对象
   */
  public async LoadXml<T = any>(relativePath: string): Promise<T | null> {
    // 检查缓存
    if (this._configCache.has(relativePath)) {
      return this._configCache.get(relativePath) as T;
    }

    const fullPath = path.join(this._configDir, relativePath);

    try {
      if (!fs.existsSync(fullPath)) {
        Logger.Warn(`[ConfigLoader] XML配置文件不存在: ${fullPath}`);
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        attrValueProcessors: [
          (value) => {
            // 尝试转换数字
            const num = Number(value);
            if (!isNaN(num)) {
              return num;
            }
            return value;
          }
        ]
      });

      const result = await parser.parseStringPromise(content);
      const config = result as T;

      // 缓存配置
      this._configCache.set(relativePath, config);

      Logger.Info(`[ConfigLoader] 加载XML配置: ${relativePath}`);
      return config;
    } catch (error) {
      Logger.Error(`[ConfigLoader] 加载XML配置失败: ${relativePath}`, error as Error);
      return null;
    }
  }

  /**
   * 同步加载XML配置文件（用于启动时加载）
   * @param relativePath 相对于config目录的路径
   * @returns 配置对象
   */
  public LoadXmlSync<T = any>(relativePath: string): T | null {
    // 检查缓存
    if (this._configCache.has(relativePath)) {
      return this._configCache.get(relativePath) as T;
    }

    const fullPath = path.join(this._configDir, relativePath);

    try {
      if (!fs.existsSync(fullPath)) {
        Logger.Warn(`[ConfigLoader] XML配置文件不存在: ${fullPath}`);
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        attrValueProcessors: [
          (value) => {
            // 尝试转换数字
            const num = Number(value);
            if (!isNaN(num)) {
              return num;
            }
            return value;
          }
        ]
      });

      let config: T | null = null;
      parser.parseString(content, (err, result) => {
        if (err) {
          throw err;
        }
        config = result as T;
      });

      if (config) {
        // 缓存配置
        this._configCache.set(relativePath, config);
        Logger.Info(`[ConfigLoader] 加载XML配置: ${relativePath}`);
      }

      return config;
    } catch (error) {
      Logger.Error(`[ConfigLoader] 加载XML配置失败: ${relativePath}`, error as Error);
      return null;
    }
  }
}
