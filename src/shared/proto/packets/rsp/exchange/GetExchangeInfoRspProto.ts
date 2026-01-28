import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取兑换信息响应
 * CMD 70001: GET_EXCHANGE_INFO
 * 
 * 响应格式：
 * - honorValue (4 bytes): 荣誉值
 */
export class GetExchangeInfoRspProto extends BaseProto {
  private honorValue: number;

  constructor(honorValue: number = 0) {
    super(CommandID.GET_EXCHANGE_INFO);
    this.honorValue = honorValue;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.honorValue, 0);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.honorValue = buffer.readUInt32BE(0);
    }
  }
}
