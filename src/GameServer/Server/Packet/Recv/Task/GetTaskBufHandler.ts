import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetTaskBufReqProto } from '../../../../../shared/proto/packets/req/task/GetTaskBufReqProto';
import { PacketGetTaskBuf } from '../../../Packet/Send/Task/PacketGetTaskBuf';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 获取任务缓存处理器
 * CMD 2203: GET_TASK_BUF
 */
@Opcode(CommandID.GET_TASK_BUF, InjectType.NONE)
export class GetTaskBufHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GetTaskBufReqProto();
    req.deserialize(body);

    const taskId = req.taskId;

    try {
      Logger.Debug(`[GetTaskBufHandler] 用户 ${player.Uid} 获取任务 ${taskId} 的缓存`);

      // 获取任务缓存（调用 Manager 方法）
      const bufferValues = player.TaskManager.GetTaskBuffer(taskId);

      // 发送响应
      await player.SendPacket(new PacketGetTaskBuf(taskId, bufferValues));
      Logger.Debug(`[GetTaskBufHandler] 发送任务 ${taskId} 的缓存成功`);
    } catch (error) {
      Logger.Error(`[GetTaskBufHandler] 失败: taskId=${taskId}`, error as Error);
      await player.SendPacket(new PacketGetTaskBuf(taskId, [0, 0, 0, 0, 0]));
    }
  }
}
