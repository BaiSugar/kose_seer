/**
 * 迁移脚本: 创建 GM 会话表
 */
import { IMigration } from '../IMigration';

export class Migration010CreateGMSessions implements IMigration {
  version = 10;
  name = 'create_gm_sessions';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS gm_sessions (
        token VARCHAR(64) PRIMARY KEY COMMENT 'Session Token',
        user_id INT NOT NULL COMMENT '用户ID',
        email VARCHAR(255) NOT NULL COMMENT '邮箱',
        ip_address VARCHAR(45) NOT NULL COMMENT 'IP地址',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='GM会话表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS gm_sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_gm_sessions_user_id ON gm_sessions(user_id)
    `, `
      CREATE INDEX IF NOT EXISTS idx_gm_sessions_expires_at ON gm_sessions(expires_at)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS gm_sessions'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS gm_sessions'];
  }
}
