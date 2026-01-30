import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from '../Player/OnlineTracker';
import { GameConfig } from '../../../shared/config';
import { SeerMapUserInfoProto } from '../../../shared/proto/common/SeerMapUserInfoProto';
import { EnterMapReqProto } from '../../../shared/proto/packets/req/map/EnterMapReqProto';
import { ChatReqProto } from '../../../shared/proto/packets/req/map/ChatReqProto';
import { GetSimUserInfoRspProto } from '../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto';
import { GetMoreUserInfoRspProto } from '../../../shared/proto/packets/rsp/map/GetMoreUserInfoRspProto';
import { ChatRspProto } from '../../../shared/proto/packets/rsp/map/ChatRspProto';
import { ListMapPlayerRspProto } from '../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { IPlayerInfo } from '../../../shared/models';
import { PlayerInstance } from '../Player/PlayerInstance';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { MapSpawnManager } from './MapSpawnManager';
import { 
  PacketEnterMap,
  PacketLeaveMap,
  PacketMapOgreList,
  PacketMapBoss,
  PacketChangeNickName,
  PacketChangeColor,
  PacketOnOrOffFlying
} from '../../Server/Packet/Send';

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
    const mapId = req.mapId || 1;
    const mapType = req.mapType;
    const x = req.x || 500;
    const y = req.y || 300;

    Logger.Info(`[MapManager] ========== 玩家 ${this.UserID} 进入地图 ==========`);
    Logger.Info(`[MapManager] MapID: ${mapId}, MapType: ${mapType}, Pos: (${x}, ${y})`);
    Logger.Info(`[MapManager] 玩家昵称: ${this.Player.Data.nick}`);
    Logger.Info(`[MapManager] 当前数据库 MapID: ${this.Player.Data.mapID}`);

    // 更新在线追踪
    this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, mapType);

    // 更新玩家位置（直接修改 PlayerData，实时保存）
    this.Player.Data.mapID = mapId;
    this.Player.Data.posX = x;
    this.Player.Data.posY = y;
    await DatabaseHelper.Instance.SavePlayerData(this.Player.Data);

    Logger.Info(`[MapManager] 已更新玩家位置到地图 ${mapId}`);

    // 通知 MapSpawnManager 玩家进入地图（生成新的野怪列表）
    MapSpawnManager.Instance.OnPlayerEnterMap(this.UserID, mapId);

    // 构建用户信息（使用 PlayerData）
    const userInfo = this.buildUserInfo(this.UserID, this.Player.Data, x, y);

    // 发送进入地图响应
    await this.Player.SendPacket(new PacketEnterMap(userInfo));
    Logger.Info(`[MapManager] 已发送进入地图响应`);

    // 主动推送 LIST_MAP_PLAYER (包含自己)
    await this.sendMapPlayerList(mapId);
    
    // 主动推送 MAP_OGRE_LIST (地图野怪列表)
    await this.sendMapOgreList(mapId);
    
    // 主动推送 MAP_BOSS (地图BOSS列表)
    await this.sendMapBossList(mapId);
    
    Logger.Info(`[MapManager] ========== 进入地图完成 ==========`);
  }

  /**
   * 处理离开地图
   */
  public async HandleLeaveMap(): Promise<void> {
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 离开地图 ${mapId}`);

    // 通知 MapSpawnManager 玩家离开地图（清除状态）
    MapSpawnManager.Instance.OnPlayerLeaveMap(this.UserID);

    // 更新在线追踪（设置为地图0）
    this._onlineTracker.UpdatePlayerMap(this.UserID, 0, 0);

    // 发送离开地图响应
    await this.Player.SendPacket(new PacketLeaveMap(this.UserID));
    
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
    const ogres = MapSpawnManager.Instance.GetMapOgres(this.UserID, mapId);

    await this.Player.SendPacket(new PacketMapOgreList(ogres));
  }

  /**
   * 推送地图BOSS列表（只在有BOSS时推送）
   * @param mapId 地图ID
   */
  private async sendMapBossList(mapId: number): Promise<void> {
    const bosses = MapSpawnManager.Instance.GetMapBosses(this.UserID, mapId);
    
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
   * 处理获取详细用户信息
   */
  public async HandleGetMoreUserInfo(targetId: number): Promise<void> {
    const queryId = targetId || this.UserID;
    const playerData = queryId === this.UserID 
      ? this.Player.Data
      : await this._playerRepo.FindByUserId(queryId);
    if (!playerData) {
      Logger.Warn(`[MapManager] 玩家数据不存在 ${queryId}`);
      return;
    }

    await this.Player.SendPacket(
      new GetMoreUserInfoRspProto()
        .setUserId(queryId)
        .setNick(playerData.nick)
        .setRegTime(playerData.regTime)
        .setPetAllNum(0)
        .setPetMaxLev(100)
        .setBossAchievement('')
        .setGraduationCount(playerData.graduationCount)
        .setMonKingWin(0)
        .setMessWin(0)
        .setMaxStage(0)
        .setMaxArenaWins(0)
        .setCurTitle(playerData.curTitle)
    );
  }

  /**
   * 处理修改昵称
   */
  public async HandleChangeNickName(newNick: string): Promise<void> {
    // 更新 PlayerData（自动保存）
    this.Player.Data.nick = newNick;

    await this.Player.SendPacket(new PacketChangeNickName(this.UserID, newNick));
    Logger.Info(`[MapManager] 玩家 ${this.UserID} 修改昵称为 ${newNick}`);
  }

  /**
   * 处理修改颜色
   */
  public async HandleChangeColor(newColor: number): Promise<void> {
    // 更新 PlayerData（自动保存）
    this.Player.Data.color = newColor;

    await this.Player.SendPacket(new PacketChangeColor(this.UserID, newColor, 0, this.Player.Data.coins));
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
  private async sendMapPlayerList(mapId: number): Promise<void> {
    const playerIds = this._onlineTracker.GetPlayersInMap(mapId);
    const players: SeerMapUserInfoProto[] = [];

    for (const pid of playerIds) {
      const playerSession = this._onlineTracker.GetPlayerSession(pid);
      if (playerSession?.Player) {
        // 从数据库读取玩家数据
        const playerData = await this._playerRepo.FindByUserId(pid);
        if (playerData) {
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

    Logger.Info(`[MapManager] 发送地图 ${mapId} 玩家列表，共 ${players.length} 人`);
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
  private async sendMapOgreList(mapId: number): Promise<void> {
    try {
      // 使用 MapSpawnManager 获取玩家的野怪列表
      const ogres = MapSpawnManager.Instance.GetMapOgres(this.UserID, mapId);
      
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
  private buildUserInfo(
    userId: number,
    playerData: IPlayerInfo,
    x: number,
    y: number
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
    if (playerData.superNono) vipFlags = 3;
    
    userInfo.vipFlags = vipFlags;
    userInfo.vipStage = playerData.vipStage;
    
    // 位置和动�?
    userInfo.actionType = 0;
    userInfo.x = x;
    userInfo.y = y;
    userInfo.action = 0;
    userInfo.direction = 0;
    userInfo.changeShape = 0;
    
    // 精灵信息
    userInfo.spiritTime = 0;
    userInfo.spiritID = 0;
    userInfo.petDV = 31;
    userInfo.petSkin = 0;
    userInfo.fightFlag = 0;
    
    // 师徒信息
    userInfo.teacherID = playerData.teacherID;
    userInfo.studentID = playerData.studentID;
    
    // NoNo信息
    userInfo.nonoState = playerData.nonoState;
    userInfo.nonoColor = playerData.nonoColor;
    userInfo.superNono = playerData.superNono ? 1 : 0;
    userInfo.playerForm = 0;
    userInfo.transTime = 0;
    
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
    userInfo.clothes = playerData.clothes.map(cloth => ({
      id: cloth.id,
      level: cloth.level || 0
    }));
    
    // 称号
    userInfo.curTitle = playerData.curTitle;

    return userInfo;
  }
}
