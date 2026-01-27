import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具响应
 */
export class UsePetItemRspProto extends BaseProto {
  userId: number = 0;          // 用户ID
  itemId: number = 0;          // 道具ID
  hp: number = 0;              // 当前HP
  change: number = 0;          // 变化量

  constructor() {
    super(CommandID.USE_PET_ITEM);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(32);
    
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.itemId);
    writer.WriteUInt32(this.hp);
    writer.WriteUInt32(this.change);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setItemId(value: number): this {
    this.itemId = value;
    return this;
  }

  setHP(hp: number, change: number): this {
    this.hp = hp;
    this.change = change;
    return this;
  }
}
