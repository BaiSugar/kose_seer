import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 攻击结果信息
 * 对应前端: com.robot.core.info.fightInfo.attack.AttackValue
 * 用于 NOTE_USE_SKILL (2505) 中的攻击信息
 */
export class AttackValueProto extends BaseProto {
  userId: number = 0;          // 攻击者ID
  skillId: number = 0;         // 技能ID
  atkTimes: number = 1;        // 攻击次数
  lostHP: number = 0;          // 损失HP
  gainHP: number = 0;          // 回复HP (可为负数)
  remainHp: number = 0;        // 剩余HP (可为负数)
  maxHp: number = 0;           // 最大HP
  state: number = 0;           // 状态 (0=正常, 1=未命中/格挡)
  skillList: Array<{ id: number; pp: number }> = []; // 技能列表
  isCrit: number = 0;          // 是否暴击 (0/1)
  status: number[] = new Array(20).fill(0);  // 状态数组 (20字节)
  battleLv: number[] = new Array(6).fill(0); // 战斗等级 (6字节)
  maxShield: number = 0;       // 最大护盾
  curShield: number = 0;       // 当前护盾
  petType: number = 0;         // 精灵类型

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(300);
    
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.skillId);
    writer.WriteUInt32(this.atkTimes);
    writer.WriteUInt32(this.lostHP);
    writer.WriteInt32(this.gainHP);      // 有符号
    writer.WriteInt32(this.remainHp);    // 有符号
    writer.WriteUInt32(this.maxHp);
    writer.WriteUInt32(this.state);
    
    // 技能列表
    writer.WriteUInt32(this.skillList.length);
    for (const skill of this.skillList) {
      writer.WriteUInt32(skill.id);
      writer.WriteUInt32(skill.pp);
    }
    
    writer.WriteUInt32(this.isCrit);
    
    // 状态数组 (20字节)
    for (let i = 0; i < 20; i++) {
      writer.WriteUInt8(this.status[i] || 0);
    }
    
    // 战斗等级 (6字节)
    for (let i = 0; i < 6; i++) {
      writer.WriteUInt8(this.battleLv[i] || 0); // 简化：使用无符号
    }
    
    writer.WriteUInt32(this.maxShield);
    writer.WriteUInt32(this.curShield);
    writer.WriteUInt32(this.petType);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setSkillId(value: number): this {
    this.skillId = value;
    return this;
  }

  setAtkTimes(value: number): this {
    this.atkTimes = value;
    return this;
  }

  setDamage(lostHP: number): this {
    this.lostHP = lostHP;
    return this;
  }

  setGainHP(value: number): this {
    this.gainHP = value;
    return this;
  }

  setRemainHp(value: number): this {
    this.remainHp = value;
    return this;
  }

  setMaxHp(value: number): this {
    this.maxHp = value;
    return this;
  }

  setState(value: number): this {
    this.state = value;
    return this;
  }

  setSkillList(skills: Array<{ id: number; pp: number }>): this {
    this.skillList = skills;
    return this;
  }

  setIsCrit(value: number): this {
    this.isCrit = value;
    return this;
  }

  setStatus(value: number[]): this {
    this.status = value;
    return this;
  }

  setBattleLv(value: number[]): this {
    this.battleLv = value;
    return this;
  }

  setPetType(value: number): this {
    this.petType = value;
    return this;
  }
}
