import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 好友信息接口
 */
export interface IFriendInfo {
  userId: number;
  nickname: string;
  color: number;
  isOnline: boolean;
}

/**
 * 好友列表响应
 * CMD 2158
 * 
 * 响应格式:
 * - friendCount(4)
 * - [FriendInfo]...
 *   - userID(4)
 *   - nickname(16)
 *   - color(4)
 *   - isOnline(1)
 */
export class FriendListRspProto extends BaseProto {
  public friendList: IFriendInfo[] = [];

  constructor() {
    super(CommandID.FRIEND_LIST);
  }

  public serialize(): Buffer {
    const friendCount = this.friendList.length;
    const bufferSize = 4 + (friendCount * 25); // count(4) + [25 bytes per friend]
    const buffer = Buffer.alloc(bufferSize);
    
    let offset = 0;
    
    // 写入好友数量
    buffer.writeUInt32BE(friendCount, offset);
    offset += 4;
    
    // 写入每个好友信息
    for (const friend of this.friendList) {
      // userID(4)
      buffer.writeUInt32BE(friend.userId, offset);
      offset += 4;
      
      // nickname(16) - 固定长度字符串
      const nicknameBuffer = Buffer.from(friend.nickname, 'utf8');
      const nicknameToCopy = nicknameBuffer.slice(0, 16);
      nicknameToCopy.copy(buffer, offset);
      offset += 16;
      
      // color(4)
      buffer.writeUInt32BE(friend.color, offset);
      offset += 4;
      
      // isOnline(1)
      buffer.writeUInt8(friend.isOnline ? 1 : 0, offset);
      offset += 1;
    }
    
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    if (buffer.length < 4) return;
    const friendCount = buffer.readUInt32BE(offset);
    offset += 4;
    
    this.friendList = [];
    for (let i = 0; i < friendCount; i++) {
      if (offset + 25 <= buffer.length) {
        const userId = buffer.readUInt32BE(offset);
        offset += 4;
        
        const nicknameBuffer = buffer.slice(offset, offset + 16);
        const nickname = nicknameBuffer.toString('utf8').replace(/\0/g, '');
        offset += 16;
        
        const color = buffer.readUInt32BE(offset);
        offset += 4;
        
        const isOnline = buffer.readUInt8(offset) === 1;
        offset += 1;
        
        this.friendList.push({ userId, nickname, color, isOnline });
      }
    }
  }

  // 链式调用辅助方法
  public setFriendList(friendList: IFriendInfo[]): this {
    this.friendList = friendList;
    return this;
  }
}
