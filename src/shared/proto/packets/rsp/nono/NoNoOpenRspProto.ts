import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo响应
 * 
 * 响应包体：
 * - status (4) - 状态码
 *   - 0: 已经有NoNo
 *   - 非0: 成功获得NoNo
 * 
 * 客户端逻辑（GetNoNo.as）：
 * - status == 0: 显示"已经有NoNo"
 * - status != 0: 设置 MainManager.actorInfo.hasNono = true，显示成功消息
 */
export class NoNoOpenRspProto extends BaseProto {
  status: number = 1; // 默认为1（成功）

  constructor() {
    super(CommandID.NONO_OPEN);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.status);
    return writer.ToBuffer();
  }

  deserialize(_buffer: Buffer): void {
    throw new Error('NoNoOpenRspProto should not be deserialized');
  }
}
