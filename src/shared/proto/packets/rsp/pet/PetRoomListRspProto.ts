import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 精灵列表信息（简化版）
 */
export interface IPetListInfo {
  id: number;         // 精灵ID
  catchTime: number;  // 捕获时间
  skinID: number;     // 皮肤ID
}

/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表响应
 * 
 * 格式：
 * - count (uint32): 精灵数量
 * - 多个 PetListInfo:
 *   - id (uint32): 精灵ID
 *   - catchTime (uint32): 捕获时间
 *   - skinID (uint32): 皮肤ID
 */
export class PetRoomListRspProto extends BaseProto {
  petList: IPetListInfo[] = [];

  constructor() {
    super(CommandID.PET_ROOM_LIST);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    // 写入精灵数量
    writer.WriteUInt32(this.petList.length);
    
    // 写入每个精灵的信息
    for (const pet of this.petList) {
      writer.WriteUInt32(pet.id);
      writer.WriteUInt32(pet.catchTime);
      writer.WriteUInt32(pet.skinID);
    }
    
    return writer.ToBuffer();
  }

  setPetList(petList: IPetListInfo[]): this {
    this.petList = petList;
    return this;
  }
}
