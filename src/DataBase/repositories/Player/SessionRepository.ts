/**
 * 会话仓库
 */
import { BaseRepository } from '../BaseRepository';
import { ISessionInfo, generateSessionKey } from '../../../shared/models';

/**
 * 数据库会话行类型
 */
interface ISessionRow {
  id: number;
  account_id: number;
  session_key: string;
  create_time: number;
  expire_time: number;
  login_ip: string;
  server_id: number;
  is_online: number;
}

export class SessionRepository extends BaseRepository<ISessionRow> {
  protected _tableName = 'sessions';

  /**
   * 创建会话
   */
  public async CreateSession(
    accountId: number,
    loginIP: string,
    serverId: number = 0,
    expireSeconds: number = 3600
  ): Promise<ISessionInfo> {
    const now = Math.floor(Date.now() / 1000);
    const sessionKey = generateSessionKey();
    const expireTime = now + expireSeconds;

    await this._db.Execute(
      `INSERT INTO sessions (account_id, session_key, create_time, expire_time, login_ip, server_id, is_online)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, sessionKey, now, expireTime, loginIP, serverId, 1]
    );

    return {
      sessionKey,
      accountId,
      createTime: now,
      expireTime,
      loginIP,
      serverId,
      isOnline: true
    };
  }

  /**
   * 根据会话密钥查找会话
   */
  public async FindBySessionKey(sessionKey: string): Promise<ISessionInfo | null> {
    const rows = await this._db.Query<ISessionRow>(
      'SELECT * FROM sessions WHERE session_key = ?',
      [sessionKey]
    );

    if (rows.length === 0) return null;
    return this.toSessionInfo(rows[0]);
  }

  /**
   * 根据账号ID查找有效会话
   */
  public async FindValidByAccountId(accountId: number): Promise<ISessionInfo | null> {
    const now = Math.floor(Date.now() / 1000);

    const rows = await this._db.Query<ISessionRow>(
      'SELECT * FROM sessions WHERE account_id = ? AND expire_time > ? AND is_online = 1 ORDER BY create_time DESC LIMIT 1',
      [accountId, now]
    );

    if (rows.length === 0) return null;
    return this.toSessionInfo(rows[0]);
  }

  /**
   * 验证会话
   */
  public async ValidateSession(sessionKey: string): Promise<ISessionInfo | null> {
    const now = Math.floor(Date.now() / 1000);

    const rows = await this._db.Query<ISessionRow>(
      'SELECT * FROM sessions WHERE session_key = ? AND expire_time > ? AND is_online = 1',
      [sessionKey, now]
    );

    if (rows.length === 0) return null;
    return this.toSessionInfo(rows[0]);
  }

  /**
   * 更新在线状态
   */
  public async UpdateOnlineStatus(sessionKey: string, isOnline: boolean): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE sessions SET is_online = ? WHERE session_key = ?',
      [isOnline ? 1 : 0, sessionKey]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新服务器ID
   */
  public async UpdateServerId(sessionKey: string, serverId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE sessions SET server_id = ? WHERE session_key = ?',
      [serverId, sessionKey]
    );

    return result.affectedRows > 0;
  }

  /**
   * 延长会话有效期
   */
  public async ExtendSession(sessionKey: string, expireSeconds: number = 3600): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const expireTime = now + expireSeconds;

    const result = await this._db.Execute(
      'UPDATE sessions SET expire_time = ? WHERE session_key = ?',
      [expireTime, sessionKey]
    );

    return result.affectedRows > 0;
  }

  /**
   * 使账号的所有会话失效
   */
  public async InvalidateAllByAccountId(accountId: number): Promise<number> {
    const result = await this._db.Execute(
      'UPDATE sessions SET is_online = 0 WHERE account_id = ?',
      [accountId]
    );

    return result.affectedRows;
  }

  /**
   * 删除过期会话
   */
  public async DeleteExpired(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const result = await this._db.Execute(
      'DELETE FROM sessions WHERE expire_time < ?',
      [now]
    );

    return result.affectedRows;
  }

  /**
   * 转换为 ISessionInfo
   */
  private toSessionInfo(row: ISessionRow): ISessionInfo {
    return {
      sessionKey: row.session_key,
      accountId: row.account_id,
      createTime: row.create_time,
      expireTime: row.expire_time,
      loginIP: row.login_ip,
      serverId: row.server_id,
      isOnline: row.is_online === 1
    };
  }
}
