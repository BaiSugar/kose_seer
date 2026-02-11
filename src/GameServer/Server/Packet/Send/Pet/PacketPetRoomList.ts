import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PetRoomListRspProto, IPetListInfo } from '../../../../../shared/proto/packets/rsp/pet/PetRoomListRspProto';

/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表响应包
 */
export class PacketPetRoomList extends BaseProto {
  private _data: Buffer;

  constructor(petList: IPetListInfo[]) {
    const proto = new PetRoomListRspProto();
    super(proto.getCmdId());
    proto.setPetList(petList);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
