/**
 * 数据库驱动接口
 */

/**
 * 查询结果
 */
export interface IQueryResult<T> {
  rows: T[];
  fields?: any[];
}

/**
 * 执行结果
 */
export interface IExecuteResult {
  affectedRows: number;
  insertId: number;
}

/**
 * 数据库驱动接口
 */
export interface IDriver {
  /**
   * 连接数据库
   */
  connect(): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 查询数据
   * @param sql SQL语句
   * @param params 参数
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * 执行SQL（INSERT/UPDATE/DELETE）
   * @param sql SQL语句
   * @param params 参数
   */
  execute(sql: string, params?: any[]): Promise<IExecuteResult>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<void>;

  /**
   * 提交事务
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   */
  rollback(): Promise<void>;

  /**
   * 是否已连接
   */
  isConnected(): boolean;
}
