/**
 * 玩家仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IPlayerInfo, createDefaultPlayerInfo } from '../../../shared/models';

/**
 * 数据库玩家行类型
 */
interface IPlayerRow {
  user_id: number;
  nick: string;
  reg_time: number;
  vip: number;
  viped: number;
  ds_flag: number;
  color: number;
  texture: number;
  energy: number;
  coins: number;
  fight_badge: number;
  map_id: number;
  pos_x: number;
  pos_y: number;
  time_today: number;
  time_limit: number;
  login_cnt: number;
  inviter: number;
  vip_level: number;
  vip_value: number;
  vip_stage: number;
  vip_end_time: number;
  teacher_id: number;
  student_id: number;
  graduation_count: number;
  pet_max_lev: number;
  pet_all_num: number;
  mon_king_win: number;
  cur_stage: number;
  max_stage: number;
  max_arena_wins: number;
  has_nono: number;
  super_nono: number;
  nono_state: number;
  nono_color: number;
  nono_nick: string;
  nono_flag: number;
  nono_power: number;
  nono_mate: number;
  nono_iq: number;
  nono_ai: number;
  nono_super_level: number;
  nono_bio: number;
  nono_birth: number;
  nono_charge_time: number;
  nono_expire: number;
  nono_chip: number;
  nono_grow: number;
  badge: number;
  cur_title: number;
  team_id: number;
  extra_data: string | null;
}

export class PlayerRepository extends BaseRepository<IPlayerRow> {
  protected _tableName = 'players';

  /**
   * 根据用户ID查找玩家
   */
  public async FindByUserId(userId: number): Promise<IPlayerInfo | null> {
    const rows = await this._db.Query<IPlayerRow>(
      'SELECT * FROM players WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) return null;
    return this.toPlayerInfo(rows[0]);
  }

  /**
   * 根据昵称查找玩家
   */
  public async FindByNick(nick: string): Promise<IPlayerInfo | null> {
    const rows = await this._db.Query<IPlayerRow>(
      'SELECT * FROM players WHERE nick = ?',
      [nick]
    );

    if (rows.length === 0) return null;
    return this.toPlayerInfo(rows[0]);
  }

  /**
   * 创建玩家
   * @param userId 用户ID
   * @param nick 昵称
   * @param color 颜色
   */
  public async CreatePlayer(userId: number, nick: string, color: number = 0): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);

    // 默认 NoNo 数据
    const defaultNoNo = {
      hasNono: 1,                    // 默认拥有 NoNo
      superNono: 0,                  // 不是超级 NoNo
      nonoState: 0,                  // NoNo 状态
      nonoColor: 0xFFFFFF,           // 白色
      nonoNick: 'NoNo',              // 默认昵称
      nonoFlag: 1,                   // NoNo 标志
      nonoPower: 10000,              // 体力
      nonoMate: 10000,               // 心情
      nonoIq: 0,                     // 智商
      nonoAi: 0,                     // AI
      nonoSuperLevel: 0,             // 超能等级
      nonoBio: 0,                    // 生物值
      nonoBirth: now,                // 出生时间（当前时间）
      nonoChargeTime: 0,             // 充电时间
      nonoExpire: 0,                 // 过期时间
      nonoChip: 0,                   // 芯片
      nonoGrow: 0                    // 成长值
    };

    const result = await this._db.Execute(
      `INSERT INTO players (user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, map_id, pos_x, pos_y, time_today, time_limit,
        login_cnt, inviter, vip_level, vip_value, vip_stage, vip_end_time,
        teacher_id, student_id, graduation_count, pet_max_lev, pet_all_num,
        mon_king_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_super_level, nono_bio, nono_birth, nono_charge_time,
        nono_expire, nono_chip, nono_grow,
        badge, cur_title, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, nick, now, 0, 0, 0, color, 0,
        100, 1000, 0, 1, 300, 300, 0, 0,
        1, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0,
        0, 1, 0, 0,
        defaultNoNo.hasNono, defaultNoNo.superNono, defaultNoNo.nonoState, defaultNoNo.nonoColor, defaultNoNo.nonoNick,
        defaultNoNo.nonoFlag, defaultNoNo.nonoPower, defaultNoNo.nonoMate, defaultNoNo.nonoIq, defaultNoNo.nonoAi,
        defaultNoNo.nonoSuperLevel, defaultNoNo.nonoBio, defaultNoNo.nonoBirth, defaultNoNo.nonoChargeTime,
        defaultNoNo.nonoExpire, defaultNoNo.nonoChip, defaultNoNo.nonoGrow,
        0, 0, 0
      ]
    );

    return result.affectedRows > 0;
  }

  /**
   * 检查昵称是否已存在
   */
  public async NickExists(nick: string): Promise<boolean> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM players WHERE nick = ?',
      [nick]
    );

    return rows[0]?.count > 0;
  }

  /**
   * 更新玩家位置
   */
  public async UpdatePosition(userId: number, mapId: number, posX: number, posY: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET map_id = ?, pos_x = ?, pos_y = ? WHERE user_id = ?',
      [mapId, posX, posY, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新货币
   */
  public async UpdateCurrency(userId: number, energy?: number, coins?: number): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (energy !== undefined) {
      updates.push('energy = ?');
      values.push(energy);
    }
    if (coins !== undefined) {
      updates.push('coins = ?');
      values.push(coins);
    }

    if (updates.length === 0) return false;

    values.push(userId);

    const result = await this._db.Execute(
      `UPDATE players SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 增加货币
   */
  public async AddCurrency(userId: number, energy?: number, coins?: number): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (energy !== undefined && energy !== 0) {
      updates.push('energy = energy + ?');
      values.push(energy);
    }
    if (coins !== undefined && coins !== 0) {
      updates.push('coins = coins + ?');
      values.push(coins);
    }

    if (updates.length === 0) return false;

    values.push(userId);

    const result = await this._db.Execute(
      `UPDATE players SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新登录次数
   */
  public async IncrementLoginCount(userId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET login_cnt = login_cnt + 1 WHERE user_id = ?',
      [userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新VIP信息
   */
  public async UpdateVIP(userId: number, vip: number, vipLevel: number, vipEndTime: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET vip = ?, vip_level = ?, vip_end_time = ? WHERE user_id = ?',
      [vip, vipLevel, vipEndTime, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新昵称
   */
  public async UpdateNickname(userId: number, nick: string): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nick = ? WHERE user_id = ?',
      [nick, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新颜色
   */
  public async UpdateColor(userId: number, color: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET color = ? WHERE user_id = ?',
      [color, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新飞行模式
   */
  public async UpdateFlyMode(userId: number, flyMode: number): Promise<boolean> {
    // 飞行模式存储在extra_data中，这里简化处理
    // TODO: 如果需要持久化，可以添加fly_mode字段到数据库
    return true;
  }

  // ==================== NoNo 相关方法 ====================

  /**
   * 更新 NoNo 标志（是否拥有 NoNo）
   */
  public async UpdateNoNoFlag(userId: number, flag: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_flag = ?, has_nono = ? WHERE user_id = ?',
      [flag, flag, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 昵称
   */
  public async UpdateNoNoNick(userId: number, nick: string): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_nick = ? WHERE user_id = ?',
      [nick, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 颜色
   */
  public async UpdateNoNoColor(userId: number, color: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_color = ? WHERE user_id = ?',
      [color, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 体力值
   */
  public async UpdateNoNoPower(userId: number, power: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_power = ? WHERE user_id = ?',
      [power, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 心情值
   */
  public async UpdateNoNoMate(userId: number, mate: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_mate = ? WHERE user_id = ?',
      [mate, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 智商
   */
  public async UpdateNoNoIq(userId: number, iq: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_iq = ? WHERE user_id = ?',
      [iq, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo AI
   */
  public async UpdateNoNoAi(userId: number, ai: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_ai = ? WHERE user_id = ?',
      [ai, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 超能等级
   */
  public async UpdateNoNoSuperLevel(userId: number, level: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_super_level = ? WHERE user_id = ?',
      [level, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 充电时间
   */
  public async UpdateNoNoChargeTime(userId: number, chargeTime: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_charge_time = ? WHERE user_id = ?',
      [chargeTime, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 过期时间
   */
  public async UpdateNoNoExpire(userId: number, expire: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_expire = ? WHERE user_id = ?',
      [expire, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 芯片
   */
  public async UpdateNoNoChip(userId: number, chip: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_chip = ? WHERE user_id = ?',
      [chip, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 成长值
   */
  public async UpdateNoNoGrow(userId: number, grow: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_grow = ? WHERE user_id = ?',
      [grow, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 增加 NoNo 体力和心情
   */
  public async AddNoNoEnergyMate(userId: number, powerDelta: number, mateDelta: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_power = nono_power + ?, nono_mate = nono_mate + ? WHERE user_id = ?',
      [powerDelta, mateDelta, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 开启超级 NoNo
   */
  public async EnableSuperNoNo(userId: number, level: number, expire: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET super_nono = 1, nono_super_level = ?, nono_expire = ? WHERE user_id = ?',
      [level, expire, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 批量更新 NoNo 数据（用于复杂操作）
   */
  public async UpdateNoNoData(userId: number, data: Partial<{
    flag: number;
    nick: string;
    color: number;
    power: number;
    mate: number;
    iq: number;
    ai: number;
    superLevel: number;
    chargeTime: number;
    expire: number;
    chip: number;
    grow: number;
  }>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.flag !== undefined) {
      updates.push('nono_flag = ?', 'has_nono = ?');
      values.push(data.flag, data.flag);
    }
    if (data.nick !== undefined) {
      updates.push('nono_nick = ?');
      values.push(data.nick);
    }
    if (data.color !== undefined) {
      updates.push('nono_color = ?');
      values.push(data.color);
    }
    if (data.power !== undefined) {
      updates.push('nono_power = ?');
      values.push(data.power);
    }
    if (data.mate !== undefined) {
      updates.push('nono_mate = ?');
      values.push(data.mate);
    }
    if (data.iq !== undefined) {
      updates.push('nono_iq = ?');
      values.push(data.iq);
    }
    if (data.ai !== undefined) {
      updates.push('nono_ai = ?');
      values.push(data.ai);
    }
    if (data.superLevel !== undefined) {
      updates.push('nono_super_level = ?');
      values.push(data.superLevel);
    }
    if (data.chargeTime !== undefined) {
      updates.push('nono_charge_time = ?');
      values.push(data.chargeTime);
    }
    if (data.expire !== undefined) {
      updates.push('nono_expire = ?');
      values.push(data.expire);
    }
    if (data.chip !== undefined) {
      updates.push('nono_chip = ?');
      values.push(data.chip);
    }
    if (data.grow !== undefined) {
      updates.push('nono_grow = ?');
      values.push(data.grow);
    }

    if (updates.length === 0) return false;

    values.push(userId);

    const result = await this._db.Execute(
      `UPDATE players SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 转换为 IPlayerInfo
   */
  private toPlayerInfo(row: IPlayerRow): IPlayerInfo {
    const player = createDefaultPlayerInfo(row.user_id, row.nick);

    player.regTime = row.reg_time;
    player.vip = row.vip;
    player.viped = row.viped;
    player.dsFlag = row.ds_flag;
    player.color = row.color;
    player.texture = row.texture;
    player.energy = row.energy;
    player.coins = row.coins;
    player.fightBadge = row.fight_badge;
    player.mapID = row.map_id;
    player.posX = row.pos_x;
    player.posY = row.pos_y;
    player.timeToday = row.time_today;
    player.timeLimit = row.time_limit;
    player.loginCnt = row.login_cnt;
    player.inviter = row.inviter;
    player.vipLevel = row.vip_level;
    player.vipValue = row.vip_value;
    player.vipStage = row.vip_stage;
    player.vipEndTime = row.vip_end_time;
    player.teacherID = row.teacher_id;
    player.studentID = row.student_id;
    player.graduationCount = row.graduation_count;
    player.petMaxLev = row.pet_max_lev;
    player.petAllNum = row.pet_all_num;
    player.monKingWin = row.mon_king_win;
    player.curStage = row.cur_stage;
    player.maxStage = row.max_stage;
    player.maxArenaWins = row.max_arena_wins;
    player.hasNono = row.has_nono === 1;
    player.superNono = row.super_nono === 1;
    player.nonoState = row.nono_state;
    player.nonoColor = row.nono_color;
    player.nonoNick = row.nono_nick;
    player.nonoFlag = row.nono_flag;
    player.nonoPower = row.nono_power;
    player.nonoMate = row.nono_mate;
    player.nonoIq = row.nono_iq;
    player.nonoAi = row.nono_ai;
    player.nonoSuperLevel = row.nono_super_level;
    player.nonoBio = row.nono_bio;
    player.nonoBirth = row.nono_birth;
    player.nonoChargeTime = row.nono_charge_time;
    player.nonoExpire = row.nono_expire;
    player.nonoChip = row.nono_chip;
    player.nonoGrow = row.nono_grow;
    player.badge = row.badge;
    player.curTitle = row.cur_title;
    player.teamInfo.id = row.team_id;

    return player;
  }
}
