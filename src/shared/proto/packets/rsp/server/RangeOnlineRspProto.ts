import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 服务器信息
 */
export interface RangeServerInfo {
  id: number;
  name: string;
  online: number;
  status: number;
}

/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 * 响应: onlineCnt(4) + servers...
 */
export class RangeOnlineRspProto extends BaseProto {
  onlineCnt: number = 0;
  servers: RangeServerInfo[] = [];

  constructor() {
    super(CommandID.RANGE_ONLINE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1000);

    // 服务器数量
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
