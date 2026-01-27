/**
 * 邮箱验证码仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IEmailCodeInfo, createEmailCodeInfo } from '../../../shared/models';

/**
 * 数据库验证码行类型
 */
interface IEmailCodeRow {
  id: number;
  email: string;
  code: string;
  code_res: string;
  create_time: number;
  expire_time: number;
  used: number;
}

export class EmailCodeRepository extends BaseRepository<IEmailCodeRow> {
  protected _tableName = 'email_codes';

  /**
   * 创建验证码
   */
  public async CreateCode(
    email: string,
    expireSeconds: number = 300
  ): Promise<IEmailCodeInfo> {
    const codeInfo = createEmailCodeInfo(email, expireSeconds);

    await this._db.Execute(
      `INSERT INTO email_codes (email, code, code_res, create_time, expire_time, used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codeInfo.email, codeInfo.code, codeInfo.codeRes, codeInfo.createTime, codeInfo.expireTime, 0]
    );

    return codeInfo;
  }

  /**
   * 根据验证码响应查找
   */
  public async FindByCodeRes(codeRes: string): Promise<IEmailCodeInfo | null> {
    const now = Math.floor(Date.now() / 1000);

    const rows = await this._db.Query<IEmailCodeRow>(
      'SELECT * FROM email_codes WHERE code_res = ? AND used = 0 AND expire_time > ? ORDER BY create_time DESC LIMIT 1',
      [codeRes, now]
    );

    if (rows.length === 0) return null;
    return this.toEmailCodeInfo(rows[0]);
  }

  /**
   * 验证验证码
   */
  public async VerifyCode(email: string, code: string): Promise<IEmailCodeInfo | null> {
    const now = Math.floor(Date.now() / 1000);

    const rows = await this._db.Query<IEmailCodeRow>(
      'SELECT * FROM email_codes WHERE email = ? AND code = ? AND used = 0 AND expire_time > ? ORDER BY create_time DESC LIMIT 1',
      [email, code, now]
    );

    if (rows.length === 0) return null;
    return this.toEmailCodeInfo(rows[0]);
  }

  /**
   * 标记验证码已使用
   */
  public async MarkAsUsed(id: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE email_codes SET used = 1 WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 根据邮箱标记所有验证码已使用
   */
  public async MarkAllAsUsedByEmail(email: string): Promise<number> {
    const result = await this._db.Execute(
      'UPDATE email_codes SET used = 1 WHERE email = ?',
      [email]
    );

    return result.affectedRows;
  }

  /**
   * 删除过期验证码
   */
  public async DeleteExpired(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const result = await this._db.Execute(
      'DELETE FROM email_codes WHERE expire_time < ?',
      [now]
    );

    return result.affectedRows;
  }

  /**
   * 获取邮箱的未使用验证码数量
   */
  public async GetUnusedCount(email: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND used = 0 AND expire_time > ?',
      [email, now]
    );

    return rows[0]?.count || 0;
  }

  /**
   * 检查是否可以发送新验证码（限制频率）
   */
  public async CanSendCode(email: string, cooldownSeconds: number = 60): Promise<boolean> {
    const cooldownTime = Math.floor(Date.now() / 1000) - cooldownSeconds;

    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND create_time > ?',
      [email, cooldownTime]
    );

    return rows[0]?.count === 0;
  }

  /**
   * 转换为 IEmailCodeInfo
   */
  private toEmailCodeInfo(row: IEmailCodeRow): IEmailCodeInfo {
    return {
      email: row.email,
      code: row.code,
      codeRes: row.code_res,
      createTime: row.create_time,
      expireTime: row.expire_time,
      used: row.used === 1
    };
  }
}
