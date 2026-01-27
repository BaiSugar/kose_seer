import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9003 NONO_INFO] NoNo 信息响应
 * 
 * NoNo 是赛尔号的特色宠物系统
 * 协议结构参考 luvit/handlers/nono_handlers.lua
 */
export class NoNoInfoRspProto extends BaseProto {
  userId: number = 0;           // 用户ID
  nonoKey: number = 0;          // NoNo Key (占位)
  flag: number = 1;             // NoNo 标志
  state: number = 0;            // NoNo 状态
  nick: string = '';            // NoNo 昵称 (16字节)
  color: number = 0xFFFFFF;     // NoNo 颜色
  power: number = 10000;        // 体力
  mate: number = 10000;         // 心情
  iq: number = 0;               // 智商
  ai: number = 0;               // AI
  superLevel: number = 0;       // 超能等级
  bio: number = 0;              // 生物值
  birth: number = 0;            // 出生时间（秒级时间戳）
  chargeTime: number = 0;       // 充电时间
  expire: number = 0;           // 过期时间
  chip: number = 0;             // 芯片
  grow: number = 0;             // 成长值

  constructor() {
    super(CommandID.NONO_INFO);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(256);
    
    // result (4 bytes)
    writer.WriteUInt32(this.result);
    
    // userId (4 bytes)
    writer.WriteUInt32(this.userId);
    
    // nonoKey (4 bytes)
    writer.WriteUInt32(this.nonoKey);
    
    // flag (4 bytes)
    writer.WriteUInt32(this.flag);
    
    // state (4 bytes)
    writer.WriteUInt32(this.state);
    
    // nick (16 bytes)
    writer.WriteBytes(this.buildString(this.nick, 16));
    
    // color (4 bytes)
    writer.WriteUInt32(this.color);
    
    // power (4 bytes)
    writer.WriteUInt32(this.power);
    
    // mate (4 bytes)
    writer.WriteUInt32(this.mate);
    
    // iq (4 bytes)
    writer.WriteUInt32(this.iq);
    
    // ai (4 bytes)
    writer.WriteUInt32(this.ai);
    
    // superLevel (4 bytes)
    writer.WriteUInt32(this.superLevel);
    
    // bio (4 bytes)
    writer.WriteUInt32(this.bio);
    
    // birth (4 bytes) - 秒级时间戳
    writer.WriteUInt32(this.birth);
    
    // chargeTime (4 bytes)
    writer.WriteUInt32(this.chargeTime);
    
    // expire (4 bytes)
    writer.WriteUInt32(this.expire);
    
    // chip (4 bytes)
    writer.WriteUInt32(this.chip);
    
    // grow (4 bytes)
    writer.WriteUInt32(this.grow);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setFlag(value: number): this {
    this.flag = value;
    return this;
  }

  setState(value: number): this {
    this.state = value;
    return this;
  }

  setNick(value: string): this {
    this.nick = value;
    return this;
  }

  setColor(value: number): this {
    this.color = value;
    return this;
  }

  setPower(value: number): this {
    this.power = value;
    return this;
  }

  setMate(value: number): this {
    this.mate = value;
    return this;
  }

  setIq(value: number): this {
    this.iq = value;
    return this;
  }

  setAi(value: number): this {
    this.ai = value;
    return this;
  }

  setSuperLevel(value: number): this {
    this.superLevel = value;
    return this;
  }

  setBio(value: number): this {
    this.bio = value;
    return this;
  }

  setBirth(value: number): this {
    this.birth = value;
    return this;
  }

  setChargeTime(value: number): this {
    this.chargeTime = value;
    return this;
  }

  setExpire(value: number): this {
    this.expire = value;
    return this;
  }

  setChip(value: number): this {
    this.chip = value;
    return this;
  }

  setGrow(value: number): this {
    this.grow = value;
    return this;
  }
}
