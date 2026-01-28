import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetRelationListRspProto } from '../../../../../shared/proto/packets/rsp/friend/GetRelationListRspProto';

/**
 * 获取好友关系列表响应包
 * CMD 2150: GET_RELATION_LIST
 */
export class PacketGetRelationList extends BaseProto {
  private _data: Buffer;

  constructor(friendList: number[], blackList: number[], result: number = 0) {
    super(CommandID.GET_RELATION_LIST);

    const proto = new GetRelationListRspProto(friendList, blackList);
    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
