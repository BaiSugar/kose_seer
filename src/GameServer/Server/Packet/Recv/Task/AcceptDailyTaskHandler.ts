import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AcceptDailyTaskReqProto } from '../../../../../shared/proto/packets/req/task/AcceptDailyTaskReqProto';
import { PacketAcceptDailyTask } from '../../../Packet/Send/Task/PacketAcceptDailyTask';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 接受每日任务处理器
 * CMD 2231: ACCEPT_DAILY_TASK
 * 
 * Lua端实现：emptyResponse(2231, 4)
 * 逻辑：接受每日任务，保存到用户数据，返回空响应
 */
@Opcode(CommandID.ACCEPT_DAILY_TASK, InjectType.NONE)
export class AcceptDailyTaskHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new AcceptDailyTaskReqProto();
    req.deserialize(body);

    const taskId = req.taskId;

    try {
      Logger.Info(`[AcceptDailyTaskHandler] 用户 ${player.Uid} 接受每日任务 ${taskId}`);

      // 检查是否已接受
      if (player.TaskManager.TaskData.IsTaskAccepted(taskId)) {
        Logger.Warn(`[AcceptDailyTaskHandler] 每日任务 ${taskId} 已接受`);
        await player.SendPacket(new PacketAcceptDailyTask(5002));
        return;
      }

      // 接受每日任务（使用相同的任务系统）
      await player.TaskManager.AcceptTask(taskId);

      // 发送空响应（与Lua端一致）
      await player.SendPacket(new PacketAcceptDailyTask());
      Logger.Info(`[AcceptDailyTaskHandler] 用户 ${player.Uid} 接受每日任务 ${taskId} 成功`);
    } catch (error) {
      Logger.Error(`[AcceptDailyTaskHandler] 失败: taskId=${taskId}`, error as Error);
      await player.SendPacket(new PacketAcceptDailyTask(5000));
    }
  }
}
