import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取任务缓存响应
 * CMD 2203: GET_TASK_BUF
 * 
 * 响应格式：taskId(4) + flag(4) + buf[0..4] (5个4字节 = 20字节缓存)
 */
export class GetTaskBufRspProto extends BaseProto {
  public taskId: number = 0;
  public flag: number = 1;  // 1 表示有缓存数据
  public buffers: number[] = [0, 0, 0, 0, 0];  // 5个缓存值

  constructor() {
    super(CommandID.GET_TASK_BUF);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(28); // taskId(4) + flag(4) + 5*4(20)

    let offset = 0;
    buffer.writeUInt32BE(this.taskId, offset);
    offset += 4;
    buffer.writeUInt32BE(this.flag, offset);
    offset += 4;

    for (let i = 0; i < 5; i++) {
      buffer.writeUInt32BE(this.buffers[i] || 0, offset);
      offset += 4;
    }

    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 8) {
      this.flag = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 28) {
      this.buffers = [];
      for (let i = 0; i < 5; i++) {
        this.buffers.push(buffer.readUInt32BE(offset));
        offset += 4;
      }
    }
  }

  public setTaskId(taskId: number): this {
    this.taskId = taskId;
    return this;
  }

  public setBuffers(buffers: number[]): this {
    this.buffers = buffers.slice(0, 5);
    while (this.buffers.length < 5) {
      this.buffers.push(0);
    }
    return this;
  }
}
