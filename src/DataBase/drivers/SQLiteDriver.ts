/**
 * SQLite 数据库驱动
 */
import { IDriver, IExecuteResult } from './IDriver';
import { ISQLiteConfig } from '../DatabaseConfig';
import { Logger } from '../../shared/utils';
import * as fs from 'fs';
import * as path from 'path';

// 动态加载 better-sqlite3，支持 pkg 打包
function loadBetterSqlite3(): { Database: any; nativeBinding?: string } {
  const isPkg = (process as any).pkg !== undefined;

  if (isPkg) {
    // pkg 打包环境：从 exe 同级目录加载
    const exeDir = path.dirname(process.execPath);

    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(exeDir, 'build', 'Release', 'better_sqlite3.node'),
      path.join(exeDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
      path.join(exeDir, 'node_modules', 'better-sqlite3', 'prebuilds', 'win32-x64', 'better_sqlite3.node'),
      path.join(exeDir, 'better_sqlite3.node'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        Logger.Info(`[SQLiteDriver] 使用原生模块: ${p}`);
        // 返回 Database 类和 nativeBinding 路径
        return {
          Database: require('better-sqlite3'),
          nativeBinding: p
        };
      }
    }

    Logger.Warn('[SQLiteDriver] 未找到原生模块，尝试默认加载');
  }

  return { Database: require('better-sqlite3') };
}

type DatabaseType = import('better-sqlite3').Database;

export class SQLiteDriver implements IDriver {
  private _db: DatabaseType | null = null;
  private _config: ISQLiteConfig;
  private _connected: boolean = false;
  private _inTransaction: boolean = false;

  constructor(config: ISQLiteConfig) {
    this._config = config;
  }

  /**
   * 连接数据库
   */
  public async connect(): Promise<void> {
    if (this._connected) return;

    try {
      // 确保目录存在
      const dir = path.dirname(this._config.filename);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 动态加载 better-sqlite3
      const { Database, nativeBinding } = loadBetterSqlite3();

      // 创建数据库连接，如果有 nativeBinding 则使用它
      const options = nativeBinding ? { nativeBinding } : {};
      const db = new Database(this._config.filename, options);

      // 启用外键约束
      db.pragma('foreign_keys = ON');
      // 使用 WAL 模式提高并发性能
      db.pragma('journal_mode = WAL');

      this._db = db;

      this._connected = true;
      Logger.Info(`[SQLiteDriver] 数据库连接成功: ${this._config.filename}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[SQLiteDriver] 数据库连接失败', error);
      throw err;
    }
  }

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    if (!this._connected || !this._db) return;

    try {
      this._db.close();
      this._db = null;
      this._connected = false;
      Logger.Info('[SQLiteDriver] 数据库连接已关闭');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[SQLiteDriver] 关闭连接失败', error);
      throw err;
    }
  }

  /**
   * 查询数据
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this._db) {
      throw new Error('数据库未连接');
    }

    try {
      const stmt = this._db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return rows as T[];
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[SQLiteDriver] 查询失败: ${sql}`, error);
      throw err;
    }
  }

  /**
   * 执行SQL
   */
  public async execute(sql: string, params?: any[]): Promise<IExecuteResult> {
    if (!this._db) {
      throw new Error('数据库未连接');
    }

    try {
      const stmt = this._db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return {
        affectedRows: result.changes,
        insertId: Number(result.lastInsertRowid)
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[SQLiteDriver] 执行失败: ${sql}`, error);
      throw err;
    }
  }

  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<void> {
    if (!this._db) {
      throw new Error('数据库未连接');
    }

    if (this._inTransaction) {
      throw new Error('已在事务中');
    }

    try {
      this._db.exec('BEGIN TRANSACTION');
      this._inTransaction = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[SQLiteDriver] 开始事务失败', error);
      throw err;
    }
  }

  /**
   * 提交事务
   */
  public async commit(): Promise<void> {
    if (!this._db || !this._inTransaction) {
      throw new Error('未在事务中');
    }

    try {
      this._db.exec('COMMIT');
      this._inTransaction = false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[SQLiteDriver] 提交事务失败', error);
      throw err;
    }
  }

  /**
   * 回滚事务
   */
  public async rollback(): Promise<void> {
    if (!this._db || !this._inTransaction) {
      throw new Error('未在事务中');
    }

    try {
      this._db.exec('ROLLBACK');
      this._inTransaction = false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[SQLiteDriver] 回滚事务失败', error);
      throw err;
    }
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this._connected;
  }

  /**
   * 获取原始数据库实例（用于高级操作）
   */
  public getRawDatabase(): DatabaseType | null {
    return this._db;
  }
}
