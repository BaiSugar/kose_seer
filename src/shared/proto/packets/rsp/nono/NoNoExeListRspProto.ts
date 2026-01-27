import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9015 NONO_EXE_LIST] NoNo 执行列表响应
 * 
 * 返回空列表
 */
export class NoNoExeListRspProto extends BaseProto {
  count: number = 0;  // 列表数量

  constructor() {
    super(CommandID.NONO_EXE_LIST);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(8);
    writer.WriteUInt32(this.result);
    writer.WriteUInt32(this.count);
    return writer.ToBuffer();
  }
}
