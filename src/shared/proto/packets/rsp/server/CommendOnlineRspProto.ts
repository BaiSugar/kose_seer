import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 服务器信息
 */
export interface CommendServerInfo {
  id: number;
  name: string;
  online: number;
  status: number;
}

/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
 */
export class CommendOnlineRspProto extends BaseProto {
  maxOnlineID: number = 0;
  isVIP: number = 0;
  onlineCnt: number = 0;
  servers: CommendServerInfo[] = [];

  constructor() {
    super(CommandID.COMMEND_ONLINE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1000);

    // 基础信息
    writer.WriteUInt32(this.maxOnlineID);
    writer.WriteUInt32(this.isVIP);
    writer.WriteUInt32(this.onlineCnt);

    // 服务器列表
    for (const server of this.servers) {
      writer.WriteUInt32(server.id);
      writer.WriteBytes(this.buildString(server.name, 32));
      writer.WriteUInt32(server.online);
      writer.WriteUInt32(server.status);
    }

    return writer.ToBuffer();
  }
}
