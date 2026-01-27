import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { GetDiamondRspProto } from '../../../../../shared/proto/packets/rsp/nono/GetDiamondRspProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 获取钻石数量响应包
 */
export class PacketGetDiamond extends BaseProto {
  private _data: Buffer;

  constructor(diamondCount: number) {
    super(CommandID.GET_DIAMOND);
    const proto = new GetDiamondRspProto().setDiamondCount(diamondCount);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
