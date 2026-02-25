import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { LoadPercentRspProto } from '../../../../../shared/proto/packets/rsp/map/LoadPercentRspProto';

/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应包
 */
export class PacketLoadPercent extends BaseProto {
  private _data: Buffer;

  constructor(id: number, percent: number) {
    super(CommandID.LOAD_PERCENT);
    
    const proto = new LoadPercentRspProto(id, percent);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
