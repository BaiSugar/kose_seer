import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 服务器信息（原始格式）
 * onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4) = 30字节
 */
export interface ServerInfoRaw {
  onlineID: number;
  userCnt: number;
  ip: string;
  port: number;
  friends: number;
}

/**
 * 好友信息
 */
export interface FriendInfo {
  userID: number;
  timePoke: number;
}

/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers... + friendData
 */
export class CommendOnlineRspProto extends BaseProto {
  maxOnlineID: number = 0;
  isVIP: number = 0;
  onlineCnt: number = 0;
  servers: ServerInfoRaw[] = [];
  friends: FriendInfo[] = [];
  blacklist: number[] = [];

  constructor() {
    super(CommandID.COMMEND_ONLINE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(2000);

    // 基础信息
    writer.WriteUInt32(this.maxOnlineID);
    writer.WriteUInt32(this.isVIP);
    writer.WriteUInt32(this.onlineCnt);

    // 服务器列表（每个30字节）
    for (const server of this.servers) {
      writer.WriteUInt32(server.onlineID);
      writer.WriteUInt32(server.userCnt);
      
      // IP地址（16字节，补0）
      const ipBytes = Buffer.alloc(16);
      Buffer.from(server.ip, 'utf8').copy(ipBytes);
      writer.WriteBytes(ipBytes);
      
      // 端口（2字节）
      writer.WriteUInt16(server.port);
      
      // 好友数（4字节）
      writer.WriteUInt32(server.friends);
    }

    // 好友数据
    writer.WriteUInt32(this.friends.length);
    for (const friend of this.friends) {
      writer.WriteUInt32(friend.userID);
      writer.WriteUInt32(friend.timePoke);
    }

    // 黑名单数据
    writer.WriteUInt32(this.blacklist.length);
    for (const userId of this.blacklist) {
      writer.WriteUInt32(userId);
    }

    return writer.ToBuffer();
  }
}
