import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChallengeBossReqProto } from '../../../../../shared/proto/packets/req/battle/ChallengeBossReqProto';

/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS
 */
@Opcode(CommandID.CHALLENGE_BOSS, InjectType.NONE)
export class ChallengeBossHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = ChallengeBossReqProto.fromBuffer(body);
    await player.BattleManager.HandleChallengeBoss(req.bossId || 13); // 默认比比鼠
  }
}
