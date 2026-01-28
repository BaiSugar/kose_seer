import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 接受任务请求
 * CMD 2201: ACCEPT_TASK
 */
export class AcceptTaskReqProto extends BaseProto {
  public taskId: number = 0;

  constructor() {
    super(CommandID.ACCEPT_TASK);
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
