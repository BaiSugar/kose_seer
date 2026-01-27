import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9027 NONO_IS_INFO] 查询是否有NoNo
 */
@Opcode(CommandID.NONO_IS_INFO, InjectType.NONE)
export class NoNoIsInfoHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoIsInfo();
  }
}
