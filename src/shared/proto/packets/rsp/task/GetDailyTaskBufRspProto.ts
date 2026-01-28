import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取每日任务缓存响应
 * CMD 2234: GET_DAILY_TASK_BUF
 * 
 * 响应格式：value1(4) + value2(4)
 */
export class GetDailyTaskBufRspProto extends BaseProto {
  public value1: number = 0;
  public value2: number = 0;

  constructor() {
    super(CommandID.GET_DAILY_TASK_BUF);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(this.value1, 0);
    buffer.writeUInt32BE(this.value2, 4);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.value1 = buffer.readUInt32BE(0);
    }
    if (buffer.length >= 8) {
      this.value2 = buffer.readUInt32BE(4);
    }
  }
}
