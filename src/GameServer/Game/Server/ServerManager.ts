import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
import { IClientSession } from '../../Server/Packet/IHandler';
import { CommendOnlineRspProto, RangeOnlineRspProto } from '../../../shared/proto';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { ClientConfig } from '../../../shared/config/ClientConfig';
import { Logger } from '../../../shared/utils';

/**
 * 服务器管理器
 * 负责管理服务器列表和在线状态
 */
export class ServerManager {
  private _packetBuilder: PacketBuilder;
  private _onlineUsers: Set<number> = new Set();  // 在线用户集合

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 用户上线
   */
  public UserOnline(userID: number): void {
    this._onlineUsers.add(userID);
    Logger.Debug(`[ServerManager] 用户上线: ${userID}, 当前在线: ${this._onlineUsers.size}`);
  }

  /**
   * 用户下线
   */
  public UserOffline(userID: number): void {
    this._onlineUsers.delete(userID);
    Logger.Debug(`[ServerManager] 用户下线: ${userID}, 当前在线: ${this._onlineUsers.size}`);
  }

  /**
   * 获取在线人数
   */
  public GetOnlineCount(): number {
    return this._onlineUsers.size;
  }

  /**
   * 获取用户的在线好友数
   */
  private async GetOnlineFriendsCount(userID: number): Promise<number> {
    try {
      const friendData = await DatabaseHelper.Instance.GetInstance_FriendData(userID);
      if (!friendData) return 0;

      // 统计在线好友数
      let count = 0;
      for (const friendID of friendData.FriendList) {
        if (this._onlineUsers.has(friendID)) {
          count++;
        }
      }
      return count;
    } catch (err) {
      Logger.Error(`[ServerManager] 获取在线好友数失败: uid=${userID}`, err as Error);
      return 0;
    }
  }

  /**
   * 构建服务器列表（包含实时数据）
   */
  private async buildServerList(userID: number): Promise<IServerInfo[]> {
    const baseServers = ClientConfig.Instance.Servers;
    const onlineCount = this.GetOnlineCount();
    const friendsCount = await this.GetOnlineFriendsCount(userID);

    return baseServers.map(base => ({
      onlineID: base.onlineID,
      userCnt: onlineCount,      // 实时在线人数
      ip: base.ip,
      port: base.port,
      friends: friendsCount      // 实时在线好友数
    }));
  }

  /**
   * 处理推荐服务器列表请求
   */
  public async HandleCommendOnline(session: IClientSession, userID: number): Promise<void> {
    const servers = await this.buildServerList(userID);
    
    const proto = new CommendOnlineRspProto();
    proto.maxOnlineID = servers.length > 0 ? Math.max(...servers.map(s => s.onlineID)) : 1;
    proto.isVIP = 0;
    proto.onlineCnt = servers.length;
    proto.servers = servers.map(s => ({
      onlineID: s.onlineID,
      userCnt: s.userCnt,
      ip: s.ip,
      port: s.port,
      friends: s.friends
    }));
    
    Logger.Info(`[ServerManager] 构建服务器列表: count=${proto.onlineCnt}, online=${servers[0]?.userCnt || 0}, friends=${servers[0]?.friends || 0}`);
    
    // 加载好友列表和黑名单
    try {
      const friendData = await DatabaseHelper.Instance.GetInstance_FriendData(userID);
      if (friendData) {
        // 构建好友信息（timePoke 暂时设为 0）
        proto.friends = friendData.FriendList.map(uid => ({
          userID: uid,
          timePoke: 0
        }));
        proto.blacklist = friendData.BlackList;
        Logger.Info(`[ServerManager] 加载好友数据: friends=${proto.friends.length}, blacklist=${proto.blacklist.length}`);
      } else {
        proto.friends = [];
        proto.blacklist = [];
        Logger.Info(`[ServerManager] 无好友数据，使用空列表`);
      }
    } catch (err) {
      Logger.Error(`[ServerManager] 加载好友数据失败: uid=${userID}`, err as Error);
      proto.friends = [];
      proto.blacklist = [];
    }

    const bodyData = proto.serialize();
    Logger.Info(`[ServerManager] 响应体大小: ${bodyData.length} 字节`);

    // 使用 PacketBuilder 构建完整数据包
    const packet = this._packetBuilder.Build(
      proto.getCmdId(),
      userID,
      proto.getResult(),
      bodyData
    );
    session.Socket.write(packet);
  }

  /**
   * 处理范围服务器查询请求
   */
  public async HandleRangeOnline(session: IClientSession, userID: number): Promise<void> {
    const servers = await this.buildServerList(userID);
    
    const proto = new RangeOnlineRspProto();
    proto.onlineCnt = servers.length;
    proto.servers = servers.map(s => ({
      onlineID: s.onlineID,
      userCnt: s.userCnt,
      ip: s.ip,
      port: s.port,
      friends: s.friends
    }));

    // 使用 PacketBuilder 构建完整数据包
    const packet = this._packetBuilder.Build(
      proto.getCmdId(),
      userID,
      proto.getResult(),
      proto.serialize()
    );
    session.Socket.write(packet);
  }
}

export { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
