/**
 * 玩家仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IPlayerInfo, createDefaultPlayerInfo } from '../../../shared/models';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Logger } from '../../../shared/utils/Logger';

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
  mess_win: number;
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
  nono_birth: number;
  nono_charge_time: number;
  nono_super_energy: number;
  nono_super_level: number;
  nono_super_stage: number;
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

    // 从配置文件读取默认玩家数据
    const config = GameConfig.GetDefaultPlayerConfig();
    if (!config) {
      Logger.Error('[PlayerRepository] 默认玩家配置未加载');
      throw new Error('默认玩家配置未加载');
    }

    const defaultPlayer = config.player;
    const defaultNoNo = config.nono;

    const result = await this._db.Execute(
      `INSERT INTO players (user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, fight_badge, allocatable_exp, map_id, pos_x, pos_y, time_today, time_limit,
        login_cnt, inviter, vip_level, vip_value, vip_stage, vip_end_time,
        teacher_id, student_id, graduation_count, pet_max_lev, pet_all_num,
        mon_king_win, mess_win, cur_stage, max_stage, max_arena_wins,
        has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai,
        nono_birth, nono_charge_time,
        nono_super_energy, nono_super_level, nono_super_stage,
        badge, cur_title, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, nick, now, 0, 0, 0, color, 0,  // vip=0(非VIP), viped=0(从未是VIP)
        defaultPlayer.energy, defaultPlayer.coins, defaultPlayer.fightBadge, defaultPlayer.allocatableExp,
        defaultPlayer.mapId, defaultPlayer.posX, defaultPlayer.posY,
        defaultPlayer.timeToday, defaultPlayer.timeLimit,
        defaultPlayer.loginCnt, defaultPlayer.inviter,
        defaultPlayer.vipLevel, defaultPlayer.vipValue, defaultPlayer.vipStage, defaultPlayer.vipEndTime,
        defaultPlayer.teacherId, defaultPlayer.studentId, defaultPlayer.graduationCount,
        defaultPlayer.petMaxLev, defaultPlayer.petAllNum,
        defaultPlayer.monKingWin, defaultPlayer.messWin || 0, defaultPlayer.curStage, defaultPlayer.maxStage, defaultPlayer.maxArenaWins,
        defaultNoNo.hasNono, defaultNoNo.superNono, defaultNoNo.nonoState,
        defaultNoNo.nonoColor, defaultNoNo.nonoNick,
        defaultNoNo.nonoFlag, defaultNoNo.nonoPower, defaultNoNo.nonoMate,
        defaultNoNo.nonoIq, defaultNoNo.nonoAi,
        defaultNoNo.nonoBirth || now, defaultNoNo.nonoChargeTime,
        defaultNoNo.nonoSuperEnergy, defaultNoNo.nonoSuperLevel, defaultNoNo.nonoSuperStage,
        0, 0, 0  // badge, cur_title, team_id
      ]
    );

    if (result.affectedRows > 0) {
      // 初始化关联数据表（items, pets, tasks, mails, friends）
      try {
        // 创建空的 items 记录
        await this._db.Execute(
          'INSERT INTO player_items (owner_id, item_list) VALUES (?, ?)',
          [userId, '[]']
        );

        // 创建空的 pets 记录
        await this._db.Execute(
          'INSERT INTO player_pets (owner_id, pet_list) VALUES (?, ?)',
          [userId, '[]']
        );

        // 创建空的 tasks 记录（新手任务85预先接受）
        await this._db.Execute(
          'INSERT INTO player_tasks (owner_id, task_list, task_buffers) VALUES (?, ?, ?)',
          [userId, '{"85":{"taskId":85,"status":1,"acceptTime":' + now + ',"completeTime":0}}', '{}']
        );

        // 创建空的 mails 记录
        await this._db.Execute(
          'INSERT INTO player_mails (owner_id, mail_list) VALUES (?, ?)',
          [userId, '[]']
        );

        // 创建空的 friends 记录
        await this._db.Execute(
          'INSERT INTO player_friends (owner_id, friend_list, black_list, send_apply_list, receive_apply_list, chat_history) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, '[]', '[]', '[]', '[]', '{}']
        );

        return true;
      } catch (error) {
        // 如果关联表创建失败，记录错误但不影响主流程
        // 因为 DataLoader 会在需要时自动创建
        console.error(`[PlayerRepository] 初始化关联数据表失败: userId=${userId}`, error);
        return true;  // 主表创建成功就返回 true
      }
    }

    return false;
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
   * 更新玩家地图（仅地图ID）
   */
  public async UpdatePlayerMap(userId: number, mapId: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET map_id = ? WHERE user_id = ?',
      [mapId, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新货币
   */
  public async UpdateCurrency(userId: number, energy?: number, coins?: number, gold?: number): Promise<boolean> {
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
    if (gold !== undefined) {
      updates.push('gold = ?');
      values.push(gold);
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
  public async AddCurrency(userId: number, energy?: number, coins?: number, gold?: number): Promise<boolean> {
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
    if (gold !== undefined && gold !== 0) {
      updates.push('gold = gold + ?');
      values.push(gold);
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
   * 更新可分配经验
   */
  public async UpdateAllocatableExp(userId: number, allocatableExp: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET allocatable_exp = ? WHERE user_id = ?',
      [allocatableExp, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新服装ID列表
   */
  public async UpdateClothIds(userId: number, clothIds: number[]): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET cloth_ids = ? WHERE user_id = ?',
      [JSON.stringify(clothIds), userId]
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
   * 更新 NoNo 超能能量
   */
  public async UpdateNoNoSuperEnergy(userId: number, energy: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_super_energy = ? WHERE user_id = ?',
      [energy, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 更新 NoNo 超能阶段
   */
  public async UpdateNoNoSuperStage(userId: number, stage: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET nono_super_stage = ? WHERE user_id = ?',
      [stage, userId]
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
  public async EnableSuperNoNo(userId: number, level: number): Promise<boolean> {
    const result = await this._db.Execute(
      'UPDATE players SET super_nono = 1, nono_super_level = ? WHERE user_id = ?',
      [level, userId]
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
    superNono: boolean;
    superLevel: number;
    superEnergy: number;
    superStage: number;
    birth: number;
    chargeTime: number;
    state: number;
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
    if (data.superNono !== undefined) {
      updates.push('super_nono = ?');
      values.push(data.superNono ? 1 : 0);
    }
    if (data.superLevel !== undefined) {
      updates.push('nono_super_level = ?');
      values.push(data.superLevel);
    }
    if (data.superEnergy !== undefined) {
      updates.push('nono_super_energy = ?');
      values.push(data.superEnergy);
    }
    if (data.superStage !== undefined) {
      updates.push('nono_super_stage = ?');
      values.push(data.superStage);
    }
    if (data.birth !== undefined) {
      updates.push('nono_birth = ?');
      values.push(data.birth);
    }
    if (data.chargeTime !== undefined) {
      updates.push('nono_charge_time = ?');
      values.push(data.chargeTime);
    }
    if (data.state !== undefined) {
      updates.push('nono_state = ?');
      values.push(data.state);
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
    player.gold = (row as any).gold || 0;
    player.fightBadge = row.fight_badge;
    player.allocatableExp = (row as any).allocatable_exp || 0;
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
    player.messWin = row.mess_win || 0;
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
    player.nonoBirth = row.nono_birth;
    player.nonoChargeTime = row.nono_charge_time;
    player.nonoSuperEnergy = row.nono_super_energy;
    player.nonoSuperLevel = row.nono_super_level;
    player.nonoSuperStage = row.nono_super_stage;
    player.badge = row.badge;
    player.curTitle = row.cur_title;
    player.teamInfo.id = row.team_id;
    
    // 解析服装ID列表
    try {
      const clothIdsStr = (row as any).cloth_ids;
      player.clothIds = clothIdsStr ? JSON.parse(clothIdsStr) : [];
    } catch (error) {
      Logger.Warn(`[PlayerRepository] 解析 cloth_ids 失败: userId=${row.user_id}`);
      player.clothIds = [];
    }

    return player;
  }
}
