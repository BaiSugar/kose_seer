/**
 * 基础仓库类
 * 提供通用的数据库访问功能
 * 
 * 注意：仅用于 Player 相关的 Repository（Account/Session/EmailCode/Player）
 * 游戏数据（Item/Pet/Task/Friend/Mail）使用 DatabaseHelper + Data 模式
 */
import { DatabaseManager } from '../DatabaseManager';

export abstract class BaseRepository<T> {
  protected _db: DatabaseManager;
  protected abstract _tableName: string;

  constructor() {
    this._db = DatabaseManager.Instance;
  }

  /**
   * 根据ID查询
   */
  public async FindById(id: number): Promise<T | null> {
    const rows = await this._db.Query<T>(
      `SELECT * FROM ${this._tableName} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 查询所有
   */
  public async FindAll(): Promise<T[]> {
    return this._db.Query<T>(`SELECT * FROM ${this._tableName}`);
  }

  /**
   * 根据条件查询
   */
  public async FindBy(conditions: Partial<T>): Promise<T[]> {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      return this.FindAll();
    }

    const whereClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(' AND ');
    const values = Object.values(conditions);

    return this._db.Query<T>(
      `SELECT * FROM ${this._tableName} WHERE ${whereClauses}`,
      values
    );
  }

  /**
   * 根据条件查询单条
   */
  public async FindOneBy(conditions: Partial<T>): Promise<T | null> {
    const rows = await this.FindBy(conditions);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 插入数据
   */
  public async Insert(data: Partial<T>): Promise<number> {
    const keys = Object.keys(data);
    const columns = keys.map(k => this.toSnakeCase(k)).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);

    const result = await this._db.Execute(
      `INSERT INTO ${this._tableName} (${columns}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }

  /**
   * 更新数据
   */
  public async Update(id: number, data: Partial<T>): Promise<boolean> {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const result = await this._db.Execute(
      `UPDATE ${this._tableName} SET ${setClauses} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 删除数据
   */
  public async Delete(id: number): Promise<boolean> {
    const result = await this._db.Execute(
      `DELETE FROM ${this._tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 统计数量
   */
  public async Count(conditions?: Partial<T>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this._tableName}`;
    let values: any[] = [];

    if (conditions) {
      const keys = Object.keys(conditions);
      if (keys.length > 0) {
        const whereClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(' AND ');
        sql += ` WHERE ${whereClauses}`;
        values = Object.values(conditions);
      }
    }

    const rows = await this._db.Query<{ count: number }>(sql, values);
    return rows[0]?.count || 0;
  }

  /**
   * 检查是否存在
   */
  public async Exists(conditions: Partial<T>): Promise<boolean> {
    const count = await this.Count(conditions);
    return count > 0;
  }

  /**
   * 驼峰转蛇形
   */
  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 蛇形转驼峰
   */
  protected toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 将数据库行转换为实体对象
   */
  protected rowToEntity(row: Record<string, any>): T {
    const entity: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      entity[this.toCamelCase(key)] = row[key];
    }
    return entity as T;
  }

  /**
   * 将实体对象转换为数据库行
   */
  protected entityToRow(entity: Partial<T>): Record<string, any> {
    const row: Record<string, any> = {};
    for (const key of Object.keys(entity as object)) {
      row[this.toSnakeCase(key)] = (entity as Record<string, any>)[key];
    }
    return row;
  }
}
