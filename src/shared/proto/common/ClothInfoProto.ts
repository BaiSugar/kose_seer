import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 服装信息Proto
 */
export class ClothInfoProto extends BaseProto {
  id: number = 0;
  type: number = 0;
  expireTime: number = 0;

  constructor() {
    super(0); // 通用Proto不需要cmdId
  }

  serialize(): Buffer {
    const writer = new BufferWriter(12);
    writer.WriteUInt32(this.id);
    writer.WriteUInt32(this.type);
    writer.WriteUInt32(this.expireTime);
    return writer.ToBuffer();
  }
}

/**
 * 服装列表Proto
 */
export class ClothListProto extends BaseProto {
  clothes: ClothInfoProto[] = [];

  constructor() {
    super(0); // 通用Proto不需要cmdId
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4 + this.clothes.length * 12);
    writer.WriteUInt32(this.clothes.length);
    for (const cloth of this.clothes) {
      writer.WriteBytes(cloth.serialize());
    }
    return writer.ToBuffer();
  }
}
