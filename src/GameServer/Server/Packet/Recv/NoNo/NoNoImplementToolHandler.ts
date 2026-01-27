import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9010 NONO_IMPLEMENT_TOOL] NoNo使用工具
 */
@Opcode(CommandID.NONO_IMPLEMENT_TOOL, InjectType.NONE)
export class NoNoImplementToolHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoImplementTool();
  }
}
