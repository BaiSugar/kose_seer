/**
 * 数据库配置接口
 */

/**
 * MySQL 配置
 */
export interface IMySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

/**
 * SQLite 配置
 */
export interface ISQLiteConfig {
  filename: string;
}

/**
 * 数据库配置
 */
export interface IDatabaseConfig {
  type: 'mysql' | 'sqlite';
  mysql?: IMySQLConfig;
  sqlite?: ISQLiteConfig;
}

/**
 * 默认数据库配置
 */
export const DefaultDatabaseConfig: IDatabaseConfig = {
  type: 'sqlite',
  mysql: {
    host: '127.0.0.1',
    port: 3306,
    user: 'seer',
    password: 'seer123',
    database: 'seer_db',
    connectionLimit: 10
  },
  sqlite: {
    filename: './data/seer.db'
  }
};
