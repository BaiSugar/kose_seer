import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetExchangeInfoRspProto } from '../../../../../shared/proto/packets/rsp/exchange/GetExchangeInfoRspProto';

/**
 * 获取兑换信息响应包
 * CMD 70001: GET_EXCHANGE_INFO
 */
export class PacketGetExchangeInfo extends BaseProto {
  private _data: Buffer;

  constructor(honorValue: number, result: number = 0) {
    super(CommandID.GET_EXCHANGE_INFO);

    const proto = new GetExchangeInfoRspProto(honorValue);
    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
