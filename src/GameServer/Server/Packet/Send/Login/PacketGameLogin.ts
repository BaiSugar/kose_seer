import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { IPlayerInfo, PlayerInfoToLoginProto } from '../../../../../shared/models';
import { LoginRspProto } from '../../../../../shared/proto';

/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应数据包
 */
export class PacketGameLogin {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建游戏登录响应
   * @param userID 用户ID
   * @param result 结果码 (0=成功)
   * @param player 玩家数据 (成功时需要)
   * @param sessionKey 会话标识
   */
  public Build(userID: number, result: number = 0, player?: IPlayerInfo, sessionKey?: string): Buffer {
    // 失败时返回空 body
    if (result !== 0 || !player) {
      return this._packetBuilder.Build(
        CommandID.LOGIN_IN,
        userID,
        result,
        Buffer.alloc(0)
      );
    }

    const proto = this.BuildProto(player, sessionKey);
    return this._packetBuilder.Build(
      CommandID.LOGIN_IN,
      userID,
      result,
      proto.serialize()
    );
  }

  /**
   * 构建游戏登录Proto（供Player.SendPacket使用）
   */
  public BuildProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto {
    return PlayerInfoToLoginProto(player, sessionKey);
  }
}
