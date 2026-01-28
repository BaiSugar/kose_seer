import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加黑名单响应
 * CMD 2154
 * 
 * 响应格式: 空包
 */
export class BlackAddRspProto extends BaseProto {
  constructor() {
    super(CommandID.BLACK_ADD);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }

  public deserialize(buffer: Buffer): void {
    // 空包，无需解析
  }
}
