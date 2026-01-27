/**
 * 迁移脚本: 添加完整的 NoNo 字段
 */
import { IMigration } from '../IMigration';

export class Migration007AddNoNoFields implements IMigration {
  version = 7;
  name = 'add_nono_fields';

  upMySQL(): string[] {
    return [`
      ALTER TABLE players
      ADD COLUMN IF NOT EXISTS nono_flag INT NOT NULL DEFAULT 1 COMMENT 'NoNo标志',
      ADD COLUMN IF NOT EXISTS nono_power INT NOT NULL DEFAULT 10000 COMMENT 'NoNo体力',
      ADD COLUMN IF NOT EXISTS nono_mate INT NOT NULL DEFAULT 10000 COMMENT 'NoNo心情',
      ADD COLUMN IF NOT EXISTS nono_iq INT NOT NULL DEFAULT 0 COMMENT 'NoNo智商',
      ADD COLUMN IF NOT EXISTS nono_ai INT NOT NULL DEFAULT 0 COMMENT 'NoNo AI',
      ADD COLUMN IF NOT EXISTS nono_super_level INT NOT NULL DEFAULT 0 COMMENT 'NoNo超能等级',
      ADD COLUMN IF NOT EXISTS nono_bio INT NOT NULL DEFAULT 0 COMMENT 'NoNo生物值',
      ADD COLUMN IF NOT EXISTS nono_birth INT NOT NULL DEFAULT 0 COMMENT 'NoNo出生时间',
      ADD COLUMN IF NOT EXISTS nono_charge_time INT NOT NULL DEFAULT 0 COMMENT 'NoNo充电时间',
      ADD COLUMN IF NOT EXISTS nono_expire INT NOT NULL DEFAULT 0 COMMENT 'NoNo过期时间',
      ADD COLUMN IF NOT EXISTS nono_chip INT NOT NULL DEFAULT 0 COMMENT 'NoNo芯片',
      ADD COLUMN IF NOT EXISTS nono_grow INT NOT NULL DEFAULT 0 COMMENT 'NoNo成长值'
    `];
  }

  upSQLite(): string[] {
    return [
      `ALTER TABLE players ADD COLUMN nono_flag INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE players ADD COLUMN nono_power INTEGER NOT NULL DEFAULT 10000`,
      `ALTER TABLE players ADD COLUMN nono_mate INTEGER NOT NULL DEFAULT 10000`,
      `ALTER TABLE players ADD COLUMN nono_iq INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_ai INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_super_level INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_bio INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_birth INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_charge_time INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_expire INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_chip INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN nono_grow INTEGER NOT NULL DEFAULT 0`
    ];
  }

  downMySQL(): string[] {
    return [`
      ALTER TABLE players
      DROP COLUMN IF EXISTS nono_flag,
      DROP COLUMN IF EXISTS nono_power,
      DROP COLUMN IF EXISTS nono_mate,
      DROP COLUMN IF EXISTS nono_iq,
      DROP COLUMN IF EXISTS nono_ai,
      DROP COLUMN IF EXISTS nono_super_level,
      DROP COLUMN IF EXISTS nono_bio,
      DROP COLUMN IF EXISTS nono_birth,
      DROP COLUMN IF EXISTS nono_charge_time,
      DROP COLUMN IF EXISTS nono_expire,
      DROP COLUMN IF EXISTS nono_chip,
      DROP COLUMN IF EXISTS nono_grow
    `];
  }

  downSQLite(): string[] {
    // SQLite 不支持 DROP COLUMN，需要重建表
    return [
      'DROP TABLE IF EXISTS players_backup',
      `CREATE TABLE players_backup AS SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture, energy, coins,
        fight_badge, map_id, pos_x, pos_y, time_today, time_limit, login_cnt, inviter,
        vip_level, vip_value, vip_stage, vip_end_time, teacher_id, student_id,
        graduation_count, pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage,
        max_arena_wins, has_nono, super_nono, nono_state, nono_color, nono_nick,
        badge, cur_title, team_id, extra_data
      FROM players`,
      'DROP TABLE players',
      'ALTER TABLE players_backup RENAME TO players'
    ];
  }
}
