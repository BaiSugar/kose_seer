import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9008 NONO_EXPADM] NoNo经验管理
 */
@Opcode(CommandID.NONO_EXPADM, InjectType.NONE)
export class NoNoExpadmHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoExpadm();
  }
}
