import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
import { IClientSession } from '../../Server/Packet/IHandler';
import { CommendOnlineRspProto, RangeOnlineRspProto } from '../../../shared/proto';

/**
 * 服务器管理器
 * 负责管理服务器列表，后续可接入数据库或配置中心
 */
export class ServerManager {
  private _servers: IServerInfo[] = [];

  constructor(packetBuilder: PacketBuilder) {
    // packetBuilder保留用于未来扩展
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
      id: s.onlineID,
      name: `${s.ip}:${s.port}`,
      online: s.userCnt,
      status: 0
    }));
  }

  /**
   * 处理推荐服务器列表请求
   */
  public async HandleCommendOnline(session: IClientSession, userID: number): Promise<void> {
    const proto = new CommendOnlineRspProto();
    proto.maxOnlineID = this._servers.length > 0 ? Math.max(...this._servers.map(s => s.onlineID)) : 0;
    proto.isVIP = 0;
    proto.onlineCnt = this._servers.length;
    proto.servers = this.buildServerList();

    // 一行发包
    await session.Player!.SendPacket(proto);
  }

  /**
   * 处理范围服务器查询请求
   */
  public async HandleRangeOnline(session: IClientSession, userID: number): Promise<void> {
    const proto = new RangeOnlineRspProto();
    proto.onlineCnt = this._servers.length;
    proto.servers = this.buildServerList();

    // 一行发包
    await session.Player!.SendPacket(proto);
  }
}

export { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
