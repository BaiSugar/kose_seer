import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 2410 ESCAPE_FIGHT] 逃跑
 */
@Opcode(CommandID.ESCAPE_FIGHT, InjectType.NONE)
export class EscapeFightHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.BattleManager.HandleEscapeFight();
  }
}
