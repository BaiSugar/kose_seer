import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2306 PET_CURE] 治疗精灵响应
 * Response: 空（无body）
 */
export class PetCureRspProto extends BaseProto {
  constructor() {
    super(CommandID.PET_CURE);
  }

  serialize(): Buffer {
    // 治疗响应无body
    return Buffer.alloc(0);
  }
}
