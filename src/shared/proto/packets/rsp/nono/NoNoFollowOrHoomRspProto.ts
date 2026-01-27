import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家响应
 * 
 * action=1 (跟随): 返回完整 NoNo 信息 (36 bytes)
 * action=0 (回家): 返回简单信息 (12 bytes)
 */
export class NoNoFollowOrHoomRspProto extends BaseProto {
  userId: number = 0;
  flag: number = 0;
  state: number = 0;
  nick: string = '';        // 仅跟随时返回
  color: number = 0;        // 仅跟随时返回
  chargeTime: number = 0;   // 仅跟随时返回
  isFollow: boolean = false; // 是否跟随

  constructor() {
    super(CommandID.NONO_FOLLOW_OR_HOOM);
  }

  serialize(): Buffer {
    if (this.isFollow) {
      // 跟随: 36 bytes
      const writer = new BufferWriter(64);
      writer.WriteUInt32(this.result);
      writer.WriteUInt32(this.userId);
      writer.WriteUInt32(this.flag);
      writer.WriteUInt32(this.state);
      writer.WriteBytes(this.buildString(this.nick, 16));
      writer.WriteUInt32(this.color);
      writer.WriteUInt32(this.chargeTime);
      return writer.ToBuffer();
    } else {
      // 回家: 12 bytes
      const writer = new BufferWriter(32);
      writer.WriteUInt32(this.result);
      writer.WriteUInt32(this.userId);
      writer.WriteUInt32(this.flag);
      writer.WriteUInt32(this.state);
      return writer.ToBuffer();
    }
  }

  // 链式调用辅助方法
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setFlag(value: number): this {
    this.flag = value;
    return this;
  }

  setState(value: number): this {
    this.state = value;
    return this;
  }

  setNick(value: string): this {
    this.nick = value;
    return this;
  }

  setColor(value: number): this {
    this.color = value;
    return this;
  }

  setChargeTime(value: number): this {
    this.chargeTime = value;
    return this;
  }

  setIsFollow(value: boolean): this {
    this.isFollow = value;
    return this;
  }
}
