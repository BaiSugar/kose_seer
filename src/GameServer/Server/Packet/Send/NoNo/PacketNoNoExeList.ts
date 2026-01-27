import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoExeListRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoExeListRspProto';

/**
 * NoNo 执行列表响应包
 * CMD 9015
 */
export class PacketNoNoExeList extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.NONO_EXE_LIST);
    const proto = new NoNoExeListRspProto();
    proto.count = 0;  // 空列表
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
