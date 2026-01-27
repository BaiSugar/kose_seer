import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketNoNoExeList } from '../../Send/NoNo/PacketNoNoExeList';

/**
 * [CMD: 9015 NONO_EXE_LIST] NoNo 执行列表
 * 简单逻辑：返回空列表
 */
@Opcode(CommandID.NONO_EXE_LIST, InjectType.NONE)
export class NoNoExeListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 返回空列表
    await player.SendPacket(new PacketNoNoExeList());
  }
}
