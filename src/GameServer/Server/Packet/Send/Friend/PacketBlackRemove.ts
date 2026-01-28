import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BlackRemoveRspProto } from '../../../../../shared/proto/packets/rsp/friend/BlackRemoveRspProto';

/**
 * 移除黑名单响应包
 * CMD 2155
 */
export class PacketBlackRemove extends BaseProto {
  private _data: Buffer;

  constructor(result: number = 0) {
    super(CommandID.BLACK_REMOVE);
    
    const proto = new BlackRemoveRspProto();
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
