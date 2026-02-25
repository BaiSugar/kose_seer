import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { LoadPercentReqProto } from '../../../../../shared/proto/packets/req/map/LoadPercentReqProto';
import { PacketLoadPercent } from '../../Send/Map/PacketLoadPercent';
import { PvpBattleManager } from '../../../../Game/Battle/PvpBattleManager';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2441 LOAD_PERCENT] 客户端加载进度
 * 客户端定期发送加载进度，服务器返回对方（BOSS/其他玩家）的加载进度
 * 
 * 场景：
 * 1. PVE战斗（打BOSS）：返回BOSS的加载进度（固定100%）
 * 2. PVP战斗（玩家对战）：广播玩家的加载进度给对方，并返回对方的加载进度
 */
@Opcode(CommandID.LOAD_PERCENT, InjectType.NONE)
export class LoadPercentHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 反序列化请求
    const req = LoadPercentReqProto.fromBuffer(body);

    // 检查是否在PVP战斗房间中
    const pvpRoom = PvpBattleManager.Instance.GetPlayerRoom(player.Uid);

    if (pvpRoom) {
      // PVP战斗：记录当前玩家的加载进度
      PvpBattleManager.Instance.SetPlayerLoadPercent(player.Uid, req.percent);

      // 获取对方玩家ID和加载进度
      const opponentId = pvpRoom.player1Id === player.Uid ? pvpRoom.player2Id : pvpRoom.player1Id;
      const opponentPercent = PvpBattleManager.Instance.GetOpponentLoadPercent(player.Uid);
      const opponentSession = OnlineTracker.Instance.GetPlayerSession(opponentId);

      if (opponentSession?.Player) {
        // 广播当前玩家的加载进度给对方
        await opponentSession.Player.SendPacket(new PacketLoadPercent(player.Uid, req.percent));
        Logger.Debug(`[LoadPercentHandler] PVP广播加载进度: ${player.Uid} -> ${opponentId}, percent=${req.percent}`);
      }

      // 返回对方的实际加载进度
      await player.SendPacket(new PacketLoadPercent(opponentId, opponentPercent));
    } else {
      // PVE战斗（打BOSS）：返回BOSS的加载进度（假设BOSS立即加载完成）
      await player.SendPacket(new PacketLoadPercent(0, 100));
    }
  }
}
