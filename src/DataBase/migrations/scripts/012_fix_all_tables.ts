/**
 * 迁移脚本: 修复所有表结构为 JSON 格式
 */
import { IMigration } from '../IMigration';

export class Migration012FixAllTables implements IMigration {
  version = 12;
  name = 'fix_all_tables';

  upMySQL(): string[] {
    return [
      // 删除旧表
      'DROP TABLE IF EXISTS pets',
      'DROP TABLE IF EXISTS mails',
      'DROP TABLE IF EXISTS friends',
      'DROP TABLE IF EXISTS tasks',
      
      // 创建新的 JSON 格式表
      `CREATE TABLE IF NOT EXISTS player_pets (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        pet_list TEXT COMMENT '精灵列表（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_owner_id (owner_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家精灵表'`,
      
      `CREATE TABLE IF NOT EXISTS player_mails (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        mail_list TEXT COMMENT '邮件列表（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_owner_id (owner_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家邮件表'`,
      
      `CREATE TABLE IF NOT EXISTS player_friends (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        friend_list TEXT COMMENT '好友列表（JSON格式）',
        black_list TEXT COMMENT '黑名单列表（JSON格式）',
        send_apply_list TEXT COMMENT '发送的好友申请列表（JSON格式）',
        receive_apply_list TEXT COMMENT '收到的好友申请列表（JSON格式）',
        chat_history TEXT COMMENT '聊天历史（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_owner_id (owner_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家好友表'`,
      
      `CREATE TABLE IF NOT EXISTS player_tasks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        task_list TEXT COMMENT '任务列表（JSON格式）',
        task_buffers TEXT COMMENT '任务缓存（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_owner_id (owner_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家任务表'`
    ];
  }

  upSQLite(): string[] {
    return [
      // 删除旧表
      'DROP TABLE IF EXISTS pets',
      'DROP TABLE IF EXISTS mails',
      'DROP TABLE IF EXISTS friends',
      'DROP TABLE IF EXISTS tasks',
      
      // 创建新的 JSON 格式表
      `CREATE TABLE IF NOT EXISTS player_pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL UNIQUE,
        pet_list TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS player_mails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL UNIQUE,
        mail_list TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS player_friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL UNIQUE,
        friend_list TEXT,
        black_list TEXT,
        send_apply_list TEXT,
        receive_apply_list TEXT,
        chat_history TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS player_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL UNIQUE,
        task_list TEXT,
        task_buffers TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`
    ];
  }

  downMySQL(): string[] {
    return [
      'DROP TABLE IF EXISTS player_pets',
      'DROP TABLE IF EXISTS player_mails',
      'DROP TABLE IF EXISTS player_friends',
      'DROP TABLE IF EXISTS player_tasks'
    ];
  }

  downSQLite(): string[] {
    return [
      'DROP TABLE IF EXISTS player_pets',
      'DROP TABLE IF EXISTS player_mails',
      'DROP TABLE IF EXISTS player_friends',
      'DROP TABLE IF EXISTS player_tasks'
    ];
  }
}
