import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BlackListRspProto, IBlackInfo } from '../../../../../shared/proto/packets/rsp/friend/BlackListRspProto';

/**
 * 黑名单列表响应包
 * CMD 2159
 */
export class PacketBlackList extends BaseProto {
  private _data: Buffer;

  constructor(blackList: IBlackInfo[], result: number = 0) {
    super(CommandID.BLACK_LIST);
    
    const proto = new BlackListRspProto();
    proto.blackList = blackList;
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
