import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9004 NONO_CHIP_MIXTURE] NoNo芯片合成
 */
@Opcode(CommandID.NONO_CHIP_MIXTURE, InjectType.NONE)
export class NoNoChipMixtureHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoChipMixture();
  }
}
