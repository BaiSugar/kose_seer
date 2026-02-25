import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应
 */
export class LoadPercentRspProto extends BaseProto {
  id: number;       // 对方的ID（BOSS使用0，PVP使用对方玩家ID）
  percent: number;  // 对方的加载进度（0-100）

  constructor(id: number = 0, percent: number = 0) {
    super(CommandID.LOAD_PERCENT);
    this.id = id;
    this.percent = percent;
  }

  serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(this.id, 0);
    buffer.writeUInt32BE(this.percent, 4);
    return buffer;
  }

  // 链式调用辅助方法
  setData(id: number, percent: number): this {
    this.id = id;
    this.percent = percent;
    return this;
  }
}
