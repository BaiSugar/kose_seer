import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from '../Player/OnlineTracker';
import { GameConfig } from '../../../shared/config';
import { SeerMapUserInfoProto } from '../../../shared/proto/common/SeerMapUserInfoProto';
import { EnterMapReqProto } from '../../../shared/proto/packets/req/map/EnterMapReqProto';
import { ChatReqProto } from '../../../shared/proto/packets/req/map/ChatReqProto';
import { GetSimUserInfoRspProto } from '../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto';
import { ChatRspProto } from '../../../shared/proto/packets/rsp/map/ChatRspProto';
import { ListMapPlayerRspProto } from '../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { IPlayerInfo } from '../../../shared/models';
import { PlayerInstance } from '../Player/PlayerInstance';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { 
  PacketEnterMap,
  PacketLeaveMap,
  PacketMapOgreList,
  PacketMapBoss,
  PacketChangeNickName,
  PacketChangeColor,
  PacketOnOrOffFlying
} from '../../Server/Packet/Send';
import { PacketChangeCloth } from '../../Server/Packet/Send/Item/PacketChangeCloth';
import { BossAbilityConfig } from '../Battle/BossAbility/BossAbilityConfig';

/**
 * 地图管理器
 * 处理地图相关的所有逻辑：进入、离开地图、玩家移动、聊天等
 * 
 * 重构说明�?
 * - 从全局单例改为 Player 实例 Manager
 * - 继承 BaseManager 获得便捷方法
 * - 不再需要传�?userId 参数
 */
export class MapManager extends BaseManager {
  private _onlineTracker: OnlineTracker;
  private _playerRepo: PlayerRepository; // 用于查询其他玩家数据

  constructor(player: PlayerInstance) {
    super(player);
    this._onlineTracker = OnlineTracker.Instance;
    this._playerRepo = new PlayerRepository(); // 保留用于查询其他玩家
  }

  /**
   * 处理进入地图
   */
  public async HandleEnterMap(req: EnterMapReqProto): Promise<void> {
    let mapId = req.mapId || 1;
    const mapType = req.mapType;
    const x = req.x || 500;
    const y = req.y || 300;

    // 特殊处理：如果 mapId == userId，说明是访问家园
    if (mapId === this.UserID) {
      mapId = this.UserID;
      Logger.Debug(`[MapManager] 检测到家园访问请求 (mapId == userId)，转换为家园地图ID: ${mapId}`);
    }

    Logger.Info(`[MapManager] ========== 玩家 ${this.UserID} 进入地图 ==========`);
    Logger.Info(`[MapManager] MapID: ${mapId}, MapType: ${mapType}, Pos: (${x}, ${y})`);
    Logger.Info(`[MapManager] 玩家昵称: ${this.Player.Data.nick}`);
    Logger.Info(`[MapManager] 当前数据库 MapID: ${this.Player.Data.mapID}`);

    // 检查地图中已有的玩家
    const existingPlayers = this._onlineTracker.GetPlayersInMap(mapId);
    Logger.Info(`[MapManager] 地图 ${mapId} 当前已有玩家: ${existingPlayers.length}人 [${existingPlayers.join(', ')}]`);

    // 更新在线追踪（包括位置）
    this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, mapType, x, y);

    // 再次检查更新后的玩家列表
    const updatedPlayers = this._onlineTracker.GetPlayersInMap(mapId);
    Logger.Info(`[MapManager] 更新后地图 ${mapId} 玩家: ${updatedPlayers.length}人 [${updatedPlayers.join(', ')}]`);

    // 更新玩家位置（直接修改 PlayerData，实时保存）
    this.Player.Data.mapID = mapId;
    this.Player.Data.posX = x;
    this.Player.Data.posY = y;
    Logger.Debug(`[MapManager] 进图前 clothIds: ${JSON.stringify(this.Player.Data.clothIds)}`);
    await DatabaseHelper.Instance.SavePlayerData(this.Player.Data);
    Logger.Debug(`[MapManager] 进图后 clothIds: ${JSON.stringify(this.Player.Data.clothIds)}`);

    Logger.Info(`[MapManager] 已更新玩家位置到地图 ${mapId}`);

    // 通知 MapSpawnManager 玩家进入地图（生成新的野怪列表）
    this.Player.MapSpawnManager.OnEnterMap(mapId);

    // 构建用户信息（使用 PlayerData）
    Logger.Debug(`[MapManager] HandleEnterMap clothIds: ${JSON.stringify(this.Player.Data.clothIds)}`);
    const userInfo = this.buildUserInfo(this.UserID, this.Player.Data, x, y, this.Player);

    // 发送进入地图响应
    await this.Player.SendPacket(new PacketEnterMap(userInfo));
    Logger.Info(`[MapManager] 已发送进入地图响应`);

    // 主动推送 LIST_MAP_PLAYER (包含自己和其他玩家)
    await this.sendMapPlayerList(mapId);
    
    // 主动推送 MAP_OGRE_LIST (地图野怪列表)
    await this.sendMapOgreList(mapId);
    
    // 主动推送 MAP_BOSS (地图BOSS列表)
    await this.sendMapBossList(mapId);
    
    // 特殊地图事件：赫尔卡星荒地(32) 雷雨天推送 2021 触发雷伊出场动画
    if (mapId === 32 && this.IsLeiyiWeather()) {
      Logger.Info(`[MapManager] 雷雨天，将刷新雷伊 (当前分钟=${new Date().getMinutes()})`);
      // 发送两次，第二次客户端 BOSS 已存在会调用 show() 播放出场动画
      await this.Player.SendPacket(new PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
      await this.Player.SendPacket(new PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
    }
    
    // 特殊地图事件：盖亚按周几出现在三张地图之一，推送 2022 显示盖亚
    const gaiyaMapId = this.GetGaiyaMapIDForToday();
    if (mapId === gaiyaMapId) {
      Logger.Info(`[MapManager] 今日盖亚地图: ${mapId}`);
      // TODO: 推送 2022 (SPECIAL_PET_NOTE) 显示盖亚
    }
    
    // 广播新玩家进入消息给同地图其他玩家
    const enterPacket = new PacketEnterMap(userInfo);
    const sent = await this._onlineTracker.BroadcastToMap(mapId, enterPacket, this.UserID);
    if (sent > 0) {
      Logger.Info(`[MapManager] 广播玩家进入到 ${sent} 个玩家`);

      // 同步穿戴服装给同地图其他玩家（避免在 ENTER_MAP 之前广播导致对方未创建角色）
      const clothIds = (this.Player.Data as any).clothIds as number[] | undefined;
      if (Array.isArray(clothIds)) {
        await this._onlineTracker.BroadcastToMap(
          mapId,
          new PacketChangeCloth(this.UserID, clothIds),
          this.UserID
        );
      }
      
      // 给老玩家发送更新后的地图玩家列表
      const sessions = this._onlineTracker.GetClientsOnMap(mapId);
      for (const session of sessions) {
        if (session.UserID === this.UserID) continue;
        if (session.Player) {
          await session.Player.MapManager.sendMapPlayerList(mapId);
        }
      }
    } else {
      Logger.Info(`[MapManager] 地图中没有其他玩家，无需广播`);
    }
    
    Logger.Info(`[MapManager] ========== 进入地图完成 ==========`);
  }

  /**
   * 处理离开地图
   */
  public async HandleLeaveMap(): Promise<void> {
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 离开地图 ${mapId}`);

    // 广播玩家离开消息给同地图其他玩家
    if (mapId > 0) {
      const leavePacket = new PacketLeaveMap(this.UserID);
      const sent = await this._onlineTracker.BroadcastToMap(mapId, leavePacket, this.UserID);
      if (sent > 0) {
        Logger.Info(`[MapManager] 广播玩家离开到 ${sent} 个玩家`);
      }
    }

    // 通知 MapSpawnManager 玩家离开地图（清除状态）
    this.Player.MapSpawnManager.OnLeaveMap();

    // 更新在线追踪（设置为地图0）
    this._onlineTracker.UpdatePlayerMap(this.UserID, 0, 0);

    // 发送离开地图响应给自己
    await this.Player.SendPacket(new PacketLeaveMap(this.UserID));

    // 给仍在该地图的玩家推送最新玩家列表（避免客户端残留场景对象）
    if (mapId > 0) {
      const sessions = this._onlineTracker.GetClientsOnMap(mapId);
      for (const session of sessions) {
        if (session.Player) {
          await session.Player.MapManager.sendMapPlayerList(mapId);
        }
      }
    }
    
    // 注意：不需要发送空的野怪列表
    // 客户端会在 MAP_SWITCH_OPEN 或 MAP_DESTROY 事件时自动清理野怪
  }

  /**
   * 处理地图玩家列表请求
   */
  public async HandleListMapPlayer(): Promise<void> {
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    await this.sendMapPlayerList(mapId);
  }

  /**
   * 处理地图怪物列表
   */
  public async HandleMapOgreList(): Promise<void> {
    const mapId = this.Player.Data.mapID || 1;

    // 使用 MapSpawnManager 获取玩家的野怪列表
    const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

    await this.Player.SendPacket(new PacketMapOgreList(ogres));
  }

  /**
   * 推送地图BOSS列表（只在有BOSS时推送）
   * @param mapId 地图ID
   */
  public async sendMapBossList(mapId: number): Promise<void> {
    const bosses = this.Player.MapSpawnManager.GetMapBosses(mapId);
    
    // 只在有BOSS时才推送
    if (bosses.length > 0) {
      await this.Player.SendPacket(new PacketMapBoss(bosses));
      Logger.Info(`[MapManager] 推送BOSS列表: mapId=${mapId}, count=${bosses.length}`);
    } else {
      Logger.Debug(`[MapManager] 地图无BOSS，跳过推送: mapId=${mapId}`);
    }
  }

  /**
   * 处理获取简单用户信息
   */
  public async HandleGetSimUserInfo(targetId: number): Promise<void> {
    // 如果没有指定目标，默认查询自己
    const queryId = targetId || this.UserID;
    const playerData = queryId === this.UserID 
      ? this.Player.Data
      : await this._playerRepo.FindByUserId(queryId);
    if (!playerData) {
      Logger.Warn(`[MapManager] 玩家数据不存在 ${queryId}`);
      return;
    }

    await this.Player.SendPacket(
      new GetSimUserInfoRspProto()
        .setUserId(queryId)
        .setNick(playerData.nick)
        .setColor(playerData.color)
        .setTexture(playerData.texture)
        .setVip(playerData.vip)
        .setStatus(0)
        .setMapType(this._onlineTracker.GetPlayerMap(queryId) > 0 ? 1 : 0)
        .setMapId(playerData.mapID)
        .setIsCanBeTeacher(0)
        .setTeacherID(playerData.teacherID)
        .setStudentID(playerData.studentID)
        .setGraduationCount(playerData.graduationCount)
        .setVipLevel(playerData.vipStage)
        .setTeamId(playerData.teamInfo.id)
        .setTeamIsShow(playerData.teamInfo.isShow ? 1 : 0)
        .setClothes(playerData.clothes.map((c: any) => ({ id: c.id, level: c.level || 0 })))
    );
  }

  /**
   * 处理修改昵称
   */
  public async HandleChangeNickName(newNick: string): Promise<void> {
    // 更新 PlayerData（自动保存）
    this.Player.Data.nick = newNick;

    const packet = new PacketChangeNickName(this.UserID, newNick);
    
    // 发送给自己
    await this.Player.SendPacket(packet);
    
    // 广播给同地图其他玩家
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      await this._onlineTracker.BroadcastToMap(mapId, packet, this.UserID);
    }
    
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 修改昵称为 ${newNick}`);
  }

  /**
   * 处理修改颜色
   */
  public async HandleChangeColor(newColor: number): Promise<void> {
    // 更新 PlayerData（自动保存）
    this.Player.Data.color = newColor;

    const packet = new PacketChangeColor(this.UserID, newColor, 0, this.Player.Data.coins);
    
    // 发送给自己
    await this.Player.SendPacket(packet);
    
    // 广播给同地图其他玩家
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      await this._onlineTracker.BroadcastToMap(mapId, packet, this.UserID);
    }
    
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 修改颜色为 0x${newColor.toString(16)}`);
  }

  /**
   * 处理开关飞行模式
   */
  public async HandleOnOrOffFlying(flyMode: number): Promise<void> {
    // 更新 PlayerData (假设有 flyMode 字段)
    // this.Player.Data.flyMode = flyMode;

    // 广播给同地图玩家
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    const packet = new PacketOnOrOffFlying(this.UserID, flyMode);
    
    if (mapId > 0) {
      await this._onlineTracker.BroadcastToMap(mapId, packet);
    } else {
      await this.Player.SendPacket(packet);
    }

    Logger.Info(`[MapManager] 玩家 ${this.UserID} ${flyMode > 0 ? '开启' : '关闭'}飞行模式`);
  }

  /**
   * 处理聊天
   */
  public async HandleChat(req: ChatReqProto): Promise<void> {
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 聊天: ${req.msg}`);

    // 构建响应
    const rsp = new ChatRspProto()
      .setSenderId(this.UserID)
      .setSenderNick(this.Player.Data.nick)
      .setToId(0)
      .setMsg(req.msg);

    // 广播给同地图的所有玩家
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      await this._onlineTracker.BroadcastToMap(mapId, rsp);
    } else {
      await this.Player.SendPacket(rsp);
    }
  }

  /**
   * 发送地图玩家列表
   */
  public async sendMapPlayerList(mapId: number): Promise<void> {
    const playerIds = this._onlineTracker.GetPlayersInMap(mapId);
    const players: SeerMapUserInfoProto[] = [];

    Logger.Debug(`[MapManager] 构建地图 ${mapId} 玩家列表，在线玩家: ${playerIds.join(', ')}`);

    for (const pid of playerIds) {
      const playerSession = this._onlineTracker.GetPlayerSession(pid);
      if (playerSession?.Player) {
        // 优先从在线玩家的 PlayerData 读取（实时数据）
        const playerData = playerSession.Player.Data;
        
        // 使用 OnlineTracker 中的实时位置，而不是数据库中的旧位置
        const position = this._onlineTracker.GetPlayerPosition(pid);
        const x = position ? position.x : playerData.posX;
        const y = position ? position.y : playerData.posY;
        
        const userInfo = this.buildUserInfo(pid, playerData, x, y, playerSession.Player);
        players.push(userInfo);
        Logger.Debug(`[MapManager] 添加玩家到列表: ${pid} (${playerData.nick}) 位置: (${x}, ${y})`);
      } else {
        // 如果玩家不在线（理论上不应该发生），从数据库读取
        Logger.Warn(`[MapManager] 玩家 ${pid} 在地图列表中但未找到在线会话，从数据库读取`);
        const playerData = await this._playerRepo.FindByUserId(pid);
        if (playerData) {
          // 离线玩家使用数据库位置
          const userInfo = this.buildUserInfo(
            pid,
            playerData,
            playerData.posX,
            playerData.posY
          );
          players.push(userInfo);
        }
      }
    }

    const rsp = new ListMapPlayerRspProto();
    rsp.players = players;

    await this.Player.SendPacket(rsp);

    Logger.Info(`[MapManager] 发送地图 ${mapId} 玩家列表给玩家 ${this.UserID}，共 ${players.length} 人`);
  }

  /**
   * 发送地图野怪列表（公开方法，供外部调用）
   */
  public async SendMapOgreList(mapId: number): Promise<void> {
    await this.sendMapOgreList(mapId);
  }

  /**
   * 发送地图野怪列表（内部方法）
   */
  public async sendMapOgreList(mapId: number): Promise<void> {
    try {
      // 使用 MapSpawnManager 获取玩家的野怪列表
      const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
      
      const activeOgres = ogres.filter(o => o.petId > 0);
      
      // 只在有野怪时才推送
      if (activeOgres.length > 0) {
        await this.Player.SendPacket(new PacketMapOgreList(ogres));
        Logger.Info(`[MapManager] 推送野怪列表: mapId=${mapId}, count=${activeOgres.length}`);
      } else {
        Logger.Debug(`[MapManager] 地图无野怪，跳过推送: mapId=${mapId}`);
      }
      
    } catch (error) {
      Logger.Error(`[MapManager] ❌ 发送野怪列表失败`, error as Error);
    }
  }

  /**
   * 构建用户信息（从数据库数据）
   */
  public buildUserInfo(
    userId: number,
    playerData: IPlayerInfo,
    x: number,
    y: number,
    playerInstance?: PlayerInstance
  ): SeerMapUserInfoProto {
    const userInfo = new SeerMapUserInfoProto();
    
    // 基本信息
    userInfo.sysTime = Math.floor(Date.now() / 1000);
    userInfo.userID = userId;
    userInfo.nick = playerData.nick;
    userInfo.color = playerData.color;
    userInfo.texture = playerData.texture;
    
    // VIP信息
    let vipFlags = 0;
    if (playerData.vip === 1) vipFlags |= 1;
    if (playerData.viped === 1) vipFlags |= 2;
    if (playerData.superNono) vipFlags |= 4;
    
    userInfo.vipFlags = vipFlags;
    userInfo.vipStage = playerData.vipStage;
    
    // 位置和动作
    userInfo.actionType = playerData.actionType || 0;
    userInfo.x = x;
    userInfo.y = y;
    userInfo.action = playerData.action || 0;
    userInfo.direction = playerData.direction || 0;
    userInfo.changeShape = playerData.changeShape || 0;
    
    // 精灵信息 - 从正确的玩家精灵数据获取
    let defaultPet = null;
    if (playerInstance?.PetManager?.PetData) {
      defaultPet = playerInstance.PetManager.PetData.PetList.find(p => p.isDefault);
    }
    userInfo.spiritTime = defaultPet?.catchTime || 0;
    userInfo.spiritID = defaultPet?.petId || 0;
    userInfo.petDV = defaultPet?.dvHp || 31;
    userInfo.petSkin = defaultPet?.skinId || 0;
    userInfo.fightFlag = playerData.fightFlag || 0;
    
    // 师徒信息
    userInfo.teacherID = playerData.teacherID;
    userInfo.studentID = playerData.studentID;
    
    // NoNo信息
    userInfo.nonoState = playerData.nonoState;
    userInfo.nonoColor = playerData.nonoColor;
    userInfo.superNono = playerData.superNono ? 1 : 0;
    userInfo.playerForm = playerData.playerForm ? 1 : 0;
    userInfo.transTime = playerData.transTime || 0;
    
    // 战队信息
    userInfo.teamId = playerData.teamInfo.id;
    userInfo.teamCoreCount = playerData.teamInfo.coreCount;
    userInfo.teamIsShow = playerData.teamInfo.isShow ? 1 : 0;
    userInfo.teamLogoBg = playerData.teamInfo.logoBg;
    userInfo.teamLogoIcon = playerData.teamInfo.logoIcon;
    userInfo.teamLogoColor = playerData.teamInfo.logoColor;
    userInfo.teamTxtColor = playerData.teamInfo.txtColor;
    userInfo.teamLogoWord = playerData.teamInfo.logoWord;
    
    // 服装列表
    const wornClothIds = (playerData as any).clothIds as number[] | undefined;
    Logger.Debug(`[MapManager] buildUserInfo clothIds: ${JSON.stringify(wornClothIds)}`);
    if (Array.isArray(wornClothIds) && wornClothIds.length > 0) {
      userInfo.clothes = wornClothIds.map((id) => ({ id, level: 0 }));
    } else {
      userInfo.clothes = (playerData.clothes || []).map((cloth: any) => ({
        id: Number(cloth.id) || 0,
        level: Number(cloth.level) || 0
      }));
    }
    
    // 称号
    userInfo.curTitle = playerData.curTitle;

    return userInfo;
  }

  /**
   * 是否处于"雷雨天"（赫尔卡星雷伊出场条件）
   * 用时间模拟：每小时的 20~40 分钟为雷雨天
   */
  private IsLeiyiWeather(): boolean {
    const m = new Date().getMinutes();
    return m >= 20 && m < 40;
  }

  /**
   * 今日盖亚出现的地图 ID
   * 使用 BossAbilityConfig 中的周几出现规则
   */
  private GetGaiyaMapIDForToday(): number {
    const weekday = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
    const rule = BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(261, weekday); // 261 = 盖亚
    return rule?.mapId || 15;
  }
}
