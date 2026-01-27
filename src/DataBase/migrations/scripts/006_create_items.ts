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
        item_id INT NOT NULL COMMENT '物品ID',
        count INT NOT NULL DEFAULT 1 COMMENT '数量',
        expire_time INT NOT NULL DEFAULT 0 COMMENT '过期时间（0=永久）',
        item_level INT NOT NULL DEFAULT 0 COMMENT '物品等级',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
        INDEX idx_owner_id (owner_id),
        INDEX idx_item_id (item_id),
        UNIQUE KEY uk_owner_item (owner_id, item_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家物品表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS player_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        expire_time INTEGER NOT NULL DEFAULT 0,
        item_level INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner_id, item_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_player_items_owner_id ON player_items(owner_id)
    `, `
      CREATE INDEX IF NOT EXISTS idx_player_items_item_id ON player_items(item_id)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS player_items'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS player_items'];
  }
}
