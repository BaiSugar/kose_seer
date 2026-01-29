import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家响应
 * 
 * 客户端解析（FollowCmdListener.as）：
 * - userId (4)
 * - superStage (4) - flag字段，客户端读取为superStage
 * - state (4) - boolean，跟随状态
 * - 如果跟随：
 *   - nick (16)
 *   - color (4)
 *   - power (4) - 体力值（需要*1000）
 * 
 * 注意：客户端不读取 result 字段！直接从 userId 开始读取
 */
export class NoNoFollowOrHoomRspProto extends BaseProto {
  userId: number = 0;
  superStage: number = 0;  // flag字段，客户端读取为superStage
  state: number = 0;       // 跟随状态（0=回家, 1=跟随）
  nick: string = '';       // 仅跟随时返回
  color: number = 0;       // 仅跟随时返回
  power: number = 0;       // 仅跟随时返回（体力值）
  isFollow: boolean = false; // 是否跟随

  constructor() {
    super(CommandID.NONO_FOLLOW_OR_HOOM);
  }

  serialize(): Buffer {
    if (this.isFollow) {
      // 跟随: userId(4) + superStage(4) + state(4) + nick(16) + color(4) + power(4) = 36 bytes
      // 注意：客户端不读取 result 字段，直接从 userId 开始读取
      const writer = new BufferWriter(64);
      writer.WriteUInt32(this.userId);
      writer.WriteUInt32(this.superStage);
      writer.WriteUInt32(this.state);
      writer.WriteBytes(this.buildString(this.nick, 16));
      writer.WriteUInt32(this.color);
      writer.WriteUInt32(this.power);
      return writer.ToBuffer();
    } else {
      // 回家: userId(4) + superStage(4) + state(4) = 12 bytes
      // 注意：客户端不读取 result 字段，直接从 userId 开始读取
      const writer = new BufferWriter(32);
      writer.WriteUInt32(this.userId);
      writer.WriteUInt32(this.superStage);
      writer.WriteUInt32(this.state);
      return writer.ToBuffer();
    }
  }

  // 链式调用辅助方法
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setSuperStage(value: number): this {
    this.superStage = value;
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

  setPower(value: number): this {
    this.power = value;
    return this;
  }

  setIsFollow(value: boolean): this {
    this.isFollow = value;
    return this;
  }
}
