/**
 * 创建邮件表
 */
import { IMigration } from '../IMigration';

export class Migration011CreateMails implements IMigration {
  version = 11;
  name = 'create_mails';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS mails (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '邮件ID',
        userId INT NOT NULL COMMENT '收件人ID',
        senderId INT NOT NULL COMMENT '发件人ID',
        senderNick VARCHAR(32) NOT NULL DEFAULT '' COMMENT '发件人昵称',
        title VARCHAR(128) NOT NULL DEFAULT '' COMMENT '邮件标题',
        content TEXT NOT NULL COMMENT '邮件内容',
        isRead TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读',
        hasAttachment TINYINT NOT NULL DEFAULT 0 COMMENT '是否有附件',
        attachmentType INT NOT NULL DEFAULT 0 COMMENT '附件类型',
        attachmentId INT NOT NULL DEFAULT 0 COMMENT '附件ID',
        attachmentCount INT NOT NULL DEFAULT 0 COMMENT '附件数量',
        isClaimed TINYINT NOT NULL DEFAULT 0 COMMENT '是否已领取',
        sendTime INT NOT NULL COMMENT '发送时间',
        expireTime INT NOT NULL DEFAULT 0 COMMENT '过期时间',
        mailType INT NOT NULL DEFAULT 0 COMMENT '邮件类型',
        INDEX idx_userId (userId),
        INDEX idx_sendTime (sendTime),
        INDEX idx_isRead (isRead),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件表'
    `];
  }

  upSQLite(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS mails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        senderNick TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        isRead INTEGER NOT NULL DEFAULT 0,
        hasAttachment INTEGER NOT NULL DEFAULT 0,
        attachmentType INTEGER NOT NULL DEFAULT 0,
        attachmentId INTEGER NOT NULL DEFAULT 0,
        attachmentCount INTEGER NOT NULL DEFAULT 0,
        isClaimed INTEGER NOT NULL DEFAULT 0,
        sendTime INTEGER NOT NULL,
        expireTime INTEGER NOT NULL DEFAULT 0,
        mailType INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_mails_userId ON mails(userId)`,
      `CREATE INDEX IF NOT EXISTS idx_mails_sendTime ON mails(sendTime)`,
      `CREATE INDEX IF NOT EXISTS idx_mails_isRead ON mails(isRead)`
    ];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS mails'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS mails'];
  }
}
