import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取任务缓存请求
 * CMD 2203: GET_TASK_BUF
 */
export class GetTaskBufReqProto extends BaseProto {
  public taskId: number = 0;

  constructor() {
    super(CommandID.GET_TASK_BUF);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
