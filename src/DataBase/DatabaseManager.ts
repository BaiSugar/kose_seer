/**
 * 数据库管理器
 * 统一管理数据库连接和操作
 */
import { IDriver } from './drivers/IDriver';
import { MySQLDriver } from './drivers/MySQLDriver';
import { SQLiteDriver } from './drivers/SQLiteDriver';
import { Config } from '../shared/config';
import { Logger } from '../shared/utils';

export class DatabaseManager {
  private static _instance: DatabaseManager | null = null;
  private _driver: IDriver | null = null;

  private constructor() {
    // 使用统一配置
  }

  /**
   * 获取单例实例
   */
  public static get Instance(): DatabaseManager {
    if (!DatabaseManager._instance) {
      DatabaseManager._instance = new DatabaseManager();
    }
    return DatabaseManager._instance;
  }

  /**
   * 初始化数据库连接
   */
  public async Initialize(): Promise<void> {
    if (this._driver?.isConnected()) {
      Logger.Warn('[DatabaseManager] 数据库已连接');
      return;
    }

    const dbConfig = Config.Database;
    Logger.Info(`[DatabaseManager] 使用 ${dbConfig.type} 数据库`);

    // 根据配置创建驱动
    if (dbConfig.type === 'mysql') {
      if (!dbConfig.host || !dbConfig.database) {
        throw new Error('MySQL 配置缺失');
      }
      this._driver = new MySQLDriver({
        host: dbConfig.host,
        port: dbConfig.port || 3306,
        user: dbConfig.username || 'root',
        password: dbConfig.password || '',
        database: dbConfig.database,
        connectionLimit: 10,
      });
    } else if (dbConfig.type === 'sqlite') {
      if (!dbConfig.path) {
        throw new Error('SQLite 配置缺失');
      }
      this._driver = new SQLiteDriver({
        filename: dbConfig.path,
      });
    } else {
      throw new Error(`不支持的数据库类型: ${dbConfig.type}`);
    }

    await this._driver.connect();
    Logger.Info('[DatabaseManager] 数据库连接成功');
  }

  /**
   * 关闭数据库连接
   */
  public async Shutdown(): Promise<void> {
    if (this._driver) {
      await this._driver.disconnect();
      this._driver = null;
    }
  }

  /**
   * 获取数据库驱动
   */
  public get Driver(): IDriver {
    if (!this._driver) {
      throw new Error('数据库未初始化');
    }
    return this._driver;
  }

  /**
   * 获取数据库类型
   */
  public get DatabaseType(): 'mysql' | 'sqlite' | 'postgresql' {
    return Config.Database.type;
  }

  /**
   * 查询数据
   */
  public async Query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.Driver.query<T>(sql, params);
  }

  /**
   * 执行SQL
   */
  public async Execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId: number }> {
    return this.Driver.execute(sql, params);
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   */
  public async Transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.Driver.beginTransaction();
    try {
      const result = await callback();
      await this.Driver.commit();
      return result;
    } catch (err) {
      await this.Driver.rollback();
      throw err;
    }
  }
}
