import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SeeOnlineRspProto, IOnlineInfo } from '../../../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto';

/**
 * 查看在线状态响应包
 * CMD 2157
 */
export class PacketSeeOnline extends BaseProto {
  private _data: Buffer;

  constructor(onlineList: IOnlineInfo[], result: number = 0) {
    super(CommandID.SEE_ONLINE);
    
    const proto = new SeeOnlineRspProto();
    proto.onlineList = onlineList;
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
