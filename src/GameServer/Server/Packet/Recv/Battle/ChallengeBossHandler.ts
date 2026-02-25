import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChallengeBossReqProto } from '../../../../../shared/proto/packets/req/battle/ChallengeBossReqProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS
 * 
 * 客户端发送param2，服务器结合玩家当前地图ID查找BOSS
 * 逻辑与 go-server handleChallengeBoss 保持一致
 */
@Opcode(CommandID.CHALLENGE_BOSS, InjectType.NONE)
export class ChallengeBossHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      return;
    }

    // 解析请求
    const req = new ChallengeBossReqProto();
    if (body.length > 0) {
      req.deserialize(body);
    }

    // 获取玩家当前地图ID
    let mapId = player.Data.mapID || 1;
    if (mapId === 0) {
      mapId = 1;
    }

    const param2 = req.bossId; // 客户端发送的是param2，字段名保持bossId向后兼容

    Logger.Info(
      `[ChallengeBossHandler] 收到挑战BOSS请求: UserID=${player.Uid}, ` +
      `MapID=${mapId}, Param2=${param2}, BodyLen=${body.length}`
    );

    // 调用 BattleManager 处理
    await player.BattleManager.HandleChallengeBoss(mapId, param2);
  }
}
