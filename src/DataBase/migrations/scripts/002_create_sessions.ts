/**
 * 迁移脚本: 创建会话表
 */
import { IMigration } from '../IMigration';

export class Migration002CreateSessions implements IMigration {
  version = 2;
  name = 'create_sessions';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
        account_id INT NOT NULL COMMENT '账号ID',
        session_key VARCHAR(32) NOT NULL COMMENT '会话密钥',
        create_time INT NOT NULL COMMENT '创建时间',
        expire_time INT NOT NULL COMMENT '过期时间',
        login_ip VARCHAR(45) NOT NULL DEFAULT '' COMMENT '登录IP',
        server_id INT NOT NULL DEFAULT 0 COMMENT '服务器ID',
        is_online TINYINT NOT NULL DEFAULT 0 COMMENT '是否在线',
        INDEX idx_account_id (account_id),
        INDEX idx_session_key (session_key),
        INDEX idx_expire_time (expire_time),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        session_key TEXT NOT NULL,
        create_time INTEGER NOT NULL,
        expire_time INTEGER NOT NULL,
        login_ip TEXT NOT NULL DEFAULT '',
        server_id INTEGER NOT NULL DEFAULT 0,
        is_online INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id)
    `, `
      CREATE INDEX IF NOT EXISTS idx_sessions_session_key ON sessions(session_key)
    `, `
      CREATE INDEX IF NOT EXISTS idx_sessions_expire_time ON sessions(expire_time)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS sessions'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS sessions'];
  }
}
