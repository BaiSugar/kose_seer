import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * BOSS信息
 */
export interface IBossInfo {
  id: number;       // BOSS精灵ID
  region: number;   // 区域/槽位
  hp: number;       // 当前HP
  pos: number;      // 位置 (200表示移除BOSS)
}

/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应
 * 
 * 协议格式：
 * - uint32: len (BOSS数量)
 * - 循环 len 次：
 *   - uint32: id (BOSS精灵ID)
 *   - uint32: region (区域/槽位)
 *   - uint32: hp (HP)
 *   - uint32: pos (位置，200表示移除)
 */
export class MapBossRspProto extends BaseProto {
  bosses: IBossInfo[] = [];

  constructor() {
    super(CommandID.MAP_BOSS);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4 + this.bosses.length * 16);
    
    // BOSS数量
    writer.WriteUInt32(this.bosses.length);
    
    // 每个BOSS的信息
    for (const boss of this.bosses) {
      writer.WriteUInt32(boss.id);
      writer.WriteUInt32(boss.region);
      writer.WriteUInt32(boss.hp);
      writer.WriteUInt32(boss.pos);
    }
    
    return writer.ToBuffer();
  }

  /**
   * 添加BOSS
   */
  addBoss(id: number, region: number, hp: number, pos: number): this {
    this.bosses.push({ id, region, hp, pos });
    return this;
  }

  /**
   * 批量设置BOSS
   */
  setBosses(bosses: IBossInfo[]): this {
    this.bosses = bosses;
    return this;
  }
}
