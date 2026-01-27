import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9013 NONO_PLAY] NoNo 玩耍
 * 简单逻辑：增加 NoNo 的心情值
 */
@Opcode(CommandID.NONO_PLAY, InjectType.NONE)
export class NoNoPlayHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoPlay();
  }
}
