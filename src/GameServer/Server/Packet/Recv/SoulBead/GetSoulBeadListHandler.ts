import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGetSoulBeadList } from '../../../Packet/Send/SoulBead/PacketGetSoulBeadList';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2354 GET_SOUL_BEAD_List] 获取魂珠列表
 * 暂时返回空列表
 */
@Opcode(CommandID.GET_SOUL_BEAD_List, InjectType.NONE)
export class GetSoulBeadListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      Logger.Debug(`[GetSoulBeadListHandler] 用户 ${player.Uid} 请求魂珠列表`);

      // 暂时返回空列表
      await player.SendPacket(new PacketGetSoulBeadList([]));
    } catch (error) {
      Logger.Error(`[GetSoulBeadListHandler] 失败`, error as Error);
      await player.SendPacket(new PacketGetSoulBeadList([]).setResult(5000));
    }
  }
}
