import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoOpenRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoOpenRspProto';

/**
 * 开启NoNo响应包
 * CMD 9001
 * 
 * 客户端期望：
 * - status == 0: 已经有NoNo
 * - status != 0: 成功获得NoNo
 */
export class PacketNoNoOpen extends BaseProto {
  private _data: Buffer;

  constructor(status: number = 1, result: number = 0) {
    super(CommandID.NONO_OPEN);
    this.setResult(result);
    
    const proto = new NoNoOpenRspProto();
    proto.status = status;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
