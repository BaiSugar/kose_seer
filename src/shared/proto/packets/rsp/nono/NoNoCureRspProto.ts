import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9007 NONO_CURE] NoNo 治疗响应
 * 
 * 空响应包，只返回 result
 */
export class NoNoCureRspProto extends BaseProto {
  constructor() {
    super(CommandID.NONO_CURE);
  }

  serialize(): Buffer {
    // 空响应，只有 result 字段（在 PacketBuilder 中自动添加）
    return Buffer.alloc(0);
  }
}
