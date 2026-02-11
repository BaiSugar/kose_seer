import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表请求
 */
export class PetRoomListReqProto extends BaseProto {
  roomType: number = 0;  // 房间类型（1=仓库）

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetRoomListReqProto {
    const proto = new PetRoomListReqProto();
    if (buffer.length >= 4) {
      proto.roomType = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
