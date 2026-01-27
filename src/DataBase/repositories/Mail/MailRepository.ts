/**
 * 邮件数据库仓库
 * 负责邮件数据的增删改查
 */

import { BaseRepository } from '../BaseRepository';
import { Logger } from '../../../shared/utils';
import { IMailInfo } from '../../../shared/models/MailModel';

/**
 * 数据库邮件行类型
 */
interface IMailRow {
  id: number;
  userId: number;
  senderId: number;
  senderNick: string;
  title: string;
  content: string;
  isRead: number;
  hasAttachment: number;
  attachmentType: number;
  attachmentId: number;
  attachmentCount: number;
  isClaimed: number;
  sendTime: number;
  expireTime: number;
  mailType: number;
}

/**
 * 邮件仓库
 */
export class MailRepository extends BaseRepository<IMailRow> {
  protected _tableName = 'mails';

  /**
   * 创建邮件
   */
  public async Create(mail: IMailInfo): Promise<number> {
    const sql = `
      INSERT INTO mails (
        userId, senderId, senderNick, title, content,
        isRead, hasAttachment, attachmentType, attachmentId, attachmentCount,
        isClaimed, sendTime, expireTime, mailType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await this._db.Execute(sql, [
        mail.userId,
        mail.senderId,
        mail.senderNick,
        mail.title,
        mail.content,
        mail.isRead ? 1 : 0,
        mail.hasAttachment ? 1 : 0,
        mail.attachmentType,
        mail.attachmentId,
        mail.attachmentCount,
        mail.isClaimed ? 1 : 0,
        mail.sendTime,
        mail.expireTime,
        mail.mailType
      ]);

      Logger.Info(`[MailRepository] 创建邮件成功: MailId=${result.insertId}, UserId=${mail.userId}`);
      return result.insertId || 0;
    } catch (error) {
      Logger.Error('[MailRepository] 创建邮件失败', error as Error);
      return 0;
    }
  }

  /**
   * 根据ID查找邮件
   */
  public async FindMailById(mailId: number): Promise<IMailInfo | null> {
    const rows = await this._db.Query<IMailRow>(
      'SELECT * FROM mails WHERE id = ?',
      [mailId]
    );

    if (rows.length === 0) return null;
    return this.toMailInfo(rows[0]);
  }

  /**
   * 获取用户的所有邮件
   */
  public async FindByUserId(userId: number, limit: number = 100): Promise<IMailInfo[]> {
    const rows = await this._db.Query<IMailRow>(
      'SELECT * FROM mails WHERE userId = ? ORDER BY sendTime DESC LIMIT ?',
      [userId, limit]
    );

    return rows.map(row => this.toMailInfo(row));
  }

  /**
   * 获取用户的未读邮件
   */
  public async FindUnreadByUserId(userId: number): Promise<IMailInfo[]> {
    const rows = await this._db.Query<IMailRow>(
      'SELECT * FROM mails WHERE userId = ? AND isRead = 0 ORDER BY sendTime DESC',
      [userId]
    );

    return rows.map(row => this.toMailInfo(row));
  }

  /**
   * 获取未读邮件数量
   */
  public async CountUnread(userId: number): Promise<number> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM mails WHERE userId = ? AND isRead = 0',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  /**
   * 标记邮件为已读
   */
  public async MarkAsRead(mailId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE mails SET isRead = 1 WHERE id = ?',
      [mailId]
    );
    Logger.Info(`[MailRepository] 标记邮件已读: MailId=${mailId}`);
    return result.affectedRows > 0;
  }

  /**
   * 标记所有邮件为已读
   */
  public async MarkAllAsRead(userId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE mails SET isRead = 1 WHERE userId = ? AND isRead = 0',
      [userId]
    );
    Logger.Info(`[MailRepository] 标记所有邮件已读: UserId=${userId}, Count=${result.affectedRows}`);
    return result.affectedRows > 0;
  }

  /**
   * 领取邮件附件
   */
  public async ClaimAttachment(mailId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE mails SET isClaimed = 1 WHERE id = ?',
      [mailId]
    );
    Logger.Info(`[MailRepository] 领取邮件附件: MailId=${mailId}`);
    return result.affectedRows > 0;
  }

  /**
   * 删除邮件
   */
  public async Delete(mailId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'DELETE FROM mails WHERE id = ?',
      [mailId]
    );
    Logger.Info(`[MailRepository] 删除邮件: MailId=${mailId}`);
    return result.affectedRows > 0;
  }

  /**
   * 删除用户的所有已读邮件
   */
  public async DeleteAllRead(userId: number): Promise<number> {
    const result = await this._db.Execute(
      'DELETE FROM mails WHERE userId = ? AND isRead = 1',
      [userId]
    );
    Logger.Info(`[MailRepository] 删除所有已读邮件: UserId=${userId}, Count=${result.affectedRows}`);
    return result.affectedRows || 0;
  }

  /**
   * 删除过期邮件
   */
  public async DeleteExpired(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this._db.Execute(
      'DELETE FROM mails WHERE expireTime > 0 AND expireTime < ?',
      [now]
    );
    
    if (result.affectedRows && result.affectedRows > 0) {
      Logger.Info(`[MailRepository] 删除过期邮件: Count=${result.affectedRows}`);
    }
    return result.affectedRows || 0;
  }

  /**
   * 获取邮件总数
   */
  public async CountByUserId(userId: number): Promise<number> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM mails WHERE userId = ?',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  /**
   * 转换为 IMailInfo
   */
  private toMailInfo(row: IMailRow): IMailInfo {
    return {
      id: row.id,
      userId: row.userId,
      senderId: row.senderId,
      senderNick: row.senderNick || '',
      title: row.title || '',
      content: row.content || '',
      isRead: row.isRead === 1,
      hasAttachment: row.hasAttachment === 1,
      attachmentType: row.attachmentType || 0,
      attachmentId: row.attachmentId || 0,
      attachmentCount: row.attachmentCount || 0,
      isClaimed: row.isClaimed === 1,
      sendTime: row.sendTime || 0,
      expireTime: row.expireTime || 0,
      mailType: row.mailType || 0
    };
  }
}
