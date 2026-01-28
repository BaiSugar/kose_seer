import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 地图野怪槽位信息
 */
export interface IOgreSlot {
  petId: number;   // 精灵ID，0表示该槽位无怪物
  shiny: number;   // 是否闪光，0=普通，1=闪光
}

/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应
 * 
 * 协议格式（Lua 端格式）：
 * - 前 9 个 uint32: petId (36 bytes)
 * - 后 9 个 uint32: shiny (36 bytes)
 * - 总共 72 bytes
 * */
export class MapOgreListRspProto extends BaseProto {
  ogres: IOgreSlot[] = [];  // 9个槽位

  constructor() {
    super(CommandID.MAP_OGRE_LIST);
    // 初始化9个空槽位
    for (let i = 0; i < 9; i++) {
      this.ogres.push({ petId: 0, shiny: 0 });
    }
  }

  serialize(): Buffer {
    // 像 Lua 端一样发送：9 个 petId + 9 个 shiny = 18 个 uint32 = 72 字节
    // 虽然客户端只读前 36 字节，但 Lua 端这样发送能工作
    const writer = new BufferWriter(72);
    
    // 前 9 个 uint32: petId
    for (let i = 0; i < 9; i++) {
      const ogre = this.ogres[i] || { petId: 0, shiny: 0 };
      writer.WriteUInt32(ogre.petId);
    }
    
    // 后 9 个 uint32: shiny
    for (let i = 0; i < 9; i++) {
      const ogre = this.ogres[i] || { petId: 0, shiny: 0 };
      writer.WriteUInt32(ogre.shiny);
    }
    
    return writer.ToBuffer();
  }

  /**
   * 设置槽位数据
   */
  setSlot(index: number, petId: number, shiny: number): this {
    if (index >= 0 && index < 9) {
      this.ogres[index] = { petId, shiny };
    }
    return this;
  }

  /**
   * 批量设置槽位数据
   */
  setOgres(ogres: IOgreSlot[]): this {
    for (let i = 0; i < Math.min(ogres.length, 9); i++) {
      this.ogres[i] = ogres[i];
    }
    return this;
  }
}
