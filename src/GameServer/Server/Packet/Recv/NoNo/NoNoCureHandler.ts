import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9007 NONO_CURE] NoNo 治疗
 * 简单逻辑：恢复 NoNo 的体力和心情
 */
@Opcode(CommandID.NONO_CURE, InjectType.NONE)
export class NoNoCureHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoCure();
  }
}
