/**
 * 迁移脚本: 创建账号表
 */
import { IMigration } from '../IMigration';

export class Migration001CreateAccounts implements IMigration {
  version = 1;
  name = 'create_accounts';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '账号ID (米米号)',
        email VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱地址',
        password_hash VARCHAR(64) NOT NULL COMMENT '密码哈希 (MD5)',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0正常, 1封禁, 2冻结, 3待激活',
        create_time INT NOT NULL COMMENT '创建时间戳',
        last_login_time INT NOT NULL DEFAULT 0 COMMENT '最后登录时间',
        last_login_ip VARCHAR(45) NOT NULL DEFAULT '' COMMENT '最后登录IP',
        role_created TINYINT NOT NULL DEFAULT 0 COMMENT '是否已创建角色',
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        create_time INTEGER NOT NULL,
        last_login_time INTEGER NOT NULL DEFAULT 0,
        last_login_ip TEXT NOT NULL DEFAULT '',
        role_created INTEGER NOT NULL DEFAULT 0
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)
    `, `
      CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS accounts'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS accounts'];
  }
}
