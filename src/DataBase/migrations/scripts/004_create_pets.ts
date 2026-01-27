/**
 * 迁移脚本: 创建精灵表
 */
import { IMigration } from '../IMigration';

export class Migration004CreatePets implements IMigration {
  version = 4;
  name = 'create_pets';

  upMySQL(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS pets (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '精灵唯一ID',
        owner_id INT NOT NULL COMMENT '所属玩家ID',
        monster_id INT NOT NULL COMMENT '精灵模板ID',
        name VARCHAR(32) NOT NULL COMMENT '精灵名称',
        level INT NOT NULL DEFAULT 1 COMMENT '等级',
        exp INT NOT NULL DEFAULT 0 COMMENT '经验值',
        dv INT NOT NULL DEFAULT 0 COMMENT '个体值 (DV)',
        nature INT NOT NULL DEFAULT 0 COMMENT '性格',
        hp INT NOT NULL DEFAULT 100 COMMENT '当前HP',
        max_hp INT NOT NULL DEFAULT 100 COMMENT '最大HP',
        attack INT NOT NULL DEFAULT 10 COMMENT '攻击',
        defence INT NOT NULL DEFAULT 10 COMMENT '防御',
        sp_atk INT NOT NULL DEFAULT 10 COMMENT '特攻',
        sp_def INT NOT NULL DEFAULT 10 COMMENT '特防',
        speed INT NOT NULL DEFAULT 10 COMMENT '速度',
        ev_hp INT NOT NULL DEFAULT 0 COMMENT 'HP努力值',
        ev_attack INT NOT NULL DEFAULT 0 COMMENT '攻击努力值',
        ev_defence INT NOT NULL DEFAULT 0 COMMENT '防御努力值',
        ev_sp_atk INT NOT NULL DEFAULT 0 COMMENT '特攻努力值',
        ev_sp_def INT NOT NULL DEFAULT 0 COMMENT '特防努力值',
        ev_speed INT NOT NULL DEFAULT 0 COMMENT '速度努力值',
        skills JSON COMMENT '技能列表 [{id, pp}]',
        catch_time INT NOT NULL DEFAULT 0 COMMENT '捕获时间',
        catch_map INT NOT NULL DEFAULT 0 COMMENT '捕获地图ID',
        catch_rect INT NOT NULL DEFAULT 0 COMMENT '捕获区域',
        catch_level INT NOT NULL DEFAULT 1 COMMENT '捕获时等级',
        skin_id INT NOT NULL DEFAULT 0 COMMENT '皮肤ID',
        is_default TINYINT NOT NULL DEFAULT 0 COMMENT '是否首发',
        slot_index INT NOT NULL DEFAULT -1 COMMENT '背包槽位 (-1表示仓库)',
        effects JSON COMMENT '效果列表',
        INDEX idx_owner_id (owner_id),
        INDEX idx_monster_id (monster_id),
        INDEX idx_is_default (is_default),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='精灵表'
    `];
  }

  upSQLite(): string[] {
    return [`
      CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        monster_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        exp INTEGER NOT NULL DEFAULT 0,
        dv INTEGER NOT NULL DEFAULT 0,
        nature INTEGER NOT NULL DEFAULT 0,
        hp INTEGER NOT NULL DEFAULT 100,
        max_hp INTEGER NOT NULL DEFAULT 100,
        attack INTEGER NOT NULL DEFAULT 10,
        defence INTEGER NOT NULL DEFAULT 10,
        sp_atk INTEGER NOT NULL DEFAULT 10,
        sp_def INTEGER NOT NULL DEFAULT 10,
        speed INTEGER NOT NULL DEFAULT 10,
        ev_hp INTEGER NOT NULL DEFAULT 0,
        ev_attack INTEGER NOT NULL DEFAULT 0,
        ev_defence INTEGER NOT NULL DEFAULT 0,
        ev_sp_atk INTEGER NOT NULL DEFAULT 0,
        ev_sp_def INTEGER NOT NULL DEFAULT 0,
        ev_speed INTEGER NOT NULL DEFAULT 0,
        skills TEXT,
        catch_time INTEGER NOT NULL DEFAULT 0,
        catch_map INTEGER NOT NULL DEFAULT 0,
        catch_rect INTEGER NOT NULL DEFAULT 0,
        catch_level INTEGER NOT NULL DEFAULT 1,
        skin_id INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        slot_index INTEGER NOT NULL DEFAULT -1,
        effects TEXT,
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id)
    `, `
      CREATE INDEX IF NOT EXISTS idx_pets_monster_id ON pets(monster_id)
    `, `
      CREATE INDEX IF NOT EXISTS idx_pets_is_default ON pets(is_default)
    `];
  }

  downMySQL(): string[] {
    return ['DROP TABLE IF EXISTS pets'];
  }

  downSQLite(): string[] {
    return ['DROP TABLE IF EXISTS pets'];
  }
}
