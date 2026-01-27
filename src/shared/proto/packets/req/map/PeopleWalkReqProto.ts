import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动请求
 */
export class PeopleWalkReqProto extends BaseProto {
  walkType: number = 0;  // 移动类型
  x: number = 0;         // X坐标
  y: number = 0;         // Y坐标
  amfData: Buffer = Buffer.alloc(0);  // AMF数据

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PeopleWalkReqProto {
    const proto = new PeopleWalkReqProto();
    if (buffer.length >= 16) {
      proto.walkType = buffer.readUInt32BE(0);
      proto.x = buffer.readUInt32BE(4);
      proto.y = buffer.readUInt32BE(8);
      const amfLen = buffer.readUInt32BE(12);
      if (buffer.length >= 16 + amfLen) {
        proto.amfData = buffer.subarray(16, 16 + amfLen);
      }
    }
    return proto;
  }
}
