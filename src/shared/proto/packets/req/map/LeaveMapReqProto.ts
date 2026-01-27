import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 离开地图请求
 * CMD: 2002 LEAVE_MAP
 */
export class LeaveMapReqProto extends BaseProto {
  public mapId: number = 0;
  public mapType: number = 0;

  constructor() {
    super(CommandID.LEAVE_MAP);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    if (buffer.length >= 8) {
      this.mapId = buffer.readUInt32BE(offset);
      offset += 4;
      this.mapType = buffer.readUInt32BE(offset);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(this.mapId, 0);
    buffer.writeUInt32BE(this.mapType, 4);
    return buffer;
  }
}
