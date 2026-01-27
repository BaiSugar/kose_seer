import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9012 NONO_CHANGE_COLOR] 修改NoNo颜色
 */
@Opcode(CommandID.NONO_CHANGE_COLOR, InjectType.NONE)
export class NoNoChangeColorHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoChangeColor();
  }
}

