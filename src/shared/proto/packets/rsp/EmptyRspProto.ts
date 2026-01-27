import { BaseProto } from '../../base/BaseProto';

/**
 * 通用空响应 Proto
 * 用于只返回 result 的简单命令
 */
export class EmptyRspProto extends BaseProto {
  constructor(cmdId: number) {
    super(cmdId);
  }

  serialize(): Buffer {
    // 空响应，只有 result 字段（在 PacketBuilder 中自动添加）
    return Buffer.alloc(0);
  }
}
