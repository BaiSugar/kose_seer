import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * NOTE_UPDATE_SKILL 响应协议 (2507)
 * 推送精灵技能更新信息（用于显示技能学习界面）
 * 
 * 数据结构：
 * - count: uint32 (更新的精灵数量)
 * - pets: UpdateSkillInfo[] (精灵技能更新信息数组)
 * 
 * UpdateSkillInfo 结构：
 * - catchTime: uint32
 * - activeSkillCount: uint32 (已激活技能数量，技能槽未满时直接学习)
 * - unactiveSkillCount: uint32 (未激活技能数量，技能槽已满时需要替换)
 * - activeSkills: uint32[] (已激活技能ID列表)
 * - unactiveSkills: uint32[] (未激活技能ID列表)
 */

export interface IUpdateSkillInfo {
  catchTime: number;
  activeSkills: number[];   // 技能槽未满，直接学习的技能
  unactiveSkills: number[]; // 技能槽已满，需要替换的技能
}

export class NoteUpdateSkillRspProto extends BaseProto {
  public pets: IUpdateSkillInfo[] = [];

  constructor() {
    super(CommandID.NOTE_UPDATE_SKILL);
  }

  public serialize(): Buffer {
    const petCount = this.pets.length;
    
    // 计算总大小：4 (count) + sum(4 + 4 + 4 + activeCount*4 + unactiveCount*4)
    let totalSize = 4;
    for (const pet of this.pets) {
      totalSize += 4 + 4 + 4 + pet.activeSkills.length * 4 + pet.unactiveSkills.length * 4;
    }

    const buffer = Buffer.alloc(totalSize);
    let offset = 0;

    // count (4 bytes)
    buffer.writeUInt32BE(petCount, offset);
    offset += 4;

    // pets array
    for (const pet of this.pets) {
      // catchTime (4 bytes)
      buffer.writeUInt32BE(pet.catchTime, offset);
      offset += 4;

      // activeSkillCount (4 bytes)
      buffer.writeUInt32BE(pet.activeSkills.length, offset);
      offset += 4;

      // unactiveSkillCount (4 bytes)
      buffer.writeUInt32BE(pet.unactiveSkills.length, offset);
      offset += 4;

      // activeSkills array
      for (const skillId of pet.activeSkills) {
        buffer.writeUInt32BE(skillId, offset);
        offset += 4;
      }

      // unactiveSkills array
      for (const skillId of pet.unactiveSkills) {
        buffer.writeUInt32BE(skillId, offset);
        offset += 4;
      }
    }

    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    // Not needed for response proto
  }
}
