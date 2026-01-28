import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BlackAddRspProto } from '../../../../../shared/proto/packets/rsp/friend/BlackAddRspProto';

/**
 * 添加黑名单响应包
 * CMD 2154
 */
export class PacketBlackAdd extends BaseProto {
  private _data: Buffer;

  constructor(result: number = 0) {
    super(CommandID.BLACK_ADD);
    
    const proto = new BlackAddRspProto();
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
