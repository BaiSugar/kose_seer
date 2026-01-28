import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 移除黑名单响应
 * CMD 2155
 * 
 * 响应格式: 空包
 */
export class BlackRemoveRspProto extends BaseProto {
  constructor() {
    super(CommandID.BLACK_REMOVE);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }

  public deserialize(buffer: Buffer): void {
    // 空包，无需解析
  }
}
