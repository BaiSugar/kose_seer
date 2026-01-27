import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleWalkRspProto } from '../../../../../shared/proto/packets/rsp/map/PeopleWalkRspProto';

/**
 * 玩家移动响应包
 * CMD 1013
 */
export class PacketPeopleWalk extends BaseProto {
  private _data: Buffer;

  constructor(walkType: number, userId: number, x: number, y: number, amfData: Buffer = Buffer.alloc(0)) {
    super(CommandID.PEOPLE_WALK);
    const proto = new PeopleWalkRspProto();
    proto.walkType = walkType;
    proto.userId = userId;
    proto.x = x;
    proto.y = y;
    proto.amfData = amfData;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
