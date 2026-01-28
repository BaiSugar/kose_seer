/**
 * 迁移脚本: 创建物品表
 */
import { IMigration } from '../IMigration';

export class Migration006CreateItems implements IMigration {
  version = 6;
  name = 'create_items';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS player_items (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        item_list TEXT COMMENT '物品列表（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_owner_id (owner_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家物品表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS player_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL UNIQUE,
        item_list TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS player_items'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS player_items'];
  }
}
