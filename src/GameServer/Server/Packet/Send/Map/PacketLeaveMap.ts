import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { LeaveMapRspProto } from '../../../../../shared/proto/packets/rsp/map/LeaveMapRspProto';

/**
 * 离开地图响应包
 * CMD 1002
 */
export class PacketLeaveMap extends BaseProto {
  private _data: Buffer;

  constructor(userId: number) {
    super(CommandID.LEAVE_MAP);
    const proto = new LeaveMapRspProto();
    proto.userId = userId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
