import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2001 ENTER_MAP] 进入地图请求
 */
export class EnterMapReqProto extends BaseProto {
  mapType: number = 0;  // 地图类型
  mapId: number = 0;    // 地图ID
  x: number = 500;      // X坐标
  y: number = 300;      // Y坐标

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): EnterMapReqProto {
    const proto = new EnterMapReqProto();
    if (buffer.length >= 16) {
      proto.mapType = buffer.readUInt32BE(0);
      proto.mapId = buffer.readUInt32BE(4);
      proto.x = buffer.readUInt32BE(8);
      proto.y = buffer.readUInt32BE(12);
    }
    return proto;
  }
}
