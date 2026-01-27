import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SystemTimeRspProto } from '../../../../../shared/proto/packets/rsp/system/SystemTimeRspProto';

/**
 * 系统时间响应包
 * CMD 1002
 */
export class PacketSystemTime extends BaseProto {
  private _data: Buffer;

  constructor(timestamp: number, num: number = 0) {
    super(CommandID.SYSTEM_TIME);
    const proto = new SystemTimeRspProto();
    proto.timestamp = timestamp;
    proto.num = num;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
