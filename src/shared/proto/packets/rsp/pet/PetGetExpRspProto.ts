import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息响应
 * 
 * Response Body:
 * - allocatableExp (uint32): 可分配的经验值
 */
export class PetGetExpRspProto extends BaseProto {
  allocatableExp: number = 0;

  constructor(allocatableExp: number) {
    super(CommandID.PET_GET_EXP);
    this.allocatableExp = allocatableExp;
  }

  serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.allocatableExp, 0);
    return buffer;
  }
}
