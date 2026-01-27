import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AimatRspProto } from '../../../../../shared/proto/packets/rsp/map/AimatRspProto';

/**
 * 瞄准/交互响应包
 * CMD 1010
 */
export class PacketAimat extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, targetType: number, targetId: number, x: number, y: number) {
    super(CommandID.AIMAT);
    const proto = new AimatRspProto();
    proto.userId = userId;
    proto.targetType = targetType;
    proto.targetId = targetId;
    proto.x = x;
    proto.y = y;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
