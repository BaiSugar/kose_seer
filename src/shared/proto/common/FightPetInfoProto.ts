import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 战斗精灵信息
 * 对应前端: com.robot.core.info.fightInfo.FightPetInfo
 * 用于战斗开始时的精灵信息
 */
export class FightPetInfoProto extends BaseProto {
  userID: number = 0;          // 用户ID (0=敌人)
  petID: number = 0;           // 精灵ID
  petName: string = '';        // 精灵名称 (16字节)
  catchTime: number = 0;       // 捕获时间
  hp: number = 0;              // 当前HP
  maxHP: number = 0;           // 最大HP
  level: number = 0;           // 等级
  catchable: number = 0;       // 是否可捕获 (0/1)
  battleLv: number[] = [0, 0, 0, 0, 0, 0]; // 战斗等级 (6字节)

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(100);
    
    writer.WriteUInt32(this.userID);
    writer.WriteUInt32(this.petID);
    writer.WriteBytes(this.buildString(this.petName, 16));
    writer.WriteUInt32(this.catchTime);
    writer.WriteUInt32(this.hp);
    writer.WriteUInt32(this.maxHP);
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.catchable);
    
    // battleLv (6字节)
    for (let i = 0; i < 6; i++) {
      writer.WriteUInt8(this.battleLv[i] || 0);
    }
    
    return writer.ToBuffer();
  }

  // 链式调用
  setUserID(value: number): this {
    this.userID = value;
    return this;
  }

  setPetID(value: number): this {
    this.petID = value;
    return this;
  }

  setPetName(value: string): this {
    this.petName = value;
    return this;
  }

  setCatchTime(value: number): this {
    this.catchTime = value;
    return this;
  }

  setHP(hp: number, maxHP: number): this {
    this.hp = hp;
    this.maxHP = maxHP;
    return this;
  }

  setLevel(value: number): this {
    this.level = value;
    return this;
  }

  setCatchable(value: number): this {
    this.catchable = value;
    return this;
  }

  setBattleLv(value: number[]): this {
    this.battleLv = value;
    return this;
  }
}
