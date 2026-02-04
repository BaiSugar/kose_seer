import { BaseProto } from '../../../base/BaseProto';

/**
 * 获取精灵技能响应
 * CMD: 2336
 * 
 * 协议格式：
 * - skillCount (4 bytes) - 技能数量
 * - skillId[] (4 bytes each) - 技能ID列表
 */
export class GetPetSkillRspProto extends BaseProto {
  public skills: number[] = [];

  public serialize(): Buffer {
    const buffers: Buffer[] = [];

    // 技能数量 (4 bytes)
    const skillCountBuffer = Buffer.allocUnsafe(4);
    skillCountBuffer.writeUInt32BE(this.skills.length, 0);
    buffers.push(skillCountBuffer);

    // 技能ID列表
    for (const skillId of this.skills) {
      const skillIdBuffer = Buffer.allocUnsafe(4);
      skillIdBuffer.writeUInt32BE(skillId, 0);
      buffers.push(skillIdBuffer);
    }

    return Buffer.concat(buffers);
  }
}
