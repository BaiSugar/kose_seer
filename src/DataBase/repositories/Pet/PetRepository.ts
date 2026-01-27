import { BaseRepository } from '../BaseRepository';
import { IPetInfo, createDefaultPetInfo } from '../../../shared/models/PetModel';

/**
 * 数据库精灵行类型
 */
interface IPetRow {
  id: number;
  user_id: number;
  catch_time: number;
  pet_id: number;
  level: number;
  exp: number;
  hp: number;
  max_hp: number;
  atk: number;
  def: number;
  sp_atk: number;
  sp_def: number;
  speed: number;
  ev_hp: number;
  ev_atk: number;
  ev_def: number;
  ev_sp_atk: number;
  ev_sp_def: number;
  ev_speed: number;
  dv_hp: number;
  dv_atk: number;
  dv_def: number;
  dv_sp_atk: number;
  dv_sp_def: number;
  dv_speed: number;
  nature: number;
  skill_array: string;
  is_default: number;
  is_in_bag: number;
  position: number;
  nick: string;
  obtain_time: number;
  obtain_way: number;
  obtain_level: number;
  effect_count: number;
  common_mark: number;
}

/**
 * 精灵仓库
 */
export class PetRepository extends BaseRepository<IPetRow> {
  protected _tableName = 'pets';

  /**
   * 根据ID查找精灵
   */
  public async FindPetById(petId: number): Promise<IPetInfo | null> {
    const rows = await this._db.Query<IPetRow>(
      'SELECT * FROM pets WHERE id = ?',
      [petId]
    );

    if (rows.length === 0) return null;
    return this.toPetInfo(rows[0]);
  }

  /**
   * 获取玩家的所有精灵
   */
  public async FindByUserId(userId: number): Promise<IPetInfo[]> {
    const rows = await this._db.Query<IPetRow>(
      'SELECT * FROM pets WHERE user_id = ? ORDER BY catch_time DESC',
      [userId]
    );

    return rows.map(row => this.toPetInfo(row));
  }

  /**
   * 获取玩家背包中的精灵
   */
  public async FindInBag(userId: number): Promise<IPetInfo[]> {
    const rows = await this._db.Query<IPetRow>(
      'SELECT * FROM pets WHERE user_id = ? AND is_in_bag = 1 ORDER BY position ASC',
      [userId]
    );

    return rows.map(row => this.toPetInfo(row));
  }

  /**
   * 获取玩家仓库中的精灵
   */
  public async FindInStorage(userId: number): Promise<IPetInfo[]> {
    const rows = await this._db.Query<IPetRow>(
      'SELECT * FROM pets WHERE user_id = ? AND is_in_bag = 0 ORDER BY catch_time DESC',
      [userId]
    );

    return rows.map(row => this.toPetInfo(row));
  }

  /**
   * 获取玩家的首发精灵
   */
  public async FindDefault(userId: number): Promise<IPetInfo | null> {
    const rows = await this._db.Query<IPetRow>(
      'SELECT * FROM pets WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [userId]
    );

    if (rows.length === 0) return null;
    return this.toPetInfo(rows[0]);
  }

  /**
   * 创建精灵
   */
  public async Create(petInfo: IPetInfo): Promise<number> {
    const skillArrayJson = JSON.stringify(petInfo.skillArray);
    
    const result = await this._db.Execute(
      `INSERT INTO pets (
        user_id, catch_time, pet_id, level, exp,
        hp, max_hp, atk, def, sp_atk, sp_def, speed,
        ev_hp, ev_atk, ev_def, ev_sp_atk, ev_sp_def, ev_speed,
        dv_hp, dv_atk, dv_def, dv_sp_atk, dv_sp_def, dv_speed,
        nature, skill_array, is_default, is_in_bag, position,
        nick, obtain_time, obtain_way, obtain_level, effect_count, common_mark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        petInfo.userId, petInfo.catchTime, petInfo.petId, petInfo.level, petInfo.exp,
        petInfo.hp, petInfo.maxHp, petInfo.atk, petInfo.def, petInfo.spAtk, petInfo.spDef, petInfo.speed,
        petInfo.evHp, petInfo.evAtk, petInfo.evDef, petInfo.evSpAtk, petInfo.evSpDef, petInfo.evSpeed,
        petInfo.dvHp, petInfo.dvAtk, petInfo.dvDef, petInfo.dvSpAtk, petInfo.dvSpDef, petInfo.dvSpeed,
        petInfo.nature, skillArrayJson, petInfo.isDefault ? 1 : 0, petInfo.isInBag ? 1 : 0, petInfo.position,
        petInfo.nick, petInfo.obtainTime, petInfo.obtainWay, petInfo.obtainLevel, petInfo.effectCount, petInfo.commonMark
      ]
    );

    return result.insertId || 0;
  }

  /**
   * 更新精灵HP
   */
  public async UpdateHp(petId: number, hp: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET hp = ? WHERE id = ?',
      [hp, petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 治疗精灵（恢复满HP）
   */
  public async CurePet(petId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET hp = max_hp WHERE id = ?',
      [petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新精灵经验和等级
   */
  public async UpdateExpAndLevel(petId: number, exp: number, level: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET exp = ?, level = ? WHERE id = ?',
      [exp, level, petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 设置首发精灵
   */
  public async SetDefault(userId: number, petId: number): Promise<boolean> {
    // 先取消所有首发
    await this._db.Execute(
      'UPDATE pets SET is_default = 0 WHERE user_id = ?',
      [userId]
    );

    // 设置新的首发
    const result = await this._db.Execute(
      'UPDATE pets SET is_default = 1 WHERE id = ? AND user_id = ?',
      [petId, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 释放精灵
   */
  public async Release(petId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'DELETE FROM pets WHERE id = ?',
      [petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 移动精灵到仓库
   */
  public async MoveToStorage(petId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET is_in_bag = 0, is_default = 0 WHERE id = ?',
      [petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 移动精灵到背包
   */
  public async MoveToBag(petId: number, position: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET is_in_bag = 1, position = ? WHERE id = ?',
      [position, petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新精灵昵称
   */
  public async UpdateNick(petId: number, nick: string): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE pets SET nick = ? WHERE id = ?',
      [nick, petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取玩家精灵数量
   */
  public async CountByUserId(userId: number): Promise<number> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM pets WHERE user_id = ?',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  /**
   * 获取背包中的精灵数量
   */
  public async CountInBag(userId: number): Promise<number> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM pets WHERE user_id = ? AND is_in_bag = 1',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  /**
   * 批量更新精灵属性
   */
  public async UpdateStats(petId: number, stats: {
    hp?: number;
    maxHp?: number;
    atk?: number;
    def?: number;
    spAtk?: number;
    spDef?: number;
    speed?: number;
  }): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (stats.hp !== undefined) {
      updates.push('hp = ?');
      values.push(stats.hp);
    }
    if (stats.maxHp !== undefined) {
      updates.push('max_hp = ?');
      values.push(stats.maxHp);
    }
    if (stats.atk !== undefined) {
      updates.push('atk = ?');
      values.push(stats.atk);
    }
    if (stats.def !== undefined) {
      updates.push('def = ?');
      values.push(stats.def);
    }
    if (stats.spAtk !== undefined) {
      updates.push('sp_atk = ?');
      values.push(stats.spAtk);
    }
    if (stats.spDef !== undefined) {
      updates.push('sp_def = ?');
      values.push(stats.spDef);
    }
    if (stats.speed !== undefined) {
      updates.push('speed = ?');
      values.push(stats.speed);
    }

    if (updates.length === 0) return false;

    values.push(petId);

    const result = await this._db.Execute(
      `UPDATE pets SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新精灵技能列表
   */
  public async UpdateSkills(petId: number, skills: number[]): Promise<boolean> {
    const skillArrayJson = JSON.stringify(skills);
    const result = await this._db.Execute(
      'UPDATE pets SET skill_array = ? WHERE id = ?',
      [skillArrayJson, petId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 转换为 IPetInfo
   */
  private toPetInfo(row: IPetRow): IPetInfo {
    let skillArray: number[] = [];
    try {
      skillArray = JSON.parse(row.skill_array);
    } catch (e) {
      skillArray = [];
    }

    return {
      id: row.id,
      userId: row.user_id,
      catchTime: row.catch_time,
      petId: row.pet_id,
      level: row.level,
      exp: row.exp,
      hp: row.hp,
      maxHp: row.max_hp,
      atk: row.atk,
      def: row.def,
      spAtk: row.sp_atk,
      spDef: row.sp_def,
      speed: row.speed,
      evHp: row.ev_hp,
      evAtk: row.ev_atk,
      evDef: row.ev_def,
      evSpAtk: row.ev_sp_atk,
      evSpDef: row.ev_sp_def,
      evSpeed: row.ev_speed,
      dvHp: row.dv_hp,
      dvAtk: row.dv_atk,
      dvDef: row.dv_def,
      dvSpAtk: row.dv_sp_atk,
      dvSpDef: row.dv_sp_def,
      dvSpeed: row.dv_speed,
      nature: row.nature,
      skillArray,
      isDefault: row.is_default === 1,
      isInBag: row.is_in_bag === 1,
      position: row.position,
      nick: row.nick,
      obtainTime: row.obtain_time,
      obtainWay: row.obtain_way,
      obtainLevel: row.obtain_level,
      effectCount: row.effect_count,
      commonMark: row.common_mark
    };
  }
}
