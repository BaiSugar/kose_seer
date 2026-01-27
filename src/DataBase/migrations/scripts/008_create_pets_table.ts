/**
 * 迁移脚本: 创建精灵表
 */
import { IMigration } from '../IMigration';

export class Migration008CreatePetsTable implements IMigration {
  version = 8;
  name = 'create_pets_table';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS pets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        catch_time INT NOT NULL DEFAULT 0 COMMENT '捕获时间',
        pet_id INT NOT NULL COMMENT '精灵种类ID',
        level INT NOT NULL DEFAULT 1 COMMENT '等级',
        exp INT NOT NULL DEFAULT 0 COMMENT '经验值',
        hp INT NOT NULL DEFAULT 0 COMMENT '当前HP',
        max_hp INT NOT NULL DEFAULT 0 COMMENT '最大HP',
        atk INT NOT NULL DEFAULT 0 COMMENT '攻击',
        def INT NOT NULL DEFAULT 0 COMMENT '防御',
        sp_atk INT NOT NULL DEFAULT 0 COMMENT '特攻',
        sp_def INT NOT NULL DEFAULT 0 COMMENT '特防',
        speed INT NOT NULL DEFAULT 0 COMMENT '速度',
        ev_hp INT NOT NULL DEFAULT 0 COMMENT 'HP努力值',
        ev_atk INT NOT NULL DEFAULT 0 COMMENT '攻击努力值',
        ev_def INT NOT NULL DEFAULT 0 COMMENT '防御努力值',
        ev_sp_atk INT NOT NULL DEFAULT 0 COMMENT '特攻努力值',
        ev_sp_def INT NOT NULL DEFAULT 0 COMMENT '特防努力值',
        ev_speed INT NOT NULL DEFAULT 0 COMMENT '速度努力值',
        dv_hp INT NOT NULL DEFAULT 0 COMMENT 'HP个体值',
        dv_atk INT NOT NULL DEFAULT 0 COMMENT '攻击个体值',
        dv_def INT NOT NULL DEFAULT 0 COMMENT '防御个体值',
        dv_sp_atk INT NOT NULL DEFAULT 0 COMMENT '特攻个体值',
        dv_sp_def INT NOT NULL DEFAULT 0 COMMENT '特防个体值',
        dv_speed INT NOT NULL DEFAULT 0 COMMENT '速度个体值',
        nature INT NOT NULL DEFAULT 0 COMMENT '性格',
        skill_array TEXT NOT NULL DEFAULT '[]' COMMENT '技能列表JSON',
        is_default INT NOT NULL DEFAULT 0 COMMENT '是否首发',
        is_in_bag INT NOT NULL DEFAULT 1 COMMENT '是否在背包',
        position INT NOT NULL DEFAULT 0 COMMENT '背包位置',
        nick VARCHAR(16) NOT NULL DEFAULT '' COMMENT '昵称',
        obtain_time INT NOT NULL DEFAULT 0 COMMENT '获得时间',
        obtain_way INT NOT NULL DEFAULT 0 COMMENT '获得方式',
        obtain_level INT NOT NULL DEFAULT 1 COMMENT '获得时等级',
        effect_count INT NOT NULL DEFAULT 0 COMMENT '特效计数',
        common_mark INT NOT NULL DEFAULT 0 COMMENT '通用标记',
        INDEX idx_user_id (user_id),
        INDEX idx_is_default (user_id, is_default),
        INDEX idx_in_bag (user_id, is_in_bag),
        FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='精灵表'
    `];
  }

  upSQLite(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        catch_time INTEGER NOT NULL DEFAULT 0,
        pet_id INTEGER NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        exp INTEGER NOT NULL DEFAULT 0,
        hp INTEGER NOT NULL DEFAULT 0,
        max_hp INTEGER NOT NULL DEFAULT 0,
        atk INTEGER NOT NULL DEFAULT 0,
        def INTEGER NOT NULL DEFAULT 0,
        sp_atk INTEGER NOT NULL DEFAULT 0,
        sp_def INTEGER NOT NULL DEFAULT 0,
        speed INTEGER NOT NULL DEFAULT 0,
        ev_hp INTEGER NOT NULL DEFAULT 0,
        ev_atk INTEGER NOT NULL DEFAULT 0,
        ev_def INTEGER NOT NULL DEFAULT 0,
        ev_sp_atk INTEGER NOT NULL DEFAULT 0,
        ev_sp_def INTEGER NOT NULL DEFAULT 0,
        ev_speed INTEGER NOT NULL DEFAULT 0,
        dv_hp INTEGER NOT NULL DEFAULT 0,
        dv_atk INTEGER NOT NULL DEFAULT 0,
        dv_def INTEGER NOT NULL DEFAULT 0,
        dv_sp_atk INTEGER NOT NULL DEFAULT 0,
        dv_sp_def INTEGER NOT NULL DEFAULT 0,
        dv_speed INTEGER NOT NULL DEFAULT 0,
        nature INTEGER NOT NULL DEFAULT 0,
        skill_array TEXT NOT NULL DEFAULT '[]',
        is_default INTEGER NOT NULL DEFAULT 0,
        is_in_bag INTEGER NOT NULL DEFAULT 1,
        position INTEGER NOT NULL DEFAULT 0,
        nick TEXT NOT NULL DEFAULT '',
        obtain_time INTEGER NOT NULL DEFAULT 0,
        obtain_way INTEGER NOT NULL DEFAULT 0,
        obtain_level INTEGER NOT NULL DEFAULT 1,
        effect_count INTEGER NOT NULL DEFAULT 0,
        common_mark INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pets_is_default ON pets(user_id, is_default)`,
      `CREATE INDEX IF NOT EXISTS idx_pets_in_bag ON pets(user_id, is_in_bag)`
    ];
  }

  downMySQL(): string[] {
    return [
      'DROP TABLE IF EXISTS pets'
    ];
  }

  downSQLite(): string[] {
    return [
      'DROP INDEX IF EXISTS idx_pets_in_bag',
      'DROP INDEX IF EXISTS idx_pets_is_default',
      'DROP INDEX IF EXISTS idx_pets_user_id',
      'DROP TABLE IF EXISTS pets'
    ];
  }
}
