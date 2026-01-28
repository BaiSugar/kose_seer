import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加/更新任务缓存响应
 * CMD 2204: ADD_TASK_BUF
 * 
 * 响应格式：空（成功时）
 */
export class AddTaskBufRspProto extends BaseProto {
  constructor() {
    super(CommandID.ADD_TASK_BUF);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }

  public deserialize(buffer: Buffer): void {
    // 空响应
  }
}
