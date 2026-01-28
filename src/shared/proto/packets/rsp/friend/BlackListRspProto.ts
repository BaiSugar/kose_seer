import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 黑名单信息接口
 */
export interface IBlackInfo {
  userId: number;
  nickname: string;
  color: number;
}

/**
 * 黑名单列表响应
 * CMD 2159
 * 
 * 响应格式:
 * - blackCount(4)
 * - [BlackInfo]...
 *   - userID(4)
 *   - nickname(16)
 *   - color(4)
 */
export class BlackListRspProto extends BaseProto {
  public blackList: IBlackInfo[] = [];

  constructor() {
    super(CommandID.BLACK_LIST);
  }

  public serialize(): Buffer {
    const blackCount = this.blackList.length;
    const bufferSize = 4 + (blackCount * 24); // count(4) + [24 bytes per black]
    const buffer = Buffer.alloc(bufferSize);
    
    let offset = 0;
    
    // 写入黑名单数量
    buffer.writeUInt32BE(blackCount, offset);
    offset += 4;
    
    // 写入每个黑名单信息
    for (const black of this.blackList) {
      // userID(4)
      buffer.writeUInt32BE(black.userId, offset);
      offset += 4;
      
      // nickname(16) - 固定长度字符串
      const nicknameBuffer = Buffer.from(black.nickname, 'utf8');
      const nicknameToCopy = nicknameBuffer.slice(0, 16);
      nicknameToCopy.copy(buffer, offset);
      offset += 16;
      
      // color(4)
      buffer.writeUInt32BE(black.color, offset);
      offset += 4;
    }
    
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    if (buffer.length < 4) return;
    const blackCount = buffer.readUInt32BE(offset);
    offset += 4;
    
    this.blackList = [];
    for (let i = 0; i < blackCount; i++) {
      if (offset + 24 <= buffer.length) {
        const userId = buffer.readUInt32BE(offset);
        offset += 4;
        
        const nicknameBuffer = buffer.slice(offset, offset + 16);
        const nickname = nicknameBuffer.toString('utf8').replace(/\0/g, '');
        offset += 16;
        
        const color = buffer.readUInt32BE(offset);
        offset += 4;
        
        this.blackList.push({ userId, nickname, color });
      }
    }
  }

  // 链式调用辅助方法
  public setBlackList(blackList: IBlackInfo[]): this {
    this.blackList = blackList;
    return this;
  }
}
