/**
 * MySQL 数据库驱动
 */
import { createPool, Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { IDriver, IExecuteResult } from './IDriver';
import { IMySQLConfig } from '../DatabaseConfig';
import { Logger } from '../../shared/utils';

export class MySQLDriver implements IDriver {
  private _pool: Pool | null = null;
  private _connection: PoolConnection | null = null;
  private _config: IMySQLConfig;
  private _connected: boolean = false;
  private _inTransaction: boolean = false;

  constructor(config: IMySQLConfig) {
    this._config = config;
  }

  /**
   * 连接数据库
   */
  public async connect(): Promise<void> {
    if (this._connected) return;

    try {
      this._pool = createPool({
        host: this._config.host,
        port: this._config.port,
        user: this._config.user,
        password: this._config.password,
        database: this._config.database,
        connectionLimit: this._config.connectionLimit,
        waitForConnections: true,
        queueLimit: 0,
        charset: 'utf8mb4'
      });

      // 测试连接
      const conn = await this._pool.getConnection();
      conn.release();

      this._connected = true;
      Logger.Info('[MySQLDriver] 数据库连接成功');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[MySQLDriver] 数据库连接失败', error);
      throw err;
    }
  }

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    if (!this._connected || !this._pool) return;

    try {
      if (this._connection) {
        this._connection.release();
        this._connection = null;
      }
      await this._pool.end();
      this._pool = null;
      this._connected = false;
      Logger.Info('[MySQLDriver] 数据库连接已关闭');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[MySQLDriver] 关闭连接失败', error);
      throw err;
    }
  }

  /**
   * 查询数据
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this._pool) {
      throw new Error('数据库未连接');
    }

    try {
      const conn = this._inTransaction && this._connection ? this._connection : this._pool;
      const [rows] = await conn.query<RowDataPacket[]>(sql, params);
      return rows as T[];
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[MySQLDriver] 查询失败: ${sql}`, error);
      throw err;
    }
  }

  /**
   * 执行SQL
   */
  public async execute(sql: string, params?: any[]): Promise<IExecuteResult> {
    if (!this._pool) {
      throw new Error('数据库未连接');
    }

    try {
      const conn = this._inTransaction && this._connection ? this._connection : this._pool;
      const [result] = await conn.execute<ResultSetHeader>(sql, params);
      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[MySQLDriver] 执行失败: ${sql}`, error);
      throw err;
    }
  }

  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<void> {
    if (!this._pool) {
      throw new Error('数据库未连接');
    }

    if (this._inTransaction) {
      throw new Error('已在事务中');
    }

    try {
      this._connection = await this._pool.getConnection();
      await this._connection.beginTransaction();
      this._inTransaction = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[MySQLDriver] 开始事务失败', error);
      throw err;
    }
  }

  /**
   * 提交事务
   */
  public async commit(): Promise<void> {
    if (!this._inTransaction || !this._connection) {
      throw new Error('未在事务中');
    }

    try {
      await this._connection.commit();
      this._connection.release();
      this._connection = null;
      this._inTransaction = false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[MySQLDriver] 提交事务失败', error);
      throw err;
    }
  }

  /**
   * 回滚事务
   */
  public async rollback(): Promise<void> {
    if (!this._inTransaction || !this._connection) {
      throw new Error('未在事务中');
    }

    try {
      await this._connection.rollback();
      this._connection.release();
      this._connection = null;
      this._inTransaction = false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[MySQLDriver] 回滚事务失败', error);
      throw err;
    }
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this._connected;
  }
}
