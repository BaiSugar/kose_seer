import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeColorRspProto } from '../../../../../shared/proto/packets/rsp/map/ChangeColorRspProto';

/**
 * 修改颜色响应包
 * CMD 1008
 */
export class PacketChangeColor extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, newColor: number, cost: number, remain: number) {
    super(CommandID.CHANGE_COLOR);
    const proto = new ChangeColorRspProto();
    proto.userId = userId;
    proto.newColor = newColor;
    proto.cost = cost;
    proto.remain = remain;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
