import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9027 NONO_IS_INFO] NoNo是否有信息响应
 * 响应: hasNono(4) - 1=有NoNo, 0=无NoNo
 */
export class NoNoIsInfoRspProto extends BaseProto {
  hasNono: number = 1;  // 是否有NoNo

  constructor() {
    super(CommandID.NONO_IS_INFO);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.hasNono);
    return writer.ToBuffer();
  }

  setHasNono(hasNono: number): this {
    this.hasNono = hasNono;
    return this;
  }
}
