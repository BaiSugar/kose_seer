import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应
 * 
 * Response Body:
 * - catchTime (uint32): 精灵捕获时间
 * - newLevel (uint32): 新等级
 * - newExp (uint32): 新经验值
 * - remainingAllocExp (uint32): 剩余可分配经验
 */
export class PetSetExpRspProto extends BaseProto {
  catchTime: number = 0;
  newLevel: number = 0;
  newExp: number = 0;
  remainingAllocExp: number = 0;

  constructor(catchTime: number, newLevel: number, newExp: number, remainingAllocExp: number) {
    super(CommandID.PET_SET_EXP);
    this.catchTime = catchTime;
    this.newLevel = newLevel;
    this.newExp = newExp;
    this.remainingAllocExp = remainingAllocExp;
  }

  serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    buffer.writeUInt32BE(this.catchTime, 0);
    buffer.writeUInt32BE(this.newLevel, 4);
    buffer.writeUInt32BE(this.newExp, 8);
    buffer.writeUInt32BE(this.remainingAllocExp, 12);
    return buffer;
  }
}
