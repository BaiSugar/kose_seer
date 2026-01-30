/**
 * 迁移脚本: 创建 GM 白名单表
 */
import { IMigration } from '../IMigration';

export class Migration009CreateGMWhitelist implements IMigration {
  version = 9;
  name = 'create_gm_whitelist';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS gm_whitelist (
        user_id INT PRIMARY KEY COMMENT '用户ID',
        email VARCHAR(255) NOT NULL COMMENT '邮箱',
        permissions JSON NOT NULL COMMENT '权限列表 ["config", "ban", "currency", "item", "pet"]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
        created_by INT NOT NULL COMMENT '添加者ID',
        note TEXT COMMENT '备注',
        INDEX idx_email (email),
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='GM白名单表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS gm_whitelist (
        user_id INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        permissions TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        created_by INTEGER NOT NULL,
        note TEXT,
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_gm_whitelist_email ON gm_whitelist(email)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS gm_whitelist'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS gm_whitelist'];
  }
}
