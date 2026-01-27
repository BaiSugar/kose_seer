/**
 * 账号仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IAccountInfo, AccountStatus } from '../../../shared/models';

/**
 * 数据库账号行类型
 */
interface IAccountRow {
  id: number;
  email: string;
  password_hash: string;
  status: number;
  create_time: number;
  last_login_time: number;
  last_login_ip: string;
  role_created: number;
}

export class AccountRepository extends BaseRepository<IAccountRow> {
  protected _tableName = 'accounts';

  /**
   * 根据邮箱查找账号
   */
  public async FindByEmail(email: string): Promise<IAccountInfo | null> {
    const rows = await this._db.Query<IAccountRow>(
      'SELECT * FROM accounts WHERE email = ?',
      [email]
    );

    if (rows.length === 0) return null;
    return this.toAccountInfo(rows[0]);
  }

  /**
   * 根据ID查找账号
   */
  public async FindAccountById(id: number): Promise<IAccountInfo | null> {
    const rows = await this._db.Query<IAccountRow>(
      'SELECT * FROM accounts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return this.toAccountInfo(rows[0]);
  }

  /**
   * 创建账号
   */
  public async CreateAccount(email: string, passwordHash: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const result = await this._db.Execute(
      `INSERT INTO accounts (email, password_hash, status, create_time, last_login_time, last_login_ip, role_created)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, AccountStatus.NORMAL, now, 0, '', 0]
    );

    return result.insertId;
  }

  /**
   * 更新最后登录信息
   */
  public async UpdateLastLogin(id: number, ip: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);

    const result = await this._db.Execute(
      'UPDATE accounts SET last_login_time = ?, last_login_ip = ? WHERE id = ?',
      [now, ip, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新角色创建状态
   */
  public async UpdateRoleCreated(id: number, created: boolean): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE accounts SET role_created = ? WHERE id = ?',
      [created ? 1 : 0, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新账号状态
   */
  public async UpdateStatus(id: number, status: AccountStatus): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE accounts SET status = ? WHERE id = ?',
      [status, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新密码
   */
  public async UpdatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE accounts SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 检查邮箱是否已存在
   */
  public async EmailExists(email: string): Promise<boolean> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM accounts WHERE email = ?',
      [email]
    );

    return rows[0]?.count > 0;
  }

  /**
   * 验证密码
   */
  public async VerifyPassword(email: string, passwordHash: string): Promise<IAccountInfo | null> {
    const rows = await this._db.Query<IAccountRow>(
      'SELECT * FROM accounts WHERE email = ? AND password_hash = ?',
      [email, passwordHash]
    );

    if (rows.length === 0) return null;
    return this.toAccountInfo(rows[0]);
  }

  /**
   * 转换为 IAccountInfo
   */
  private toAccountInfo(row: IAccountRow): IAccountInfo {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      status: row.status as AccountStatus,
      createTime: row.create_time,
      lastLoginTime: row.last_login_time,
      lastLoginIP: row.last_login_ip,
      roleCreated: row.role_created === 1
    };
  }
}
