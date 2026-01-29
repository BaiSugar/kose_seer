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
 * - reason: uint32 (学会原因: 1=战斗, 2=升级, 3=技能机, 4=遗传)
 * - skillCount: uint32 (技能数量)
 * - skills: uint32[] (技能ID列表，包括已有技能和新学会的技能)
 */

export interface IUpdateSkillInfo {
  catchTime: number;
  reason: number;      // 1=战斗, 2=升级, 3=技能机, 4=遗传
  skills: number[];    // 技能ID列表
}

export class NoteUpdateSkillRspProto extends BaseProto {
  public pets: IUpdateSkillInfo[] = [];

  constructor() {
    super(CommandID.NOTE_UPDATE_SKILL);
  }

  public serialize(): Buffer {
    const petCount = this.pets.length;
    
    // 计算总大小：4 (count) + sum(4 + 4 + 4 + 4*skillCount)
    let totalSize = 4;
    for (const pet of this.pets) {
      totalSize += 4 + 4 + 4 + pet.skills.length * 4;
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

      // reason (4 bytes)
      buffer.writeUInt32BE(pet.reason, offset);
      offset += 4;

      // skillCount (4 bytes)
      buffer.writeUInt32BE(pet.skills.length, offset);
      offset += 4;

      // skills array
      for (const skillId of pet.skills) {
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
