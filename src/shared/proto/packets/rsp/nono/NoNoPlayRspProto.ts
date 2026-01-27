import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9013 NONO_PLAY] NoNo 玩耍响应
 * 
 * 玩耍会增加 NoNo 的心情值
 */
export class NoNoPlayRspProto extends BaseProto {
  itemId: number = 0;       // 物品ID（占位）
  power: number = 0;        // 体力
  ai: number = 0;           // AI (2字节)
  mate: number = 0;         // 心情
  iq: number = 0;           // 智商

  constructor() {
    super(CommandID.NONO_PLAY);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(64);
    
    // result (4 bytes)
    writer.WriteUInt32(this.result);
    
    // itemId (4 bytes)
    writer.WriteUInt32(this.itemId);
    
    // power (4 bytes)
    writer.WriteUInt32(this.power);
    
    // ai (2 bytes) - 注意这里是 UInt16
    writer.WriteUInt16(this.ai);
    
    // mate (4 bytes)
    writer.WriteUInt32(this.mate);
    
    // iq (4 bytes)
    writer.WriteUInt32(this.iq);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setPower(value: number): this {
    this.power = value;
    return this;
  }

  setAi(value: number): this {
    this.ai = value;
    return this;
  }

  setMate(value: number): this {
    this.mate = value;
    return this;
  }

  setIq(value: number): this {
    this.iq = value;
    return this;
  }
}
