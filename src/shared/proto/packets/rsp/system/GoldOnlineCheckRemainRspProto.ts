import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额响应
 */
export class GoldOnlineCheckRemainRspProto extends BaseProto {
  gold: number = 0;  // 金币余额

  constructor() {
    super(CommandID.GOLD_ONLINE_CHECK_REMAIN);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.gold);
    return writer.ToBuffer();
  }

  setGold(gold: number): this {
    this.gold = gold;
    return this;
  }
}
