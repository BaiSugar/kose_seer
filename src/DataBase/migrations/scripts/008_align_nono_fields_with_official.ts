import { IMigration } from '../IMigration';

/**
 * 迁移008: 对齐NoNo字段与官方服务器
 * 
 * 官方NoNo字段：
 * - flag, state, nick, superNono, color, power, mate, iq, ai
 * - birth, chargeTime, func (160位), superEnergy, superLevel, superStage
 * 
 * 移除字段：
 * - nono_bio, nono_expire, nono_chip, nono_grow (官方包中没有这些字段)
 * 
 * 添加字段：
 * - nono_super_energy, nono_super_stage (官方包中有这些字段)
 */
export class Migration008AlignNoNoFieldsWithOfficial implements IMigration {
  name = '008_align_nono_fields_with_official';
  version = 14;

  upMySQL(): string[] {
    return [
      `ALTER TABLE players
        ADD COLUMN IF NOT EXISTS nono_super_energy INT NOT NULL DEFAULT 0 COMMENT 'NoNo超能能量',
        ADD COLUMN IF NOT EXISTS nono_super_stage INT NOT NULL DEFAULT 0 COMMENT 'NoNo超能阶段',
        DROP COLUMN IF EXISTS nono_bio,
        DROP COLUMN IF EXISTS nono_expire,
        DROP COLUMN IF EXISTS nono_chip,
        DROP COLUMN IF EXISTS nono_grow`
    ];
  }

  upSQLite(): string[] {
    return [
      // 步骤1: 创建新表（包含所有新字段，不包含旧字段）
      `CREATE TABLE players_new (
        user_id INTEGER PRIMARY KEY,
        nick TEXT NOT NULL,
        reg_time INTEGER NOT NULL,
        vip INTEGER NOT NULL DEFAULT 0,
        viped INTEGER NOT NULL DEFAULT 0,
        ds_flag INTEGER NOT NULL DEFAULT 0,
        color INTEGER NOT NULL DEFAULT 0,
        texture INTEGER NOT NULL DEFAULT 0,
        energy INTEGER NOT NULL DEFAULT 100,
        coins INTEGER NOT NULL DEFAULT 1000,
        fight_badge INTEGER NOT NULL DEFAULT 0,
        allocatable_exp INTEGER NOT NULL DEFAULT 0,
        map_id INTEGER NOT NULL DEFAULT 1,
        pos_x INTEGER NOT NULL DEFAULT 300,
        pos_y INTEGER NOT NULL DEFAULT 300,
        time_today INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 86400,
        login_cnt INTEGER NOT NULL DEFAULT 0,
        inviter INTEGER NOT NULL DEFAULT 0,
        vip_level INTEGER NOT NULL DEFAULT 0,
        vip_value INTEGER NOT NULL DEFAULT 0,
        vip_stage INTEGER NOT NULL DEFAULT 1,
        vip_end_time INTEGER NOT NULL DEFAULT 0,
        teacher_id INTEGER NOT NULL DEFAULT 0,
        student_id INTEGER NOT NULL DEFAULT 0,
        graduation_count INTEGER NOT NULL DEFAULT 0,
        pet_max_lev INTEGER NOT NULL DEFAULT 0,
        pet_all_num INTEGER NOT NULL DEFAULT 0,
        mon_king_win INTEGER NOT NULL DEFAULT 0,
        cur_stage INTEGER NOT NULL DEFAULT 0,
        max_stage INTEGER NOT NULL DEFAULT 0,
        max_arena_wins INTEGER NOT NULL DEFAULT 0,
        has_nono INTEGER NOT NULL DEFAULT 0,
        super_nono INTEGER NOT NULL DEFAULT 0,
        nono_state INTEGER NOT NULL DEFAULT 0,
        nono_color INTEGER NOT NULL DEFAULT 16777215,
        nono_nick TEXT NOT NULL DEFAULT '',
        nono_flag INTEGER NOT NULL DEFAULT 0,
        nono_power INTEGER NOT NULL DEFAULT 0,
        nono_mate INTEGER NOT NULL DEFAULT 0,
        nono_iq INTEGER NOT NULL DEFAULT 0,
        nono_ai INTEGER NOT NULL DEFAULT 0,
        nono_birth INTEGER NOT NULL DEFAULT 0,
        nono_charge_time INTEGER NOT NULL DEFAULT 0,
        nono_super_energy INTEGER NOT NULL DEFAULT 0,
        nono_super_level INTEGER NOT NULL DEFAULT 0,
        nono_super_stage INTEGER NOT NULL DEFAULT 0,
        badge INTEGER NOT NULL DEFAULT 0,
        cur_title INTEGER NOT NULL DEFAULT 0,
        team_id INTEGER NOT NULL DEFAULT 0,
        extra_data TEXT
      )`,
      
      // 步骤2: 复制数据（只复制保留的字段，新字段设为默认值）
      `INSERT INTO players_new (
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value,
        vip_stage, vip_end_time, teacher_id, student_id, graduation_count,
        pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_birth, nono_charge_time, nono_super_energy, nono_super_level, nono_super_stage,
        badge, cur_title, team_id, extra_data
      )
      SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value,
        vip_stage, vip_end_time, teacher_id, student_id, graduation_count,
        pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_birth, nono_charge_time,
        0 as nono_super_energy,
        nono_super_level,
        0 as nono_super_stage,
        badge, cur_title, team_id, extra_data
      FROM players`,
      
      // 步骤3: 删除旧表
      `DROP TABLE players`,
      
      // 步骤4: 重命名新表
      `ALTER TABLE players_new RENAME TO players`
    ];
  }

  downMySQL(): string[] {
    return [
      `ALTER TABLE players
        DROP COLUMN IF EXISTS nono_super_energy,
        DROP COLUMN IF EXISTS nono_super_stage,
        ADD COLUMN IF NOT EXISTS nono_bio INT NOT NULL DEFAULT 0 COMMENT 'NONO生物值',
        ADD COLUMN IF NOT EXISTS nono_expire INT NOT NULL DEFAULT 0 COMMENT 'NONO过期时间',
        ADD COLUMN IF NOT EXISTS nono_chip INT NOT NULL DEFAULT 0 COMMENT 'NONO芯片',
        ADD COLUMN IF NOT EXISTS nono_grow INT NOT NULL DEFAULT 0 COMMENT 'NONO成长值'`
    ];
  }

  downSQLite(): string[] {
    return [
      // 步骤1: 创建旧表结构（包含旧字段）
      `CREATE TABLE players_old (
        user_id INTEGER PRIMARY KEY,
        nick TEXT NOT NULL,
        reg_time INTEGER NOT NULL,
        vip INTEGER NOT NULL DEFAULT 0,
        viped INTEGER NOT NULL DEFAULT 0,
        ds_flag INTEGER NOT NULL DEFAULT 0,
        color INTEGER NOT NULL DEFAULT 0,
        texture INTEGER NOT NULL DEFAULT 0,
        energy INTEGER NOT NULL DEFAULT 100,
        coins INTEGER NOT NULL DEFAULT 1000,
        fight_badge INTEGER NOT NULL DEFAULT 0,
        allocatable_exp INTEGER NOT NULL DEFAULT 0,
        map_id INTEGER NOT NULL DEFAULT 1,
        pos_x INTEGER NOT NULL DEFAULT 300,
        pos_y INTEGER NOT NULL DEFAULT 300,
        time_today INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 86400,
        login_cnt INTEGER NOT NULL DEFAULT 0,
        inviter INTEGER NOT NULL DEFAULT 0,
        vip_level INTEGER NOT NULL DEFAULT 0,
        vip_value INTEGER NOT NULL DEFAULT 0,
        vip_stage INTEGER NOT NULL DEFAULT 1,
        vip_end_time INTEGER NOT NULL DEFAULT 0,
        teacher_id INTEGER NOT NULL DEFAULT 0,
        student_id INTEGER NOT NULL DEFAULT 0,
        graduation_count INTEGER NOT NULL DEFAULT 0,
        pet_max_lev INTEGER NOT NULL DEFAULT 0,
        pet_all_num INTEGER NOT NULL DEFAULT 0,
        mon_king_win INTEGER NOT NULL DEFAULT 0,
        cur_stage INTEGER NOT NULL DEFAULT 0,
        max_stage INTEGER NOT NULL DEFAULT 0,
        max_arena_wins INTEGER NOT NULL DEFAULT 0,
        has_nono INTEGER NOT NULL DEFAULT 0,
        super_nono INTEGER NOT NULL DEFAULT 0,
        nono_state INTEGER NOT NULL DEFAULT 0,
        nono_color INTEGER NOT NULL DEFAULT 16777215,
        nono_nick TEXT NOT NULL DEFAULT '',
        nono_flag INTEGER NOT NULL DEFAULT 0,
        nono_power INTEGER NOT NULL DEFAULT 0,
        nono_mate INTEGER NOT NULL DEFAULT 0,
        nono_iq INTEGER NOT NULL DEFAULT 0,
        nono_ai INTEGER NOT NULL DEFAULT 0,
        nono_super_level INTEGER NOT NULL DEFAULT 0,
        nono_bio INTEGER NOT NULL DEFAULT 0,
        nono_birth INTEGER NOT NULL DEFAULT 0,
        nono_charge_time INTEGER NOT NULL DEFAULT 0,
        nono_expire INTEGER NOT NULL DEFAULT 0,
        nono_chip INTEGER NOT NULL DEFAULT 0,
        nono_grow INTEGER NOT NULL DEFAULT 0,
        badge INTEGER NOT NULL DEFAULT 0,
        cur_title INTEGER NOT NULL DEFAULT 0,
        team_id INTEGER NOT NULL DEFAULT 0,
        extra_data TEXT
      )`,
      
      // 步骤2: 复制数据（恢复旧字段，新字段设为默认值）
      `INSERT INTO players_old (
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value,
        vip_stage, vip_end_time, teacher_id, student_id, graduation_count,
        pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_super_level, nono_bio, nono_birth, nono_charge_time,
        nono_expire, nono_chip, nono_grow,
        badge, cur_title, team_id, extra_data
      )
      SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value,
        vip_stage, vip_end_time, teacher_id, student_id, graduation_count,
        pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_super_level,
        0 as nono_bio,
        nono_birth, nono_charge_time,
        0 as nono_expire,
        0 as nono_chip,
        0 as nono_grow,
        badge, cur_title, team_id, extra_data
      FROM players`,
      
      // 步骤3: 删除新表
      `DROP TABLE players`,
      
      // 步骤4: 重命名旧表
      `ALTER TABLE players_old RENAME TO players`
    ];
  }
}
