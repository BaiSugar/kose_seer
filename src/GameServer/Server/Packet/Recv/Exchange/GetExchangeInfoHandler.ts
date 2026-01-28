import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGetExchangeInfo } from '../../../Packet/Send/Exchange/PacketGetExchangeInfo';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 70001 GET_EXCHANGE_INFO] 获取兑换信息
 * 返回荣誉值
 */
@Opcode(CommandID.GET_EXCHANGE_INFO, InjectType.NONE)
export class GetExchangeInfoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      Logger.Debug(`[GetExchangeInfoHandler] 用户 ${player.Uid} 请求兑换信息`);

      // 暂时返回荣誉值为0
      const honorValue = 0;
      await player.SendPacket(new PacketGetExchangeInfo(honorValue));
    } catch (error) {
      Logger.Error(`[GetExchangeInfoHandler] 失败`, error as Error);
      await player.SendPacket(new PacketGetExchangeInfo(0).setResult(5000));
    }
  }
}
