import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AcceptTaskReqProto } from '../../../../../shared/proto/packets/req/task/AcceptTaskReqProto';
import { PacketAcceptTask } from '../../../Packet/Send/Task/PacketAcceptTask';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 接受任务处理器
 * CMD 2201: ACCEPT_TASK
 */
@Opcode(CommandID.ACCEPT_TASK, InjectType.NONE)
export class AcceptTaskHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new AcceptTaskReqProto();
    req.deserialize(body);

    const taskId = req.taskId;

    try {
      Logger.Info(`[AcceptTaskHandler] 用户 ${player.Uid} 接受任务 ${taskId}`);

      // 检查是否已接受
      if (player.TaskManager.TaskData.IsTaskAccepted(taskId)) {
        Logger.Warn(`[AcceptTaskHandler] 任务 ${taskId} 已接受`);
        await player.SendPacket(new PacketAcceptTask(taskId, 5002));
        return;
      }

      // 接受任务（调用 Manager 业务逻辑）
      await player.TaskManager.AcceptTask(taskId);

      // 发送响应
      await player.SendPacket(new PacketAcceptTask(taskId));
      Logger.Info(`[AcceptTaskHandler] 用户 ${player.Uid} 接受任务 ${taskId} 成功`);
    } catch (error) {
      Logger.Error(`[AcceptTaskHandler] 失败: taskId=${taskId}`, error as Error);
      await player.SendPacket(new PacketAcceptTask(taskId, 5000));
    }
  }
}
