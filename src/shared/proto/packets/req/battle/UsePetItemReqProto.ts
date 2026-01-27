import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具请求
 */
export class UsePetItemReqProto extends BaseProto {
  itemId: number = 0;  // 道具ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): UsePetItemReqProto {
    const proto = new UsePetItemReqProto();
    if (buffer.length >= 4) {
      proto.itemId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
