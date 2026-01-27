import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 地图怪物列表响应
 * CMD: 2004 MAP_OGRE_LIST
 * 固定9个槽位，每个槽位8字节 (petId + shiny)
 */
export class MapOgreListRspProto extends BaseProto {
  public ogres: Array<{ petId: number; shiny: number }> = [];

  constructor(ogres?: Array<{ petId: number; shiny: number }>) {
    super(CommandID.MAP_OGRE_LIST);
    if (ogres) {
      this.ogres = ogres;
    } else {
      // 初始化9个空槽位
      for (let i = 0; i < 9; i++) {
        this.ogres.push({ petId: 0, shiny: 0 });
      }
    }
  }

  public deserialize(buffer: Buffer): void {
    this.ogres = [];
    let offset = 0;
    
    for (let i = 0; i < 9; i++) {
      const petId = buffer.readUInt32BE(offset); offset += 4;
      const shiny = buffer.readUInt32BE(offset); offset += 4;
      this.ogres.push({ petId, shiny });
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(72); // 9 * 8 bytes
    let offset = 0;
    
    for (let i = 0; i < 9; i++) {
      const ogre = this.ogres[i] || { petId: 0, shiny: 0 };
      buffer.writeUInt32BE(ogre.petId, offset); offset += 4;
      buffer.writeUInt32BE(ogre.shiny, offset); offset += 4;
    }
    
    return buffer;
  }
}
