import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2506 FIGHT_OVER] 战斗结束响应
 */
export class FightOverRspProto extends BaseProto {
  reason: number = 0;          // 结束原因 (0=正常, 1=逃跑, 2=捕获)
  winnerId: number = 0;        // 胜利者ID (0=敌人)
  reserved: Buffer;            // 保留字段 (20字节)

  constructor() {
    super(CommandID.FIGHT_OVER);
    this.reserved = Buffer.alloc(20);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(64);
    
    writer.WriteUInt32(this.reason);
    writer.WriteUInt32(this.winnerId);
    writer.WriteBytes(this.reserved);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setReason(value: number): this {
    this.reason = value;
    return this;
  }

  setWinnerId(value: number): this {
    this.winnerId = value;
    return this;
  }
}
