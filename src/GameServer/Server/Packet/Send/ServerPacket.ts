import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../shared/protocol/CommandID';
import { ServerConfig } from '../../../../shared/config/server';
import { CommendOnlineRspProto, RangeOnlineRspProto } from '../../../../shared/proto';

/**
 * 服务器信息接口
 */
export interface IServerInfo {
  onlineID: number;   // 服务器ID
  userCnt: number;    // 在线人数
  ip: string;         // 服务器IP
  port: number;       // 服务器端口
  friends: number;    // 好友数量
}

/**
 * 服务器响应数据包
 * 包含命令:
 * - [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * - [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 */
export class ServerPacket {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
   */
  public CommendOnline(userID: number, servers: IServerInfo[] = []): Buffer {
    // 默认服务器
    if (servers.length === 0) {
      servers = [this.GetDefaultServer()];
    }

    // 使用Proto构建响应
    const proto = new CommendOnlineRspProto();
    proto.maxOnlineID = servers.length;
    proto.isVIP = 0;
    proto.onlineCnt = servers.length;
    proto.servers = servers.map(s => ({
      onlineID: s.onlineID,
      userCnt: s.userCnt,
      ip: s.ip,
      port: s.port,
      friends: s.friends
    }));

    return this._packetBuilder.Build(
      CommandID.COMMEND_ONLINE,
      userID,
      0,
      proto.serialize()
    );
  }

  /**
   * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
   */
  public RangeOnline(userID: number, servers: IServerInfo[] = []): Buffer {
    // 默认服务器
    if (servers.length === 0) {
      servers = [this.GetDefaultServer()];
    }

    // 使用Proto构建响应
    const proto = new RangeOnlineRspProto();
    proto.onlineCnt = servers.length;
    proto.servers = servers.map(s => ({
      onlineID: s.onlineID,
      userCnt: s.userCnt,
      ip: s.ip,
      port: s.port,
      friends: s.friends
    }));

    return this._packetBuilder.Build(
      CommandID.RANGE_ONLINE,
      userID,
      0,
      proto.serialize()
    );
  }

  /**
   * 获取默认服务器配置
   */
  private GetDefaultServer(): IServerInfo {
    return {
      onlineID: 1,
      userCnt: 100,
      ip: ServerConfig.Host,
      port: ServerConfig.Port,
      friends: 0
    };
  }
}
