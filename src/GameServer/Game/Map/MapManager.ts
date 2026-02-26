import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from '../Player/OnlineTracker';
import { GameConfig } from '../../../shared/config';
import { SeerMapUserInfoProto } from '../../../shared/proto/common/SeerMapUserInfoProto';
import { EnterMapReqProto } from '../../../shared/proto/packets/req/map/EnterMapReqProto';
import { GetSimUserInfoRspProto } from '../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto';
import { ListMapPlayerRspProto } from '../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { IPlayerInfo } from '../../../shared/models';
import { PlayerInstance } from '../Player/PlayerInstance';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import {
  PacketEnterMap,
  PacketLeaveMap,
  PacketMapOgreList,
  PacketMapBoss
} from '../../Server/Packet/Send';
import { PacketChangeCloth } from '../../Server/Packet/Send/Item/PacketChangeCloth';
import { BossAbilityConfig } from '../Battle/BossAbility/BossAbilityConfig';
import { GameEventBus } from '../Event/GameEventBus';
import { IPlayerLogoutEvent, PlayerEventType } from '../Event/EventTypes';
import { MapVisibilityService } from './MapVisibilityService';

/**
 * 鍦板浘绠＄悊鍣?
 * 澶勭悊鍦板浘鐩稿叧鐨勬墍鏈夐€昏緫锛氳繘鍏ャ€佺寮€鍦板浘銆佺帺瀹剁Щ鍔ㄣ€佽亰澶╃瓑
 *
 * 閲嶆瀯璇存槑锛?
 * - 浠庡叏灞€鍗曚緥鏀逛负 Player 瀹炰緥 Manager
 * - 缁ф壙 BaseManager 鑾峰緱渚挎嵎鏂规硶
 * - 涓嶅啀闇€瑕佷紶 userId 鍙傛暟
 */
export class MapManager extends BaseManager {
  private _onlineTracker: OnlineTracker;
  private _mapVisibility: MapVisibilityService;
  private _playerRepo: PlayerRepository; // 鐢ㄤ簬鏌ヨ鍏朵粬鐜╁鏁版嵁

  constructor(player: PlayerInstance) {
    super(player);
    this._onlineTracker = OnlineTracker.Instance;
    this._mapVisibility = new MapVisibilityService(this._onlineTracker);
    this._playerRepo = new PlayerRepository(); // 淇濈暀鐢ㄤ簬鏌ヨ鍏朵粬鐜╁
  }
  public RegisterEvents(eventBus: GameEventBus): void {
    // Keep old cleanup order: map leave should happen before battle cleanup.
    eventBus.On<IPlayerLogoutEvent>(PlayerEventType.LOGOUT, this.OnPlayerLogout.bind(this), 10);
  }

  private async OnPlayerLogout(_event: IPlayerLogoutEvent): Promise<void> {
    await this.HandleLeaveMap();
  }

  /**
   * 鏋勫缓鈥滃綋鍓嶇┛鎴粹€濈殑鏈嶈鍒楄〃锛堢敤浜庝汉鐗╂樉绀猴級
   * 浼樺厛浣跨敤 clothIds锛涜嫢缂哄け鍒欏洖閫€鍒?clothes锛堝吋瀹硅€佹暟鎹級銆?   */
  private BuildWornClothes(playerData: any): Array<{ id: number; level: number }> {
    const wornIds = playerData?.clothIds as number[] | undefined;
    if (Array.isArray(wornIds) && wornIds.length > 0) {
      return wornIds
        .map(id => ({ id: Number(id) || 0, level: 0 }))
        .filter(c => c.id > 0);
    }

    const clothes = playerData?.clothes as Array<{ id?: number; level?: number }> | undefined;
    if (Array.isArray(clothes) && clothes.length > 0) {
      return clothes
        .map(cloth => ({
          id: Number(cloth?.id) || 0,
          level: Number(cloth?.level) || 0
        }))
        .filter(c => c.id > 0);
    }

    return [];
  }

  /**
   * 澶勭悊杩涘叆鍦板浘
   */
  public async HandleEnterMap(req: EnterMapReqProto): Promise<void> {
    let mapId = req.mapId || 1;
    const mapType = req.mapType;
    const x = req.x || 500;
    const y = req.y || 300;

    if (mapId === this.UserID) {
      mapId = this.UserID;
      Logger.Debug(`[MapManager] home map request detected, mapId=${mapId}`);
    }

    Logger.Info(`[MapManager] ===== enter map: user=${this.UserID} =====`);
    Logger.Info(`[MapManager] mapId=${mapId}, mapType=${mapType}, pos=(${x}, ${y})`);
    Logger.Info(`[MapManager] nick=${this.Player.Data.nick}`);
    Logger.Info(`[MapManager] current data mapId=${this.Player.Data.mapID}`);

    const existingPlayers = this._onlineTracker.GetPlayersInMap(mapId);
    Logger.Info(`[MapManager] map ${mapId} players before update: ${existingPlayers.length} [${existingPlayers.join(', ')}]`);

    this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, mapType, x, y);

    const updatedPlayers = this._onlineTracker.GetPlayersInMap(mapId);
    Logger.Info(`[MapManager] map ${mapId} players after update: ${updatedPlayers.length} [${updatedPlayers.join(', ')}]`);

    this.Player.Data.mapID = mapId;
    this.Player.Data.posX = x;
    this.Player.Data.posY = y;
    Logger.Debug(`[MapManager] enter map before save clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);
    await DatabaseHelper.Instance.SavePlayerData(this.Player.Data);
    Logger.Debug(`[MapManager] enter map after save clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);

    Logger.Info(`[MapManager] player position synced to map ${mapId}`);

    this.Player.MapSpawnManager.OnEnterMap(mapId);

    Logger.Debug(`[MapManager] HandleEnterMap clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);
    const userInfo = this.buildUserInfo(this.UserID, this.Player.Data, x, y, this.Player);
    const currentWornClothIds = this.BuildWornClothes(this.Player.Data).map(c => c.id);

    await this.Player.SendPacket(new PacketEnterMap(userInfo));
    Logger.Info('[MapManager] enter map response sent');

    if (currentWornClothIds.length > 0) {
      Logger.Debug(`[MapManager] enter map self cloth sync=${JSON.stringify(currentWornClothIds)}`);
      await this.Player.SendPacket(new PacketChangeCloth(this.UserID, currentWornClothIds));
    }

    await this.sendMapPlayerList(mapId);
    await this.sendMapOgreList(mapId);
    await this.sendMapBossList(mapId);

    if (mapId === 32 && this.IsLeiyiWeather()) {
      Logger.Info(`[MapManager] map 32 weather boss refresh triggered, minute=${new Date().getMinutes()}`);
      await this.Player.SendPacket(new PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
      await this.Player.SendPacket(new PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
    }

    const gaiyaMapId = this.GetGaiyaMapIDForToday();
    if (mapId === gaiyaMapId) {
      Logger.Info(`[MapManager] today gaiya map id=${mapId}`);
      // TODO: special pet note integration.
    }

    const enterPacket = new PacketEnterMap(userInfo);
    const sent = await this._mapVisibility.BroadcastToMap(mapId, enterPacket, {
      excludeUserId: this.UserID
    });

    if (sent > 0) {
      Logger.Info(`[MapManager] broadcast enter map to ${sent} players`);

      const clothIds = (this.Player.Data as any).clothIds as number[] | undefined;
      if (Array.isArray(clothIds) && clothIds.length > 0) {
        await this._mapVisibility.BroadcastToMap(
          mapId,
          new PacketChangeCloth(this.UserID, clothIds),
          { excludeUserId: this.UserID }
        );
      }
    } else {
      Logger.Info('[MapManager] no other players in map, skip enter broadcast');
    }

    const refreshed = await this._mapVisibility.RefreshMapPlayerLists(mapId, {
      excludeUserId: this.UserID
    });
    Logger.Debug(`[MapManager] enter map refresh player list: mapId=${mapId}, refreshed=${refreshed}`);

    Logger.Info('[MapManager] ===== enter map done =====');
  }
  public async HandleLeaveMap(): Promise<void> {
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    Logger.Info(`[MapManager] 鐜╁ ${this.UserID} 绂诲紑鍦板浘 ${mapId}`);

    // 骞挎挱鐜╁绂诲紑娑堟伅缁欏悓鍦板浘鍏朵粬鐜╁
    if (mapId > 0) {
      const leavePacket = new PacketLeaveMap(this.UserID);
      const sent = await this._mapVisibility.BroadcastToMap(mapId, leavePacket, {
        excludeUserId: this.UserID
      });
      if (sent > 0) {
        Logger.Info(`[MapManager] broadcast leave map to ${sent} players`);
      }
    }

    // 閫氱煡 MapSpawnManager 鐜╁绂诲紑鍦板浘锛堟竻闄ょ姸鎬侊級
    this.Player.MapSpawnManager.OnLeaveMap();

    // 鏇存柊鍦ㄧ嚎杩借釜锛堣缃负鍦板浘0锛?
    this._onlineTracker.UpdatePlayerMap(this.UserID, 0, 0);

    // 鍙戦€佺寮€鍦板浘鍝嶅簲缁欒嚜宸?
    await this.Player.SendPacket(new PacketLeaveMap(this.UserID));

    // 缁欎粛鍦ㄨ鍦板浘鐨勭帺瀹舵帹閫佹渶鏂扮帺瀹跺垪琛紙閬垮厤瀹㈡埛绔畫鐣欏満鏅璞★級
    if (mapId > 0) {
      const refreshed = await this._mapVisibility.RefreshMapPlayerLists(mapId);
      Logger.Debug(`[MapManager] LeaveMap refresh map player list: mapId=${mapId}, refreshed=${refreshed}`);
    }

    // 娉ㄦ剰锛氫笉闇€瑕佸彂閫佺┖鐨勯噹鎬垪琛?
    // 瀹㈡埛绔細鍦?MAP_SWITCH_OPEN 鎴?MAP_DESTROY 浜嬩欢鏃惰嚜鍔ㄦ竻鐞嗛噹鎬?
  }

  /**
   * 澶勭悊鍦板浘鐜╁鍒楄〃璇锋眰
   */
  public async HandleListMapPlayer(): Promise<void> {
    const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
    await this.sendMapPlayerList(mapId);
  }

  /**
   * 澶勭悊鍦板浘鎬墿鍒楄〃
   */
  public async HandleMapOgreList(): Promise<void> {
    const mapId = this.Player.Data.mapID || 1;

    // 浣跨敤 MapSpawnManager 鑾峰彇鐜╁鐨勯噹鎬垪琛?
    const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

    await this.Player.SendPacket(new PacketMapOgreList(ogres));
  }

  /**
   * 鎺ㄩ€佸湴鍥綛OSS鍒楄〃锛堝彧鍦ㄦ湁BOSS鏃舵帹閫侊級
   * @param mapId 鍦板浘ID
   */
  public async sendMapBossList(mapId: number): Promise<void> {
    const bosses = this.Player.MapSpawnManager.GetMapBosses(mapId);

    // 鍙湪鏈塀OSS鏃舵墠鎺ㄩ€?
    if (bosses.length > 0) {
      await this.Player.SendPacket(new PacketMapBoss(bosses));
      Logger.Info(`[MapManager] 鎺ㄩ€丅OSS鍒楄〃: mapId=${mapId}, count=${bosses.length}`);
    } else {
      Logger.Debug(`[MapManager] 鍦板浘鏃燘OSS锛岃烦杩囨帹閫? mapId=${mapId}`);
    }
  }

  /**
   * 澶勭悊鑾峰彇绠€鍗曠敤鎴蜂俊鎭?
   */
  public async HandleGetSimUserInfo(targetId: number): Promise<void> {
    // 濡傛灉娌℃湁鎸囧畾鐩爣锛岄粯璁ゆ煡璇㈣嚜宸?
    const queryId = targetId || this.UserID;
    const playerData = queryId === this.UserID
      ? this.Player.Data
      : await this._playerRepo.FindByUserId(queryId);
    if (!playerData) {
      Logger.Warn(`[MapManager] 鐜╁鏁版嵁涓嶅瓨鍦?${queryId}`);
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
        .setClothes(this.BuildWornClothes(playerData))
    );
  }

  /**
   * 澶勭悊淇敼鏄电О
   */
  public async sendMapPlayerList(mapId: number): Promise<void> {
    const playerIds = this._onlineTracker.GetPlayersInMap(mapId);
    const players: SeerMapUserInfoProto[] = [];

    Logger.Debug(`[MapManager] build map player list: mapId=${mapId}, online=[${playerIds.join(', ')}]`);

    for (const pid of playerIds) {
      const playerSession = this._onlineTracker.GetPlayerSession(pid);
      if (playerSession?.Player) {
        const playerData = playerSession.Player.Data;
        const position = this._onlineTracker.GetPlayerPosition(pid);
        const x = position ? position.x : playerData.posX;
        const y = position ? position.y : playerData.posY;

        const userInfo = this.buildUserInfo(pid, playerData, x, y, playerSession.Player);
        players.push(userInfo);
        Logger.Debug(`[MapManager] add online player to list: id=${pid}, nick=${playerData.nick}, pos=(${x}, ${y})`);
      } else {
        Logger.Warn(`[MapManager] player ${pid} found in map list but no online session, fallback to repository`);
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

    Logger.Info(`[MapManager] map player list sent: mapId=${mapId}, user=${this.UserID}, count=${players.length}`);
  }
  public async sendMapOgreList(mapId: number): Promise<void> {
    try {
      const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
      const activeOgres = ogres.filter(o => o.petId > 0);

      if (activeOgres.length > 0) {
        await this.Player.SendPacket(new PacketMapOgreList(ogres));
        Logger.Info(`[MapManager] map ogre list sent: mapId=${mapId}, count=${activeOgres.length}`);
      } else {
        Logger.Debug(`[MapManager] map has no active ogres, skip: mapId=${mapId}`);
      }

    } catch (error) {
      Logger.Error('[MapManager] failed to send map ogre list', error as Error);
    }
  }
  public buildUserInfo(
    userId: number,
    playerData: IPlayerInfo,
    x: number,
    y: number,
    playerInstance?: PlayerInstance
  ): SeerMapUserInfoProto {
    const userInfo = new SeerMapUserInfoProto();

    // 鍩烘湰淇℃伅
    userInfo.sysTime = Math.floor(Date.now() / 1000);
    userInfo.userID = userId;
    userInfo.nick = playerData.nick;
    userInfo.color = playerData.color;
    userInfo.texture = playerData.texture;

    // VIP淇℃伅
    let vipFlags = 0;
    if (playerData.vip === 1) vipFlags |= 1;
    if (playerData.viped === 1) vipFlags |= 2;
    if (playerData.superNono) vipFlags |= 4;

    userInfo.vipFlags = vipFlags;
    userInfo.vipStage = playerData.vipStage;

    // 浣嶇疆鍜屽姩浣?
    userInfo.actionType = playerData.actionType || 0;
    userInfo.x = x;
    userInfo.y = y;
    userInfo.action = playerData.action || 0;
    userInfo.direction = playerData.direction || 0;
    userInfo.changeShape = playerData.changeShape || 0;

    // 绮剧伒淇℃伅 - 浠庢纭殑鐜╁绮剧伒鏁版嵁鑾峰彇
    let defaultPet = null;
    if (playerInstance?.PetManager) {
      defaultPet = playerInstance.PetManager.GetDefaultPet();
    }
    userInfo.spiritTime = defaultPet?.catchTime || 0;
    userInfo.spiritID = defaultPet?.petId || 0;
    userInfo.petDV = defaultPet?.dvHp || 31;
    userInfo.petSkin = defaultPet?.skinId || 0;
    userInfo.fightFlag = playerData.fightFlag || 0;

    // 甯堝緬淇℃伅
    userInfo.teacherID = playerData.teacherID;
    userInfo.studentID = playerData.studentID;

    // NoNo淇℃伅
    userInfo.nonoState = playerData.nonoState;
    userInfo.nonoColor = playerData.nonoColor;
    userInfo.superNono = playerData.superNono ? 1 : 0;
    userInfo.playerForm = playerData.playerForm ? 1 : 0;
    userInfo.transTime = playerData.transTime || 0;

    // 鎴橀槦淇℃伅
    userInfo.teamId = playerData.teamInfo.id;
    userInfo.teamCoreCount = playerData.teamInfo.coreCount;
    userInfo.teamIsShow = playerData.teamInfo.isShow ? 1 : 0;
    userInfo.teamLogoBg = playerData.teamInfo.logoBg;
    userInfo.teamLogoIcon = playerData.teamInfo.logoIcon;
    userInfo.teamLogoColor = playerData.teamInfo.logoColor;
    userInfo.teamTxtColor = playerData.teamInfo.txtColor;
    userInfo.teamLogoWord = playerData.teamInfo.logoWord;

    // 鏈嶈鍒楄〃
    const wornClothIds = (playerData as any).clothIds as number[] | undefined;
    Logger.Debug(`[MapManager] buildUserInfo clothIds: ${JSON.stringify(wornClothIds)}`);
    userInfo.clothes = this.BuildWornClothes(playerData);

    // 绉板彿
    userInfo.curTitle = playerData.curTitle;

    return userInfo;
  }

  /**
   * 鏄惁澶勪簬"闆烽洦澶?锛堣但灏斿崱鏄熼浄浼婂嚭鍦烘潯浠讹級
   * 鐢ㄦ椂闂存ā鎷燂細姣忓皬鏃剁殑 20~40 鍒嗛挓涓洪浄闆ㄥぉ
   */
  private IsLeiyiWeather(): boolean {
    const m = new Date().getMinutes();
    return m >= 20 && m < 40;
  }

  /**
   * 浠婃棩鐩栦簹鍑虹幇鐨勫湴鍥?ID
   * 浣跨敤 BossAbilityConfig 涓殑鍛ㄥ嚑鍑虹幇瑙勫垯
   */
  private GetGaiyaMapIDForToday(): number {
    const weekday = new Date().getDay(); // 0=鍛ㄦ棩, 1=鍛ㄤ竴, ..., 6=鍛ㄥ叚
    const rule = BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(261, weekday); // 261 = 鐩栦簹
    return rule?.mapId || 15;
  }
}
