import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { NoNoGetChipRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoGetChipRspProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 获取NoNo芯片响应包
 */
export class PacketNoNoGetChip extends BaseProto {
  private _data: Buffer;

  constructor(chipId: number, chipCount: number) {
    super(CommandID.NONO_GET_CHIP);
    const proto = new NoNoGetChipRspProto()
      .setChipId(chipId)
      .setChipCount(chipCount);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
