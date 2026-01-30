import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { DatabaseManager } from '../../DataBase/DatabaseManager';
import { Logger } from '../../shared/utils/Logger';
import { GameConfig } from '../../shared/config/game/GameConfig';

/**
 * 玩家管理服务
 */
export class PlayerService {
  /**
   * 获取玩家列表
   */
  public async getPlayers(page: number, limit: number, search?: string, onlineOnly?: boolean): Promise<any> {
    const offset = (page - 1) * limit;
    
    // 如果只查询在线玩家
    if (onlineOnly) {
      try {
        const { PlayerManager } = await import('../../GameServer/Game/Player/PlayerManager');
        const { OnlineTracker } = await import('../../GameServer/Game/Player/OnlineTracker');
        
        const allPlayers = PlayerManager.GetInstance().GetAllPlayers();
        let filteredPlayers = allPlayers;
        
        // 如果有搜索条件，过滤玩家
        if (search) {
          const searchLower = search.toLowerCase();
          const searchNum = Number(search) || 0;
          filteredPlayers = allPlayers.filter(p => 
            p.Data.nick.toLowerCase().includes(searchLower) || 
            p.Uid === searchNum
          );
        }
        
        const total = filteredPlayers.length;
        const paginatedPlayers = filteredPlayers.slice(offset, offset + limit);
        
        const players = paginatedPlayers.map(player => {
          const mapId = OnlineTracker.Instance.GetPlayerMap(player.Uid);
          
          return {
            // 主要显示字段
            userID: player.Uid,
            nick: player.Data.nick,
            coins: player.Data.coins,
            energy: player.Data.energy,
            vip: player.Data.vip,
            vipLevel: player.Data.vipLevel,
            petMaxLev: player.Data.petMaxLev,
            petAllNum: player.Data.petAllNum,
            regTime: player.Data.regTime,
            loginCnt: player.Data.loginCnt,
            allocatableExp: player.Data.allocatableExp,
            mapID: mapId,
            isOnline: true,
            // 所有详细字段
            viped: player.Data.viped,
            dsFlag: player.Data.dsFlag,
            color: player.Data.color,
            texture: player.Data.texture,
            fightBadge: player.Data.fightBadge,
            posX: player.Data.posX,
            posY: player.Data.posY,
            timeToday: player.Data.timeToday,
            timeLimit: player.Data.timeLimit,
            inviter: player.Data.inviter,
            vipValue: player.Data.vipValue,
            vipStage: player.Data.vipStage,
            vipEndTime: player.Data.vipEndTime,
            teacherID: player.Data.teacherID,
            studentID: player.Data.studentID,
            graduationCount: player.Data.graduationCount,
            monKingWin: player.Data.monKingWin,
            messWin: player.Data.messWin,
            curStage: player.Data.curStage,
            maxStage: player.Data.maxStage,
            maxArenaWins: player.Data.maxArenaWins,
            hasNono: player.Data.hasNono,
            superNono: player.Data.superNono,
            nonoNick: player.Data.nonoNick,
            nonoColor: player.Data.nonoColor,
            nonoPower: player.Data.nonoPower,
            nonoMate: player.Data.nonoMate
          };
        });
        
        return {
          total,
          page,
          limit,
          players
        };
      } catch (error) {
        Logger.Error('[PlayerService] 获取在线玩家列表失败', error as Error);
        return {
          total: 0,
          page,
          limit,
          players: []
        };
      }
    }
    
    // 查询所有玩家（从数据库）
    let whereClause = '';
    const params: any[] = [];
    
    if (search) {
      whereClause = 'WHERE nick LIKE ? OR user_id = ?';
      params.push(`%${search}%`, Number(search) || 0);
    }
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM players ${whereClause}`;
    const countResult = await DatabaseManager.Instance.Query<{ total: number }>(countSql, params);
    const total = countResult[0]?.total || 0;
    
    // 查询玩家ID列表
    const sql = `
      SELECT user_id as userID
      FROM players
      ${whereClause}
      ORDER BY user_id DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = await DatabaseManager.Instance.Query<{ userID: number }>(sql, [...params, limit, offset]);
    
    // 检查哪些玩家在线
    let onlinePlayerIds: Set<number> = new Set();
    try {
      const { PlayerManager } = await import('../../GameServer/Game/Player/PlayerManager');
      const allPlayers = PlayerManager.GetInstance().GetAllPlayers();
      onlinePlayerIds = new Set(allPlayers.map(p => p.Uid));
    } catch (error) {
      // PlayerManager未初始化，所有玩家都显示为离线
    }
    
    // 使用 DatabaseHelper 获取完整玩家数据
    const players = await Promise.all(
      rows.map(async (row) => {
        const playerData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(row.userID);
        
        // 实时更新精灵统计（从数据库加载）
        const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(row.userID);
        if (petData) {
          playerData.petAllNum = petData.PetList.length;
          if (petData.PetList.length > 0) {
            playerData.petMaxLev = Math.max(...petData.PetList.map(p => p.level));
          } else {
            playerData.petMaxLev = 0;
          }
        }
        
        return {
          // 主要显示字段
          userID: playerData.userID,
          nick: playerData.nick,
          coins: playerData.coins,
          energy: playerData.energy,
          vip: playerData.vip,
          vipLevel: playerData.vipLevel,
          petMaxLev: playerData.petMaxLev,
          petAllNum: playerData.petAllNum,
          regTime: playerData.regTime,
          loginCnt: playerData.loginCnt,
          allocatableExp: playerData.allocatableExp,
          isOnline: onlinePlayerIds.has(row.userID),
          // 所有详细字段
          viped: playerData.viped,
          dsFlag: playerData.dsFlag,
          color: playerData.color,
          texture: playerData.texture,
          fightBadge: playerData.fightBadge,
          mapID: playerData.mapID,
          posX: playerData.posX,
          posY: playerData.posY,
          timeToday: playerData.timeToday,
          timeLimit: playerData.timeLimit,
          inviter: playerData.inviter,
          vipValue: playerData.vipValue,
          vipStage: playerData.vipStage,
          vipEndTime: playerData.vipEndTime,
          teacherID: playerData.teacherID,
          studentID: playerData.studentID,
          graduationCount: playerData.graduationCount,
          monKingWin: playerData.monKingWin,
          messWin: playerData.messWin,
          curStage: playerData.curStage,
          maxStage: playerData.maxStage,
          maxArenaWins: playerData.maxArenaWins,
          hasNono: playerData.hasNono,
          superNono: playerData.superNono,
          nonoNick: playerData.nonoNick,
          nonoColor: playerData.nonoColor,
          nonoPower: playerData.nonoPower,
          nonoMate: playerData.nonoMate
        };
      })
    );
    
    return {
      total,
      page,
      limit,
      players
    };
  }

  /**
   * 获取玩家详情（包含精灵、任务等详细信息）
   */
  public async getPlayerDetail(uid: number): Promise<any> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    // 使用 GetInstanceOrCreateNew 从数据库加载数据
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    const itemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
    const taskData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_TaskData(uid);

    // 实时更新精灵统计
    if (petData) {
      playerData.petAllNum = petData.PetList.length;
      if (petData.PetList.length > 0) {
        playerData.petMaxLev = Math.max(...petData.PetList.map(p => p.level));
      } else {
        playerData.petMaxLev = 0;
      }
    }

    return {
      // 基本信息
      uid: playerData.userID,
      nickname: playerData.nick,
      coins: playerData.coins,
      energy: playerData.energy,
      fightBadge: playerData.fightBadge,
      allocatableExp: playerData.allocatableExp,
      
      // VIP信息
      vip: playerData.vip,
      vipLevel: playerData.vipLevel,
      vipValue: playerData.vipValue,
      vipStage: playerData.vipStage,
      vipEndTime: playerData.vipEndTime,
      
      // 精灵信息
      petMaxLev: playerData.petMaxLev,
      petAllNum: playerData.petAllNum,
      petCount: petData?.PetList.length || 0,
      pets: petData?.PetList.map(pet => {
        // 将技能ID数组转换为技能对象数组（包含PP信息）
        const skillArray = (pet.skillArray || []).map(skillId => {
          if (!skillId) return null;
          
          // 从配置中获取技能信息
          const skillConfig = GameConfig.GetSkillById(skillId);
          const maxPp = skillConfig?.MaxPP || 20; // 默认20PP
          
          return {
            id: skillId,
            pp: maxPp, // 当前PP（GM查看时显示满PP）
            maxPp: maxPp
          };
        }).filter(skill => skill !== null);
        
        return {
          catchTime: pet.catchTime,
          id: pet.petId,
          level: pet.level,
          hp: pet.hp,
          maxHp: pet.maxHp,
          atk: pet.atk,
          def: pet.def,
          spAtk: pet.spAtk,
          spDef: pet.spDef,
          speed: pet.speed,
          evHp: pet.evHp,
          evAtk: pet.evAtk,
          evDef: pet.evDef,
          evSpAtk: pet.evSpAtk,
          evSpDef: pet.evSpDef,
          evSpeed: pet.evSpeed,
          dvHp: pet.dvHp,
          dvAtk: pet.dvAtk,
          dvDef: pet.dvDef,
          dvSpAtk: pet.dvSpAtk,
          dvSpDef: pet.dvSpDef,
          dvSpeed: pet.dvSpeed,
          nature: pet.nature,
          exp: pet.exp,
          skillArray: skillArray
        };
      }) || [],
      
      // 物品信息
      itemCount: itemData?.ItemList.length || 0,
      items: itemData?.ItemList.map(item => ({
        itemId: item.itemId,
        count: item.count,
        expireTime: item.expireTime
      })) || [],
      
      // 任务信息
      taskCount: taskData?.TaskList.size || 0,
      tasks: taskData ? Array.from(taskData.TaskList.values()).map(task => ({
        taskId: task.taskId,
        status: task.status,
        acceptTime: task.acceptTime,
        completeTime: task.completeTime
      })) : [],
      
      // 其他信息
      registerTime: playerData.regTime,
      loginCount: playerData.loginCnt,
      mapId: playerData.mapID,
      posX: playerData.posX,
      posY: playerData.posY,
      color: playerData.color,
      texture: playerData.texture,
      timeToday: playerData.timeToday,
      timeLimit: playerData.timeLimit,
      
      // 师徒信息
      teacherID: playerData.teacherID,
      studentID: playerData.studentID,
      graduationCount: playerData.graduationCount,
      
      // 战斗统计
      monKingWin: playerData.monKingWin,
      messWin: playerData.messWin,
      curStage: playerData.curStage,
      maxStage: playerData.maxStage,
      maxArenaWins: playerData.maxArenaWins,
      
      // NoNo信息
      hasNono: playerData.hasNono,
      superNono: playerData.superNono,
      nonoNick: playerData.nonoNick,
      nonoColor: playerData.nonoColor,
      nonoPower: playerData.nonoPower,
      nonoMate: playerData.nonoMate
    };
  }

  /**
   * 修改玩家数据
   */
  public async updatePlayer(uid: number, field: string, value: any): Promise<void> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    // 根据字段更新数据
    switch (field) {
      case 'coins':
        playerData.coins = value;
        break;
      case 'nick':
        playerData.nick = value;
        break;
      case 'vipLevel':
        playerData.vipLevel = value;
        break;
      case 'vip':
        playerData.vip = value;
        break;
      default:
        throw new Error(`不支持的字段: ${field}`);
    }

    // 自动保存（BaseData）
    Logger.Info(`[PlayerService] 玩家数据已修改: uid=${uid}, field=${field}, value=${value}`);
  }

  /**
   * 封禁/解封玩家
   */
  public async banPlayer(uid: number, banned: boolean, reason?: string): Promise<void> {
    // TODO: 实现封禁逻辑
    // 1. 更新数据库封禁状态
    // 2. 如果玩家在线，踢出游戏
    Logger.Info(`[PlayerService] 玩家${banned ? '封禁' : '解封'}: uid=${uid}, reason=${reason}`);
  }

  /**
   * 踢出玩家
   */
  public async kickPlayer(uid: number, reason?: string): Promise<void> {
    try {
      const { OnlineTracker } = await import('../../GameServer/Game/Player/OnlineTracker');
      
      // 检查玩家是否在线
      if (!OnlineTracker.Instance.IsOnline(uid)) {
        throw new Error('玩家不在线');
      }
      
      // 获取玩家Session
      const session = OnlineTracker.Instance.GetPlayerSession(uid);
      if (!session) {
        throw new Error('无法获取玩家会话');
      }
      
      // 关闭Socket连接
      if (session.Socket && !session.Socket.destroyed) {
        session.Socket.destroy();
        Logger.Info(`[PlayerService] 已关闭玩家Socket连接: uid=${uid}`);
      }
      
      // 尝试从PlayerManager移除玩家实例（如果GameServer已启动）
      try {
        const { PlayerManager } = await import('../../GameServer/Game/Player/PlayerManager');
        
        // 检查PlayerManager是否已初始化（通过检查是否有在线玩家）
        const player = PlayerManager.GetInstance().GetPlayer(uid);
        if (player) {
          await PlayerManager.GetInstance().RemovePlayer(uid);
          Logger.Info(`[PlayerService] 已从PlayerManager移除玩家: uid=${uid}`);
        }
      } catch (pmError) {
        // PlayerManager未初始化或访问失败，仅记录警告
        Logger.Warn(`[PlayerService] 无法访问PlayerManager: ${(pmError as Error).message}`);
      }
      
      Logger.Info(`[PlayerService] 踢出玩家成功: uid=${uid}, reason=${reason || '无'}`);
    } catch (error) {
      Logger.Error(`[PlayerService] 踢出玩家失败: uid=${uid}`, error as Error);
      throw error;
    }
  }
}
