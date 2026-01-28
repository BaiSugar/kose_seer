import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加/更新任务缓存请求
 * CMD 2204: ADD_TASK_BUF
 * 
 * 请求格式：taskId(4) + index(1) + value(4)
 */
export class AddTaskBufReqProto extends BaseProto {
  public taskId: number = 0;
  public bufferIndex: number = 0;
  public bufferValue: number = 0;

  constructor() {
    super(CommandID.ADD_TASK_BUF);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 5) {
      this.bufferIndex = buffer.readUInt8(offset);
      offset += 1;
    }
    if (buffer.length >= 9) {
      this.bufferValue = buffer.readUInt32BE(offset);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
