import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵
 */
@Opcode(CommandID.CATCH_MONSTER, InjectType.NONE)
export class CatchMonsterHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.BattleManager.HandleCatchMonster();
  }
}
