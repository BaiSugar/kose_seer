import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';

/**
 * [CMD: 9014 NONO_CLOSE_OPEN] NoNo 开启/关闭
 * 简单逻辑：空响应
 */
@Opcode(CommandID.NONO_CLOSE_OPEN, InjectType.NONE)
export class NoNoCloseOpenHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 简单的空响应
    await player.SendPacket(new PacketEmpty(CommandID.NONO_CLOSE_OPEN));
  }
}
