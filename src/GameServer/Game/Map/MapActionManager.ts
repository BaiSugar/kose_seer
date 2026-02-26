import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from '../Player/OnlineTracker';
import { PacketMapOgreList } from '../../Server/Packet/Send/Map/PacketMapOgreList';
import { PeopleWalkReqProto } from '../../../shared/proto/packets/req/map/PeopleWalkReqProto';
import { PeopleWalkRspProto } from '../../../shared/proto/packets/rsp/map/PeopleWalkRspProto';
import { DanceActionReqProto } from '../../../shared/proto/packets/req/map/DanceActionReqProto';
import { DanceActionRspProto } from '../../../shared/proto/packets/rsp/map/DanceActionRspProto';
import { PeopleTransformReqProto } from '../../../shared/proto/packets/req/map/PeopleTransformReqProto';
import { PeopleTransformRspProto } from '../../../shared/proto/packets/rsp/map/PeopleTransformRspProto';
import { AimatReqProto } from '../../../shared/proto/packets/req/map/AimatReqProto';
import { AimatRspProto } from '../../../shared/proto/packets/rsp/map/AimatRspProto';
import { ChatReqProto } from '../../../shared/proto/packets/req/map/ChatReqProto';
import { ChatRspProto } from '../../../shared/proto/packets/rsp/map/ChatRspProto';
import { PacketChangeColor } from '../../Server/Packet/Send/Map/PacketChangeColor';
import { PacketChangeNickName } from '../../Server/Packet/Send/Map/PacketChangeNickName';
import { PacketOnOrOffFlying } from '../../Server/Packet/Send/Map/PacketOnOrOffFlying';
import { PlayerInstance } from '../Player/PlayerInstance';
import {
  IMapAimatEvent,
  IMapChatEvent,
  IMapChangeColorEvent,
  IMapChangeNicknameEvent,
  IMapDanceActionEvent,
  IMapOnOrOffFlyingEvent,
  IMapPeopleTransformEvent,
  IMapPeopleWalkEvent,
} from './MapEventTypes';
import { MapEventType } from '../Event';

/**
 * Handles high-frequency map actions (state + self response).
 * Broadcast to other players is handled by MapBroadcastManager via events.
 */
export class MapActionManager extends BaseManager {
  private _onlineTracker: OnlineTracker;

  constructor(player: PlayerInstance) {
    super(player);
    this._onlineTracker = OnlineTracker.Instance;
  }

  public async HandlePeopleWalk(req: PeopleWalkReqProto): Promise<void> {
    const mapId = this.Player.Data.mapID;
    const oldX = this.Player.Data.posX;
    const oldY = this.Player.Data.posY;

    this.Player.Data.posX = req.x;
    this.Player.Data.posY = req.y;

    if (mapId > 0) {
      this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, 0, req.x, req.y);
    }

    const rsp = new PeopleWalkRspProto(req.walkType, this.UserID, req.x, req.y, req.amfData);
    await this.Player.SendPacket(rsp);

    if (mapId > 0) {
      const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
      await this.Player.SendPacket(new PacketMapOgreList(ogres));
      Logger.Debug(
        `[MapActionManager] walk userId=${this.UserID}, pos=(${oldX},${oldY})->(${req.x},${req.y}), mapId=${mapId}`
      );
    }

    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.PEOPLE_WALK,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet: rsp,
      } as IMapPeopleWalkEvent);
    }
  }

  public async HandleDanceAction(req: DanceActionReqProto): Promise<void> {
    const mapId = this.Player.Data.mapID;
    const rsp = new DanceActionRspProto(this.UserID, req.actionId, req.actionType);

    await this.Player.SendPacket(rsp);

    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.DANCE_ACTION,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet: rsp,
      } as IMapDanceActionEvent);
    }
  }

  public async HandlePeopleTransform(req: PeopleTransformReqProto): Promise<void> {
    const mapId = this.Player.Data.mapID;
    const rsp = new PeopleTransformRspProto(this.UserID, req.transId);

    await this.Player.SendPacket(rsp);

    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.PEOPLE_TRANSFORM,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet: rsp,
      } as IMapPeopleTransformEvent);
    }
  }

  public async HandleAimat(req: AimatReqProto): Promise<void> {
    const mapId = this.Player.Data.mapID;
    const rsp = new AimatRspProto(this.UserID, req.targetType, req.targetId, req.x, req.y);

    await this.Player.SendPacket(rsp);

    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.AIMAT,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet: rsp,
      } as IMapAimatEvent);
    }
  }

  public async HandleMapChat(req: ChatReqProto): Promise<void> {
    const mapId = this.Player.Data.mapID;
    Logger.Info(`[MapActionManager] chat userId=${this.UserID}: ${req.msg}`);

    const rsp = new ChatRspProto()
      .setSenderId(this.UserID)
      .setSenderNick(this.Player.Data.nick)
      .setToId(0)
      .setMsg(req.msg);

    await this.Player.SendPacket(rsp);

    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.CHAT,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet: rsp,
      } as IMapChatEvent);
    }
  }

  public async HandleChangeNickName(newNick: string): Promise<void> {
    this.Player.Data.nick = newNick;

    const packet = new PacketChangeNickName(this.UserID, newNick);
    await this.Player.SendPacket(packet);

    const mapId = this.Player.Data.mapID;
    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.CHANGE_NICKNAME,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet,
      } as IMapChangeNicknameEvent);
    }

    Logger.Info(`[MapActionManager] change nickname userId=${this.UserID}, nick=${newNick}`);
  }

  public async HandleChangeColor(newColor: number): Promise<void> {
    this.Player.Data.color = newColor;

    const packet = new PacketChangeColor(this.UserID, newColor, 0, this.Player.Data.coins);
    await this.Player.SendPacket(packet);

    const mapId = this.Player.Data.mapID;
    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.CHANGE_COLOR,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet,
      } as IMapChangeColorEvent);
    }

    Logger.Info(`[MapActionManager] change color userId=${this.UserID}, color=0x${newColor.toString(16)}`);
  }

  public async HandleOnOrOffFlying(flyMode: number): Promise<void> {
    const normalizedFlyMode = flyMode > 0 ? 1 : 0;
    // Persist actor flying state via PlayerData.actionType (0=walk, 1=fly).
    this.Player.Data.actionType = normalizedFlyMode;

    const packet = new PacketOnOrOffFlying(this.UserID, normalizedFlyMode);
    await this.Player.SendPacket(packet);

    const mapId = this.Player.Data.mapID;
    if (mapId > 0) {
      await this.Player.EventBus.Emit({
        type: MapEventType.ON_OR_OFF_FLYING,
        timestamp: Date.now(),
        playerId: this.UserID,
        mapId,
        packet,
      } as IMapOnOrOffFlyingEvent);
    }

    Logger.Info(`[MapActionManager] on/off flying userId=${this.UserID}, flyMode=${normalizedFlyMode}`);
  }
}
