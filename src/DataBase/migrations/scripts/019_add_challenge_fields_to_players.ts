/**
 * 迁移脚本: 添加挑战进度字段到 players 表
 * 
 * 注意：这是临时方案，最终这些字段会迁移到 player_challenge_progress 表
 * 但为了向后兼容，先在 players 表中添加这些字段
 */
import { IMigration } from '../IMigration';

export class Migration019AddChallengeFieldsToPlayers implements IMigration {
  version = 19;
  name = 'add_challenge_fields_to_players';

  upMySQL(): string[] {
    return [`
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS max_puni_lv TINYINT NOT NULL DEFAULT 0 
      COMMENT '谱尼封印进度（0-8：0=未开启，1-7=封印进度，8=解锁真身）'
      AFTER graduation_count
    `, `
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS tower_boss_index TINYINT NOT NULL DEFAULT 0 
      COMMENT '勇者之塔当前层已击败的BOSS数（0/1/2）'
      AFTER max_puni_lv
    `];
  }

  upSQLite(): string[] {
    return [
      'ALTER TABLE players ADD COLUMN max_puni_lv INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE players ADD COLUMN tower_boss_index INTEGER NOT NULL DEFAULT 0'
    ];
  }

  downMySQL(): string[] {
    return [
      'ALTER TABLE players DROP COLUMN IF EXISTS tower_boss_index',
      'ALTER TABLE players DROP COLUMN IF EXISTS max_puni_lv'
    ];
  }

  downSQLite(): string[] {
    return [
      // SQLite 不支持 DROP COLUMN，需要重建表
      'SELECT 1' // 占位符
    ];
  }
}
