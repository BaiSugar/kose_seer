/**
 * 数据库迁移接口
 */
export interface IMigration {
  /**
   * 迁移版本号
   */
  version: number;

  /**
   * 迁移名称
   */
  name: string;

  /**
   * 执行迁移 (MySQL)
   */
  upMySQL(): string[];

  /**
   * 执行迁移 (SQLite)
   */
  upSQLite(): string[];

  /**
   * 回滚迁移 (MySQL)
   */
  downMySQL(): string[];

  /**
   * 回滚迁移 (SQLite)
   */
  downSQLite(): string[];
}
