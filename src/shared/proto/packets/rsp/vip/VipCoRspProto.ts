import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: VIP_CO (8006)] VIP状态变更响应
 * 
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 * 
 * Response Body:
 * - userId (uint32): 玩家ID
 * - vipType (uint32): VIP类型 (0=无VIP, 1=普通VIP, 2=超级NoNo)
 * - autoCharge (uint32): 自动充电
 * - vipEndTime (uint32): VIP结束时间（秒级时间戳）
 */
export class VipCoRspProto extends BaseProto {
  userId: number = 0;
  vipType: number = 0;
  autoCharge: number = 0;
  vipEndTime: number = 0;

  constructor() {
    super(CommandID.VIP_CO);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(16);
    
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.vipType);
    writer.WriteUInt32(this.autoCharge);
    writer.WriteUInt32(this.vipEndTime);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setVipType(value: number): this {
    this.vipType = value;
    return this;
  }

  setAutoCharge(value: number): this {
    this.autoCharge = value;
    return this;
  }

  setVipEndTime(value: number): this {
    this.vipEndTime = value;
    return this;
  }
}
