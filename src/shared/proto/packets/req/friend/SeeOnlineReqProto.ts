import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 查看在线状态请求
 * CMD 2157
 * 
 * 请求格式: count(4) + userIDs[count] (每个4字节)
 */
export class SeeOnlineReqProto extends BaseProto {
  public userIds: number[] = [];

  constructor() {
    super(CommandID.SEE_ONLINE);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    // 读取数量
    if (buffer.length < 4) return;
    const count = buffer.readUInt32BE(offset);
    offset += 4;
    
    // 读取用户ID列表
    for (let i = 0; i < count; i++) {
      if (offset + 4 <= buffer.length) {
        const userId = buffer.readUInt32BE(offset);
        this.userIds.push(userId);
        offset += 4;
      }
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
