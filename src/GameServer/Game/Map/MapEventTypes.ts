import { AimatRspProto } from '../../../shared/proto/packets/rsp/map/AimatRspProto';
import { ChatRspProto } from '../../../shared/proto/packets/rsp/map/ChatRspProto';
import { DanceActionRspProto } from '../../../shared/proto/packets/rsp/map/DanceActionRspProto';
import { PeopleTransformRspProto } from '../../../shared/proto/packets/rsp/map/PeopleTransformRspProto';
import { PeopleWalkRspProto } from '../../../shared/proto/packets/rsp/map/PeopleWalkRspProto';
import { PacketChangeColor } from '../../Server/Packet/Send/Map/PacketChangeColor';
import { PacketChangeNickName } from '../../Server/Packet/Send/Map/PacketChangeNickName';
import { PacketOnOrOffFlying } from '../../Server/Packet/Send/Map/PacketOnOrOffFlying';
import { PacketPetShow } from '../../Server/Packet/Send/Pet/PacketPetShow';
import { MapEventType } from '../Event';

interface IMapActionEventBase {
  timestamp: number;
  playerId?: number;
  mapId: number;
}

export interface IMapPeopleWalkEvent extends IMapActionEventBase {
  type: typeof MapEventType.PEOPLE_WALK;
  packet: PeopleWalkRspProto;
}

export interface IMapDanceActionEvent extends IMapActionEventBase {
  type: typeof MapEventType.DANCE_ACTION;
  packet: DanceActionRspProto;
}

export interface IMapPeopleTransformEvent extends IMapActionEventBase {
  type: typeof MapEventType.PEOPLE_TRANSFORM;
  packet: PeopleTransformRspProto;
}

export interface IMapAimatEvent extends IMapActionEventBase {
  type: typeof MapEventType.AIMAT;
  packet: AimatRspProto;
}

export interface IMapChatEvent extends IMapActionEventBase {
  type: typeof MapEventType.CHAT;
  packet: ChatRspProto;
}

export interface IMapPetShowEvent extends IMapActionEventBase {
  type: typeof MapEventType.PET_SHOW;
  packet: PacketPetShow;
}

export interface IMapChangeNicknameEvent extends IMapActionEventBase {
  type: typeof MapEventType.CHANGE_NICKNAME;
  packet: PacketChangeNickName;
}

export interface IMapChangeColorEvent extends IMapActionEventBase {
  type: typeof MapEventType.CHANGE_COLOR;
  packet: PacketChangeColor;
}

export interface IMapOnOrOffFlyingEvent extends IMapActionEventBase {
  type: typeof MapEventType.ON_OR_OFF_FLYING;
  packet: PacketOnOrOffFlying;
}
