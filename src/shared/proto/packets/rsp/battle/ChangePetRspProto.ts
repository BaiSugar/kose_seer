import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2407 CHANGE_PET] 更换精灵响应
 */
export class ChangePetRspProto extends BaseProto {
  userId: number = 0;          // 用户ID
  petId: number = 0;           // 精灵ID
  petName: string = '';        // 精灵名称 (16字节)
  level: number = 0;           // 等级
  hp: number = 0;              // 当前HP
  maxHp: number = 0;           // 最大HP
  catchTime: number = 0;       // 捕获时间

  constructor() {
    super(CommandID.CHANGE_PET);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(64);
    
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.petId);
    writer.WriteBytes(this.buildString(this.petName, 16));
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.hp);
    writer.WriteUInt32(this.maxHp);
    writer.WriteUInt32(this.catchTime);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setPetId(value: number): this {
    this.petId = value;
    return this;
  }

  setPetName(value: string): this {
    this.petName = value;
    return this;
  }

  setLevel(value: number): this {
    this.level = value;
    return this;
  }

  setHP(hp: number, maxHp: number): this {
    this.hp = hp;
    this.maxHp = maxHp;
    return this;
  }

  setCatchTime(value: number): this {
    this.catchTime = value;
    return this;
  }
}
