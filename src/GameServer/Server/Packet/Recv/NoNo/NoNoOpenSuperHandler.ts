import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';

/**
 * [CMD: 9020 NONO_OPEN_SUPER] 开启超级 NoNo
 * 简单逻辑：空响应
 */
@Opcode(CommandID.NONO_OPEN_SUPER, InjectType.NONE)
export class NoNoOpenSuperHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN_SUPER));
  }
}
