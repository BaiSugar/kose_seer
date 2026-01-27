/**
 * 迁移脚本: 创建邮箱验证码表
 */
import { IMigration } from '../IMigration';

export class Migration005CreateEmailCodes implements IMigration {
  version = 5;
  name = 'create_email_codes';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS email_codes (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
        email VARCHAR(255) NOT NULL COMMENT '邮箱地址',
        code VARCHAR(6) NOT NULL COMMENT '验证码',
        code_res VARCHAR(32) NOT NULL COMMENT '验证响应',
        create_time INT NOT NULL COMMENT '创建时间',
        expire_time INT NOT NULL COMMENT '过期时间',
        used TINYINT NOT NULL DEFAULT 0 COMMENT '是否已使用',
        INDEX idx_email (email),
        INDEX idx_code_res (code_res),
        INDEX idx_expire_time (expire_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮箱验证码表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS email_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        code_res TEXT NOT NULL,
        create_time INTEGER NOT NULL,
        expire_time INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email)
    `, `
      CREATE INDEX IF NOT EXISTS idx_email_codes_code_res ON email_codes(code_res)
    `, `
      CREATE INDEX IF NOT EXISTS idx_email_codes_expire_time ON email_codes(expire_time)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS email_codes'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS email_codes'];
  }
}
