import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 玩家基础信息Proto
 * 可在多个协议中复用
 */
export class PlayerInfoProto extends BaseProto {
  userId: number = 0;
  nickname: string = '';
  level: number = 1;
  exp: number = 0;
  coins: number = 0;
  energy: number = 0;

  constructor() {
    super(0); // 通用Proto不需要cmdId
  }

  serialize(): Buffer {
    const writer = new BufferWriter(100);
    writer.WriteUInt32(this.userId);
    writer.WriteBytes(this.buildString(this.nickname, 20));
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.exp);
    writer.WriteUInt32(this.coins);
    writer.WriteUInt32(this.energy);
    return writer.ToBuffer();
  }
}
