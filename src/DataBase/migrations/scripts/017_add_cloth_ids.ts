/**
 * 迁移脚本: 添加 cloth_ids 字段到 players 表
 * 用于保存玩家当前穿戴的服装ID列表
 */
import { IMigration } from '../IMigration';

export class Migration017AddClothIds implements IMigration {
  version = 17;
  name = 'add_cloth_ids';

  upMySQL(): string[] {
    return [`
      ALTER TABLE players 
      ADD COLUMN cloth_ids TEXT DEFAULT '[]' COMMENT '当前穿戴的服装ID列表（JSON数组）'
    `];
  }

  upSQLite(): string[] {
    return [`
      ALTER TABLE players 
      ADD COLUMN cloth_ids TEXT DEFAULT '[]'
    `];
  }

  downMySQL(): string[] {
    return ['ALTER TABLE players DROP COLUMN cloth_ids'];
  }

  downSQLite(): string[] {
    // SQLite 不支持 DROP COLUMN，需要重建表
    return [
      'ALTER TABLE players RENAME TO players_old',
      `CREATE TABLE players AS SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, gold, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value, vip_stage,
        vip_end_time, teacher_id, student_id, graduation_count, pet_max_lev, pet_all_num,
        mon_king_win, mess_win, cur_stage, max_stage, cur_fresh_stage, max_fresh_stage,
        max_arena_wins, has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai, nono_birth, nono_charge_time,
        nono_super_energy, nono_super_level, nono_super_stage, badge, cur_title, team_id
      FROM players_old`,
      'DROP TABLE players_old'
    ];
  }
}
