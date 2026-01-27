import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 2404 READY_TO_FIGHT] 准备战斗
 */
@Opcode(CommandID.READY_TO_FIGHT, InjectType.NONE)
export class ReadyToFightHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.BattleManager.HandleReadyToFight();
  }
}
