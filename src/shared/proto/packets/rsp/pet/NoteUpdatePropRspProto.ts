import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * NOTE_UPDATE_PROP 响应协议 (2508)
 * 推送精灵属性更新信息（用于显示经验获得弹窗）
 * 
 * 数据结构：
 * - addition: uint32 (加成百分比 * 100，例如 150 表示 1.5 倍)
 * - count: uint32 (更新的精灵数量)
 * - pets: UpdatePropInfo[] (精灵更新信息数组)
 * 
 * UpdatePropInfo 结构 (72 bytes):
 * - catchTime: uint32
 * - id: uint32 (petId)
 * - level: uint32
 * - exp: uint32
 * - currentLvExp: uint32 (当前等级已获得经验)
 * - nextLvExp: uint32 (升到下一级所需经验)
 * - maxHp: uint32
 * - attack: uint32
 * - defence: uint32
 * - sa: uint32 (特攻)
 * - sd: uint32 (特防)
 * - sp: uint32 (速度)
 * - ev_hp: uint32
 * - ev_a: uint32
 * - ev_d: uint32
 * - ev_sa: uint32
 * - ev_sd: uint32
 * - ev_sp: uint32
 */

export interface IUpdatePropInfo {
  catchTime: number;
  id: number;
  level: number;
  exp: number;
  currentLvExp: number;
  nextLvExp: number;
  maxHp: number;
  attack: number;
  defence: number;
  sa: number;
  sd: number;
  sp: number;
  ev_hp: number;
  ev_a: number;
  ev_d: number;
  ev_sa: number;
  ev_sd: number;
  ev_sp: number;
}

export class NoteUpdatePropRspProto extends BaseProto {
  public addition: number = 0;  // 加成百分比 * 100
  public pets: IUpdatePropInfo[] = [];

  constructor() {
    super(CommandID.NOTE_UPDATE_PROP);
  }

  public serialize(): Buffer {
    const petCount = this.pets.length;
    const bodySize = 8 + petCount * 72;  // 8 bytes header + 72 bytes per pet
    const buffer = Buffer.alloc(bodySize);
    let offset = 0;

    // addition (4 bytes)
    buffer.writeUInt32BE(this.addition, offset);
    offset += 4;

    // count (4 bytes)
    buffer.writeUInt32BE(petCount, offset);
    offset += 4;

    // pets array
    for (const pet of this.pets) {
      buffer.writeUInt32BE(pet.catchTime, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.id, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.level, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.exp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.currentLvExp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.nextLvExp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.maxHp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.attack, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.defence, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.sa, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.sd, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.sp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_hp, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_a, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_d, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_sa, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_sd, offset);
      offset += 4;
      buffer.writeUInt32BE(pet.ev_sp, offset);
      offset += 4;
    }

    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    // Not needed for response proto
  }
}
