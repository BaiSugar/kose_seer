import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetSoulBeadListRspProto } from '../../../../../shared/proto/packets/rsp/soulbead/GetSoulBeadListRspProto';

/**
 * 获取魂珠列表响应包
 * CMD 2354: GET_SOUL_BEAD_List
 */
export class PacketGetSoulBeadList extends BaseProto {
  private _data: Buffer;

  constructor(soulBeadList: any[], result: number = 0) {
    super(CommandID.GET_SOUL_BEAD_List);

    const proto = new GetSoulBeadListRspProto(soulBeadList);
    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
