import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵响应
 */
export class CatchMonsterRspProto extends BaseProto {
  catchTime: number = 0;       // 捕获时间
  petId: number = 0;           // 精灵ID

  constructor() {
    super(CommandID.CATCH_MONSTER);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(16);
    
    writer.WriteUInt32(this.catchTime);
    writer.WriteUInt32(this.petId);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setCatchTime(value: number): this {
    this.catchTime = value;
    return this;
  }

  setPetId(value: number): this {
    this.petId = value;
    return this;
  }
}
