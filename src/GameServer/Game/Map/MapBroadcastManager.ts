import { BaseProto } from '../../../shared/proto';
import { Logger } from '../../../shared/utils';
import { BaseManager } from '../Base/BaseManager';
import { GameEventBus } from '../Event/GameEventBus';
import { BroadcastService } from '../Broadcast/BroadcastService';
import {
  IMapAimatEvent,
  IMapChatEvent,
  IMapChangeColorEvent,
  IMapChangeNicknameEvent,
  IMapDanceActionEvent,
  IMapOnOrOffFlyingEvent,
  IMapPetShowEvent,
  IMapPeopleTransformEvent,
  IMapPeopleWalkEvent,
} from './MapEventTypes';
import { MapEventType } from '../Event';

/**
 * Listens to map domain events and broadcasts packets to other players in map.
 */
export class MapBroadcastManager extends BaseManager {
  private _broadcastService: BroadcastService = BroadcastService.Instance;

  public RegisterEvents(eventBus: GameEventBus): void {
    eventBus.On<IMapPeopleWalkEvent>(MapEventType.PEOPLE_WALK, this.OnPeopleWalk.bind(this));
    eventBus.On<IMapDanceActionEvent>(MapEventType.DANCE_ACTION, this.OnDanceAction.bind(this));
    eventBus.On<IMapPeopleTransformEvent>(MapEventType.PEOPLE_TRANSFORM, this.OnPeopleTransform.bind(this));
    eventBus.On<IMapAimatEvent>(MapEventType.AIMAT, this.OnAimat.bind(this));
    eventBus.On<IMapChatEvent>(MapEventType.CHAT, this.OnChat.bind(this));
    eventBus.On<IMapPetShowEvent>(MapEventType.PET_SHOW, this.OnPetShow.bind(this));
    eventBus.On<IMapChangeNicknameEvent>(MapEventType.CHANGE_NICKNAME, this.OnChangeNickname.bind(this));
    eventBus.On<IMapChangeColorEvent>(MapEventType.CHANGE_COLOR, this.OnChangeColor.bind(this));
    eventBus.On<IMapOnOrOffFlyingEvent>(MapEventType.ON_OR_OFF_FLYING, this.OnOrOffFlying.bind(this));
  }

  private async OnPeopleWalk(event: IMapPeopleWalkEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.PEOPLE_WALK);
  }

  private async OnDanceAction(event: IMapDanceActionEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.DANCE_ACTION);
  }

  private async OnPeopleTransform(event: IMapPeopleTransformEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.PEOPLE_TRANSFORM);
  }

  private async OnAimat(event: IMapAimatEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.AIMAT);
  }

  private async OnChat(event: IMapChatEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.CHAT);
  }

  private async OnPetShow(event: IMapPetShowEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.PET_SHOW);
  }

  private async OnChangeNickname(event: IMapChangeNicknameEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.CHANGE_NICKNAME);
  }

  private async OnChangeColor(event: IMapChangeColorEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.CHANGE_COLOR);
  }

  private async OnOrOffFlying(event: IMapOnOrOffFlyingEvent): Promise<void> {
    await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, MapEventType.ON_OR_OFF_FLYING);
  }

  private async BroadcastToMapOthers(
    mapId: number,
    packet: BaseProto,
    senderUserId: number | undefined,
    eventType: (typeof MapEventType)[keyof typeof MapEventType]
  ): Promise<void> {
    if (mapId <= 0) {
      return;
    }

    const sent = await this._broadcastService.BroadcastToMap(mapId, packet, senderUserId);
    if (sent > 0) {
      Logger.Debug(
        `[MapBroadcastManager] event=${eventType}, sender=${senderUserId || 0}, mapId=${mapId}, sent=${sent}`
      );
    }
  }
}
