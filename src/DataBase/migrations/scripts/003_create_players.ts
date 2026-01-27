/**
 * 迁移脚本: 创建玩家表
 */
import { IMigration } from '../IMigration';

export class Migration003CreatePlayers implements IMigration {
  version = 3;
  name = 'create_players';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS players (
        user_id INT PRIMARY KEY COMMENT '用户ID (关联accounts.id)',
        nick VARCHAR(32) NOT NULL COMMENT '昵称',
        reg_time INT NOT NULL COMMENT '注册时间',
        vip INT NOT NULL DEFAULT 0 COMMENT 'VIP标志',
        viped INT NOT NULL DEFAULT 0 COMMENT '曾经VIP标志',
        ds_flag INT NOT NULL DEFAULT 0 COMMENT 'DS标志',
        color INT NOT NULL DEFAULT 0 COMMENT '颜色',
        texture INT NOT NULL DEFAULT 0 COMMENT '纹理',
        energy INT NOT NULL DEFAULT 100 COMMENT '能量',
        coins INT NOT NULL DEFAULT 1000 COMMENT '赛尔豆',
        fight_badge INT NOT NULL DEFAULT 0 COMMENT '战斗徽章',
        map_id INT NOT NULL DEFAULT 1 COMMENT '当前地图ID',
        pos_x INT NOT NULL DEFAULT 300 COMMENT 'X坐标',
        pos_y INT NOT NULL DEFAULT 300 COMMENT 'Y坐标',
        time_today INT NOT NULL DEFAULT 0 COMMENT '今日在线时间',
        time_limit INT NOT NULL DEFAULT 0 COMMENT '时间限制',
        login_cnt INT NOT NULL DEFAULT 1 COMMENT '登录次数',
        inviter INT NOT NULL DEFAULT 0 COMMENT '邀请者ID',
        vip_level INT NOT NULL DEFAULT 0 COMMENT 'VIP等级',
        vip_value INT NOT NULL DEFAULT 0 COMMENT 'VIP值',
        vip_stage INT NOT NULL DEFAULT 1 COMMENT 'VIP阶段',
        vip_end_time INT NOT NULL DEFAULT 0 COMMENT 'VIP结束时间',
        teacher_id INT NOT NULL DEFAULT 0 COMMENT '老师ID',
        student_id INT NOT NULL DEFAULT 0 COMMENT '学生ID',
        graduation_count INT NOT NULL DEFAULT 0 COMMENT '毕业次数',
        pet_max_lev INT NOT NULL DEFAULT 0 COMMENT '精灵最高等级',
        pet_all_num INT NOT NULL DEFAULT 0 COMMENT '精灵总数',
        mon_king_win INT NOT NULL DEFAULT 0 COMMENT '怪物王胜利次数',
        cur_stage INT NOT NULL DEFAULT 1 COMMENT '当前关卡',
        max_stage INT NOT NULL DEFAULT 0 COMMENT '最大关卡',
        max_arena_wins INT NOT NULL DEFAULT 0 COMMENT '竞技场最大连胜',
        has_nono TINYINT NOT NULL DEFAULT 0 COMMENT '是否有NONO',
        super_nono TINYINT NOT NULL DEFAULT 0 COMMENT '是否超级NONO',
        nono_state INT NOT NULL DEFAULT 0 COMMENT 'NONO状态位图',
        nono_color INT NOT NULL DEFAULT 0 COMMENT 'NONO颜色',
        nono_nick VARCHAR(32) NOT NULL DEFAULT '' COMMENT 'NONO昵称',
        badge INT NOT NULL DEFAULT 0 COMMENT '徽章',
        cur_title INT NOT NULL DEFAULT 0 COMMENT '当前称号',
        team_id INT NOT NULL DEFAULT 0 COMMENT '战队ID',
        extra_data JSON COMMENT '扩展数据',
        INDEX idx_nick (nick),
        INDEX idx_team_id (team_id),
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS players (
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
        map_id INTEGER NOT NULL DEFAULT 1,
        pos_x INTEGER NOT NULL DEFAULT 300,
        pos_y INTEGER NOT NULL DEFAULT 300,
        time_today INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 0,
        login_cnt INTEGER NOT NULL DEFAULT 1,
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
        cur_stage INTEGER NOT NULL DEFAULT 1,
        max_stage INTEGER NOT NULL DEFAULT 0,
        max_arena_wins INTEGER NOT NULL DEFAULT 0,
        has_nono INTEGER NOT NULL DEFAULT 0,
        super_nono INTEGER NOT NULL DEFAULT 0,
        nono_state INTEGER NOT NULL DEFAULT 0,
        nono_color INTEGER NOT NULL DEFAULT 0,
        nono_nick TEXT NOT NULL DEFAULT '',
        badge INTEGER NOT NULL DEFAULT 0,
        cur_title INTEGER NOT NULL DEFAULT 0,
        team_id INTEGER NOT NULL DEFAULT 0,
        extra_data TEXT,
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_players_nick ON players(nick)
    `, `
      CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS players'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS players'];
  }
}
