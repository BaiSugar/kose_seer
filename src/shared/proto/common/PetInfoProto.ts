import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 精灵技能信息
 */
export interface IPetSkill {
  id: number;   // 技能ID
  pp: number;   // 技能PP值
}

/**
 * 精灵效果信息
 */
export interface IPetEffect {
  effectID: number;
  leftRound: number;
  // ... 其他效果字段
}

/**
 * 精灵信息Proto（完整版）
 * 对应前端: com.robot.core.info.pet.PetInfo (isDefault/param2 = true)
 */
export class PetInfoProto extends BaseProto {
  id: number = 0;                    // 精灵ID
  name: string = '';                 // 精灵名称
  dv: number = 31;                   // 个体值
  nature: number = 0;                // 性格
  level: number = 1;                 // 等级
  exp: number = 0;                   // 当前经验
  lvExp: number = 0;                 // 本级经验
  nextLvExp: number = 0;             // 下级所需经验
  
  hp: number = 100;                  // 当前HP
  maxHp: number = 100;               // 最大HP
  attack: number = 50;               // 攻击
  defence: number = 50;              // 防御
  s_a: number = 50;                  // 特攻
  s_d: number = 50;                  // 特防
  speed: number = 50;                // 速度
  
  ev_hp: number = 0;                 // 努力值HP
  ev_attack: number = 0;             // 努力值攻击
  ev_defence: number = 0;            // 努力值防御
  ev_sa: number = 0;                 // 努力值特攻
  ev_sd: number = 0;                 // 努力值特防
  ev_sp: number = 0;                 // 努力值速度
  
  skills: IPetSkill[] = [];          // 技能列表（最多4个）
  
  catchTime: number = 0;             // 捕获时间（唯一标识）
  catchMap: number = 0;              // 捕获地图
  catchRect: number = 0;             // 捕获区域
  catchLevel: number = 1;            // 捕获等级
  
  effects: IPetEffect[] = [];        // 效果列表
  skinID: number = 0;                // 皮肤ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(256);
    
    // 1. 基础信息
    writer.WriteUInt32(this.id);
    writer.WriteBytes(this.buildString(this.name, 16));
    writer.WriteUInt32(this.dv);
    writer.WriteUInt32(this.nature);
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.exp);
    writer.WriteUInt32(this.lvExp);
    writer.WriteUInt32(this.nextLvExp);
    
    // 2. 战斗属性
    writer.WriteUInt32(this.hp);
    writer.WriteUInt32(this.maxHp);
    writer.WriteUInt32(this.attack);
    writer.WriteUInt32(this.defence);
    writer.WriteUInt32(this.s_a);
    writer.WriteUInt32(this.s_d);
    writer.WriteUInt32(this.speed);
    
    // 3. 努力值
    writer.WriteUInt32(this.ev_hp);
    writer.WriteUInt32(this.ev_attack);
    writer.WriteUInt32(this.ev_defence);
    writer.WriteUInt32(this.ev_sa);
    writer.WriteUInt32(this.ev_sd);
    writer.WriteUInt32(this.ev_sp);
    
    // 4. 技能列表（固定4个槽位）
    const validSkills = this.skills.filter(s => s.id > 0);
    writer.WriteUInt32(validSkills.length);
    
    for (let i = 0; i < 4; i++) {
      const skill = this.skills[i] || { id: 0, pp: 0 };
      writer.WriteUInt32(skill.id);
      writer.WriteUInt32(skill.pp);
    }
    
    // 5. 捕获信息
    writer.WriteUInt32(this.catchTime);
    writer.WriteUInt32(this.catchMap);
    writer.WriteUInt32(this.catchRect);
    writer.WriteUInt32(this.catchLevel);
    
    // 6. 效果列表
    writer.WriteUInt16(this.effects.length);
    // TODO: 如果有效果，写入效果数据
    
    // 7. 皮肤
    writer.WriteUInt32(this.skinID);
    
    return writer.ToBuffer();
  }
}
