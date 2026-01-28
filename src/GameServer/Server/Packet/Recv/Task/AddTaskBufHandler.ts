import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AddTaskBufReqProto } from '../../../../../shared/proto/packets/req/task/AddTaskBufReqProto';
import { PacketAddTaskBuf } from '../../../Packet/Send/Task/PacketAddTaskBuf';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 添加/更新任务缓存处理器
 * CMD 2204: ADD_TASK_BUF
 */
@Opcode(CommandID.ADD_TASK_BUF, InjectType.NONE)
export class AddTaskBufHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new AddTaskBufReqProto();
    req.deserialize(body);

    const taskId = req.taskId;
    const bufferIndex = req.bufferIndex;
    const bufferValue = req.bufferValue;

    try {
      Logger.Debug(`[AddTaskBufHandler] 用户 ${player.Uid} 更新任务缓存: task=${taskId}, index=${bufferIndex}, value=${bufferValue}`);

      // 验证索引范围
      if (bufferIndex < 0 || bufferIndex >= 5) {
        Logger.Warn(`[AddTaskBufHandler] 缓存索引无效: ${bufferIndex}`);
        await player.SendPacket(new PacketAddTaskBuf(5001));
        return;
      }

      // 设置缓存值（调用 Manager 业务逻辑）
      player.TaskManager.SetTaskBufferValue(taskId, bufferIndex, bufferValue);

      // 发送响应
      await player.SendPacket(new PacketAddTaskBuf());
      Logger.Debug(`[AddTaskBufHandler] 任务缓存更新成功`);
    } catch (error) {
      Logger.Error(`[AddTaskBufHandler] 失败: taskId=${taskId}`, error as Error);
      await player.SendPacket(new PacketAddTaskBuf(5000));
    }
  }
}
