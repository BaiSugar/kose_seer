import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片响应
 * 响应: padding1(4) + padding2(4) + padding3(4) + count(4) + [chipId(4) + chipCount(4)]...
 */
export class NoNoGetChipRspProto extends BaseProto {
  chipId: number = 0;      // 芯片ID
  chipCount: number = 0;   // 芯片数量

  constructor() {
    super(CommandID.NONO_GET_CHIP);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(24);
    writer.WriteUInt32(0);  // padding1
    writer.WriteUInt32(0);  // padding2
    writer.WriteUInt32(0);  // padding3
    writer.WriteUInt32(1);  // count = 1
    writer.WriteUInt32(this.chipId);
    writer.WriteUInt32(this.chipCount);
    return writer.ToBuffer();
  }

  setChipId(chipId: number): this {
    this.chipId = chipId;
    return this;
  }

  setChipCount(chipCount: number): this {
    this.chipCount = chipCount;
    return this;
  }
}
