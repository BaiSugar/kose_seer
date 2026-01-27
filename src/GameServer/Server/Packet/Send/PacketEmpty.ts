import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { EmptyRspProto } from '../../../../shared/proto/packets/rsp/EmptyRspProto';

/**
 * 通用空响应包
 * 用于只返回 result 的简单命令
 */
export class PacketEmpty extends BaseProto {
  private _data: Buffer;

  constructor(cmdId: number) {
    super(cmdId);
    const proto = new EmptyRspProto(cmdId);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
