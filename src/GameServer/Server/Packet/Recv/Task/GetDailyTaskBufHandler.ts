import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGetDailyTaskBuf } from '../../../Packet/Send/Task/PacketGetDailyTaskBuf';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 获取每日任务缓存处理器
 * CMD 2234: GET_DAILY_TASK_BUF
 */
@Opcode(CommandID.GET_DAILY_TASK_BUF, InjectType.NONE)
export class GetDailyTaskBufHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      Logger.Debug(`[GetDailyTaskBufHandler] 用户 ${player.Uid} 获取每日任务缓存`);

      // 暂时返回空数据
      await player.SendPacket(new PacketGetDailyTaskBuf());
      Logger.Debug(`[GetDailyTaskBufHandler] 发送每日任务缓存成功`);
    } catch (error) {
      Logger.Error(`[GetDailyTaskBufHandler] 失败`, error as Error);
      await player.SendPacket(new PacketGetDailyTaskBuf());
    }
  }
}
