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
  public async Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    
    console.log(`[SystemTimeHandler] Handle called: UserID=${head.UserID}, Player=${player ? 'exists' : 'null'}`);
    
    if (!player) {
      console.log(`[SystemTimeHandler] Player is null, returning`);
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    console.log(`[SystemTimeHandler] Sending timestamp: ${timestamp}`);
    
    await player.SendPacket(new PacketSystemTime(timestamp));
    
    console.log(`[SystemTimeHandler] Packet sent`);
  }
}

