import { BaseProto } from '../base/BaseProto';
import { BufferWriter } from '../../utils';

/**
 * 赛尔号地图用户信息
 * 对应前端: com.robot.core.info.UserInfo.setForPeoleInfo
 * 这是一个通用数据结构，用于多个命令的响应中
 */
export class SeerMapUserInfoProto extends BaseProto {
  // 基本信息
  sysTime: number = 0;          // 系统时间
  userID: number = 0;           // 用户ID
  nick: string = '';            // 昵称 (16字节)
  color: number = 0xFFFFFF;     // 颜色
  texture: number = 0;          // 纹理
  
  // VIP信息
  vipFlags: number = 0;         // VIP标志 (bit 0=vip, bit 1=viped)
  vipStage: number = 0;         // VIP阶段
  
  // 位置和动作
  actionType: number = 0;       // 动作类型 (0=正常, 1=飞行)
  x: number = 500;              // X坐标
  y: number = 300;              // Y坐标
  action: number = 0;           // 动作
  direction: number = 0;        // 方向
  changeShape: number = 0;      // 变身
  
  // 精灵信息
  spiritTime: number = 0;       // 精灵捕获时间 (catchTime)
  spiritID: number = 0;         // 精灵ID
  petDV: number = 31;           // 精灵DV值
  petSkin: number = 0;          // 精灵皮肤
  fightFlag: number = 0;        // 战斗标志
  
  // 师徒信息
  teacherID: number = 0;        // 师傅ID
  studentID: number = 0;        // 徒弟ID
  
  // NoNo信息
  nonoState: number = 0;        // NoNo状态 (bit flags)
  nonoColor: number = 0;        // NoNo颜色
  superNono: number = 0;        // 超级NoNo (0/1)
  playerForm: number = 0;       // 玩家形态
  transTime: number = 0;        // 变身时间
  
  // 战队信息
  teamId: number = 0;
  teamCoreCount: number = 0;
  teamIsShow: number = 0;
  teamLogoBg: number = 0;
  teamLogoIcon: number = 0;
  teamLogoColor: number = 0;
  teamTxtColor: number = 0;
  teamLogoWord: string = '';    // 4字节
  
  // 服装列表
  clothes: Array<{ id: number; level: number }> = [];
  
  // 称号
  curTitle: number = 0;

  constructor() {
    super(0);  // 通用Proto不需要cmdId
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    // 1. 基本信息
    writer.WriteUInt32(this.sysTime);
    writer.WriteUInt32(this.userID);
    writer.WriteBytes(this.buildString(this.nick, 16));
    writer.WriteUInt32(this.color);
    writer.WriteUInt32(this.texture);
    
    // 2. VIP信息
    writer.WriteUInt32(this.vipFlags);
    writer.WriteUInt32(this.vipStage);
    
    // 3. 位置和动作
    writer.WriteUInt32(this.actionType);
    writer.WriteUInt32(this.x);
    writer.WriteUInt32(this.y);
    writer.WriteUInt32(this.action);
    writer.WriteUInt32(this.direction);
    writer.WriteUInt32(this.changeShape);
    
    // 4. 精灵信息
    writer.WriteUInt32(this.spiritTime);
    writer.WriteUInt32(this.spiritID);
    writer.WriteUInt32(this.petDV);
    writer.WriteUInt32(this.petSkin);
    writer.WriteUInt32(this.fightFlag);
    
    // 5. 师徒信息
    writer.WriteUInt32(this.teacherID);
    writer.WriteUInt32(this.studentID);
    
    // 6. NoNo信息
    writer.WriteUInt32(this.nonoState);
    writer.WriteUInt32(this.nonoColor);
    writer.WriteUInt32(this.superNono);
    writer.WriteUInt32(this.playerForm);
    writer.WriteUInt32(this.transTime);
    
    // 7. 战队信息
    writer.WriteUInt32(this.teamId);
    writer.WriteUInt32(this.teamCoreCount);
    writer.WriteUInt32(this.teamIsShow);
    writer.WriteUInt16(this.teamLogoBg);
    writer.WriteUInt16(this.teamLogoIcon);
    writer.WriteUInt16(this.teamLogoColor);
    writer.WriteUInt16(this.teamTxtColor);
    writer.WriteBytes(this.buildString(this.teamLogoWord, 4));
    
    // 8. 服装列表
    writer.WriteUInt32(this.clothes.length);
    for (const cloth of this.clothes) {
      writer.WriteUInt32(cloth.id);
      writer.WriteUInt32(cloth.level);
    }
    
    // 9. 称号
    writer.WriteUInt32(this.curTitle);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setUserID(value: number): this {
    this.userID = value;
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

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setVipFlags(value: number): this {
    this.vipFlags = value;
    return this;
  }

  setNonoState(value: number): this {
    this.nonoState = value;
    return this;
  }

  setClothes(clothes: Array<{ id: number; level: number }>): this {
    this.clothes = clothes;
    return this;
  }
}
