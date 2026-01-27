import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 简单精灵信息
 * 用于 NOTE_READY_TO_FIGHT (2503) 中的精灵信息
 */
export class SimplePetInfoProto extends BaseProto {
  petId: number = 0;           // 精灵ID
  level: number = 0;           // 等级
  hp: number = 0;              // 当前HP
  maxHp: number = 0;           // 最大HP
  skills: Array<{ id: number; pp: number }> = []; // 技能列表 (最多4个)
  catchTime: number = 0;       // 捕获时间
  catchMap: number = 0;        // 捕获地图
  catchRect: number = 0;       // 捕获区域
  catchLevel: number = 0;      // 捕获等级
  skinID: number = 0;          // 皮肤ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(200);
    
    writer.WriteUInt32(this.petId);
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.hp);
    writer.WriteUInt32(this.maxHp);
    
    // 技能数量
    const validSkills = this.skills.filter(s => s.id > 0);
    writer.WriteUInt32(validSkills.length);
    
    // 写入4个技能槽（不足的补0）
    for (let i = 0; i < 4; i++) {
      const skill = validSkills[i] || { id: 0, pp: 0 };
      writer.WriteUInt32(skill.id);
      writer.WriteUInt32(skill.pp);
    }
    
    writer.WriteUInt32(this.catchTime);
    writer.WriteUInt32(this.catchMap);
    writer.WriteUInt32(this.catchRect);
    writer.WriteUInt32(this.catchLevel);
    writer.WriteUInt32(this.skinID);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setPetId(value: number): this {
    this.petId = value;
    return this;
  }

  setLevel(value: number): this {
    this.level = value;
    return this;
  }

  setHP(hp: number, maxHp: number): this {
    this.hp = hp;
    this.maxHp = maxHp;
    return this;
  }

  setSkills(skills: Array<{ id: number; pp: number }>): this {
    this.skills = skills.slice(0, 4); // 最多4个技能
    return this;
  }

  setCatchTime(value: number): this {
    this.catchTime = value;
    return this;
  }

  setCatchMap(value: number): this {
    this.catchMap = value;
    return this;
  }

  setCatchLevel(value: number): this {
    this.catchLevel = value;
    return this;
  }

  setSkinID(value: number): this {
    this.skinID = value;
    return this;
  }
}
