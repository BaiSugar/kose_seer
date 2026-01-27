import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9025 GET_DIAMOND] 获取钻石数量响应
 * 响应: diamondCount(4)
 */
export class GetDiamondRspProto extends BaseProto {
  diamondCount: number = 0;  // 钻石数量

  constructor() {
    super(CommandID.GET_DIAMOND);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.diamondCount);
    return writer.ToBuffer();
  }

  setDiamondCount(count: number): this {
    this.diamondCount = count;
    return this;
  }
}
