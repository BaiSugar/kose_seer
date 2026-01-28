import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 在线信息接口
 */
export interface IOnlineInfo {
  userId: number;
  serverId: number;
  mapType: number;
  mapId: number;
}

/**
 * 查看在线状态响应
 * CMD 2157
 * 
 * 响应格式:
 * - onlineCount(4)
 * - [OnLineInfo]...
 *   - userID(4)
 *   - serverID(4)
 *   - mapType(4)
 *   - mapID(4)
 */
export class SeeOnlineRspProto extends BaseProto {
  public onlineList: IOnlineInfo[] = [];

  constructor() {
    super(CommandID.SEE_ONLINE);
  }

  public serialize(): Buffer {
    const onlineCount = this.onlineList.length;
    const bufferSize = 4 + (onlineCount * 16); // count(4) + [16 bytes per user]
    const buffer = Buffer.alloc(bufferSize);
    
    let offset = 0;
    
    // 写入在线数量
    buffer.writeUInt32BE(onlineCount, offset);
    offset += 4;
    
    // 写入每个在线用户信息
    for (const info of this.onlineList) {
      buffer.writeUInt32BE(info.userId, offset);
      offset += 4;
      buffer.writeUInt32BE(info.serverId, offset);
      offset += 4;
      buffer.writeUInt32BE(info.mapType, offset);
      offset += 4;
      buffer.writeUInt32BE(info.mapId, offset);
      offset += 4;
    }
    
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    if (buffer.length < 4) return;
    const onlineCount = buffer.readUInt32BE(offset);
    offset += 4;
    
    this.onlineList = [];
    for (let i = 0; i < onlineCount; i++) {
      if (offset + 16 <= buffer.length) {
        this.onlineList.push({
          userId: buffer.readUInt32BE(offset),
          serverId: buffer.readUInt32BE(offset + 4),
          mapType: buffer.readUInt32BE(offset + 8),
          mapId: buffer.readUInt32BE(offset + 12)
        });
        offset += 16;
      }
    }
  }

  // 链式调用辅助方法
  public setOnlineList(onlineList: IOnlineInfo[]): this {
    this.onlineList = onlineList;
    return this;
  }
}
