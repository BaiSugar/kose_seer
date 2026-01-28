/**
 * 迁移脚本: 添加精灵分配仪可分配经验字段
 */
import { IMigration } from '../IMigration';

export class Migration013AddAllocatableExp implements IMigration {
  version = 13;
  name = 'add_allocatable_exp';

  upMySQL(): string[] {
    return [
      `ALTER TABLE players ADD COLUMN allocatable_exp INT NOT NULL DEFAULT 0 COMMENT '可分配经验值' AFTER fight_badge`
    ];
  }

  upSQLite(): string[] {
    return [
      `ALTER TABLE players ADD COLUMN allocatable_exp INTEGER NOT NULL DEFAULT 0`
    ];
  }

  downMySQL(): string[] {
    return [
      'ALTER TABLE players DROP COLUMN allocatable_exp'
    ];
  }

  downSQLite(): string[] {
    // SQLite doesn't support DROP COLUMN directly, need to recreate table
    return [
      'ALTER TABLE players DROP COLUMN allocatable_exp'
    ];
  }
}
