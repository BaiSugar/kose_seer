import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../shared/protocol/CommandID';
import { CommendOnlineRspProto, RangeOnlineRspProto } from '../../../../shared/proto';
import { ClientConfig, IServerBaseInfo } from '../../../../shared/config/ClientConfig';

/**
 * 完整服务器信息接口（包含动态数据）
 */
export interface IServerInfo {
  onlineID: number;   // 服务器ID
  userCnt: number;    // 在线人数（动态）
  ip: string;         // 服务器IP
  port: number;       // 服务器端口
  friends: number;    // 好友数量（动态）
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
   * @param userID 用户ID
   * @param onlineCount 当前在线人数（实时）
   * @param friendsCount 好友在线数（实时）
   */
  public CommendOnline(userID: number, onlineCount: number = 0, friendsCount: number = 0): Buffer {
    // 从配置获取服务器基础信息
    const baseServers = ClientConfig.Instance.Servers;
    
    // 构建完整服务器信息（添加动态数据）
    const servers: IServerInfo[] = baseServers.map(base => ({
      onlineID: base.onlineID,
      userCnt: onlineCount,  // 实时在线人数
      ip: base.ip,
      port: base.port,
      friends: friendsCount  // 实时好友数
    }));

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
   * @param userID 用户ID
   * @param onlineCount 当前在线人数（实时）
   * @param friendsCount 好友在线数（实时）
   */
  public RangeOnline(userID: number, onlineCount: number = 0, friendsCount: number = 0): Buffer {
    // 从配置获取服务器基础信息
    const baseServers = ClientConfig.Instance.Servers;
    
    // 构建完整服务器信息（添加动态数据）
    const servers: IServerInfo[] = baseServers.map(base => ({
      onlineID: base.onlineID,
      userCnt: onlineCount,  // 实时在线人数
      ip: base.ip,
      port: base.port,
      friends: friendsCount  // 实时好友数
    }));

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
}
