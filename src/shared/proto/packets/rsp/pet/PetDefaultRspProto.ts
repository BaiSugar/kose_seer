import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵响应
 * Response: 空（无body）
 */
export class PetDefaultRspProto extends BaseProto {
  constructor() {
    super(CommandID.PET_DEFAULT);
  }

  serialize(): Buffer {
    // 设置默认精灵响应无body
    return Buffer.alloc(0);
  }
}
