import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { CompleteTaskReqProto } from '../../../../../shared/proto/packets/req/task/CompleteTaskReqProto';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 完成任务处理器
 * CMD 2202: COMPLETE_TASK
 */
@Opcode(CommandID.COMPLETE_TASK, InjectType.NONE)
export class CompleteTaskHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new CompleteTaskReqProto();
    req.deserialize(body);

    try {
      // 调用 Manager 处理业务逻辑
      await player.TaskManager.CompleteTask(req.taskId, req.param);
    } catch (error) {
      Logger.Error(`[CompleteTaskHandler] 失败: taskId=${req.taskId}`, error as Error);
    }
  }
}
