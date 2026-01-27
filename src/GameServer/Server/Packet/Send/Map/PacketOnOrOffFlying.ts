import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { OnOrOffFlyingRspProto } from '../../../../../shared/proto/packets/rsp/map/OnOrOffFlyingRspProto';

/**
 * 开关飞行模式响应包
 * CMD 1012
 */
export class PacketOnOrOffFlying extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, flyMode: number) {
    super(CommandID.ON_OR_OFF_FLYING);
    const proto = new OnOrOffFlyingRspProto();
    proto.userId = userId;
    proto.flyMode = flyMode;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
