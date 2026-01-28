import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
import { IClientSession } from '../../Server/Packet/IHandler';
import { CommendOnlineRspProto, RangeOnlineRspProto } from '../../../shared/proto';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { Logger } from '../../../shared/utils';

/**
 * 服务器管理器
 * 负责管理服务器列表，后续可接入数据库或配置中心
 */
export class ServerManager {
  private _servers: IServerInfo[] = [];
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
    
    // 添加默认服务器（当前服务器）
    this.AddServer({
      onlineID: 1,
      userCnt: 0,
      ip: '127.0.0.1',
      port: 9999,
      friends: 1
    });
  }

  /**
   * 添加服务器
   */
  public AddServer(server: IServerInfo): void {
    this._servers.push(server);
  }

  /**
   * 移除服务器
   */
  public RemoveServer(onlineID: number): void {
    this._servers = this._servers.filter(s => s.onlineID !== onlineID);
  }

  /**
   * 更新服务器在线人数
   */
  public UpdateUserCount(onlineID: number, userCnt: number): void {
    const server = this._servers.find(s => s.onlineID === onlineID);
    if (server) {
      server.userCnt = userCnt;
    }
  }

  /**
   * 获取所有服务器
   */
  public GetServers(): IServerInfo[] {
    return [...this._servers];
  }

  /**
   * 构建服务器列表Proto数据
   */
  private buildServerList() {
    return this._servers.map(s => ({
      onlineID: s.onlineID,
      userCnt: s.userCnt,
      ip: s.ip,
      port: s.port,
      friends: s.friends
    }));
  }

  /**
   * 处理推荐服务器列表请求
   */
  public async HandleCommendOnline(session: IClientSession, userID: number): Promise<void> {
    const proto = new CommendOnlineRspProto();
    proto.maxOnlineID = this._servers.length > 0 ? Math.max(...this._servers.map(s => s.onlineID)) : 1;
    proto.isVIP = 0;
    proto.onlineCnt = this._servers.length;
    proto.servers = this.buildServerList();
    
    Logger.Info(`[ServerManager] 构建服务器列表: count=${proto.onlineCnt}`);
    
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
    const proto = new RangeOnlineRspProto();
    proto.onlineCnt = this._servers.length;
    proto.servers = this.buildServerList();

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
