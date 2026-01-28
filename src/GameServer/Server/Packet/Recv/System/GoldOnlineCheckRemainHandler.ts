import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGoldOnlineCheckRemain } from '../../Send/System/PacketGoldOnlineCheckRemain';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额
 * 
 * 请求：无参数
 * 响应：gold (4 bytes)
 */
@Opcode(CommandID.GOLD_ONLINE_CHECK_REMAIN, InjectType.NONE)
export class GoldOnlineCheckRemainHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 获取玩家金币余额
    const gold = player.Data.coins;

    // 发送响应
    await player.SendPacket(new PacketGoldOnlineCheckRemain(gold));
  }
}
