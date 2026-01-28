import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { ServerInfoRaw } from './CommendOnlineRspProto';

/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 * 响应: onlineCnt(4) + servers...
 */
export class RangeOnlineRspProto extends BaseProto {
  onlineCnt: number = 0;
  servers: ServerInfoRaw[] = [];

  constructor() {
    super(CommandID.RANGE_ONLINE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1000);

    // 服务器数量
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

    return writer.ToBuffer();
  }
}
