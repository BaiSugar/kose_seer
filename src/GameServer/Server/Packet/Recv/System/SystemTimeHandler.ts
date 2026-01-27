import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketSystemTime } from '../../Send/System/PacketSystemTime';

/**
 * [CMD: 1002 SYSTEM_TIME] 获取系统时间
 * 简单逻辑，直接在 Handler 中处理
 */
@Opcode(CommandID.SYSTEM_TIME, InjectType.NONE)
export class SystemTimeHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const timestamp = Math.floor(Date.now() / 1000);
    await player.SendPacket(new PacketSystemTime(timestamp));
  }
}

