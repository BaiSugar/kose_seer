import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取详细用户信息响应
 * CMD: 2052 GET_MORE_USERINFO
 */
export class GetMoreUserInfoRspProto extends BaseProto {
  public userId: number = 0;
  public nick: string = '';
  public regTime: number = 0;
  public petAllNum: number = 0;
  public petMaxLev: number = 0;
  public bossAchievement: string = '';
  public graduationCount: number = 0;
  public monKingWin: number = 0;
  public messWin: number = 0;
  public maxStage: number = 0;
  public maxArenaWins: number = 0;
  public curTitle: number = 0;

  constructor() {
    super(CommandID.GET_MORE_USERINFO);
  }

  // 链式调用方法
  public setUserId(value: number): this { this.userId = value; return this; }
  public setNick(value: string): this { this.nick = value; return this; }
  public setRegTime(value: number): this { this.regTime = value; return this; }
  public setPetAllNum(value: number): this { this.petAllNum = value; return this; }
  public setPetMaxLev(value: number): this { this.petMaxLev = value; return this; }
  public setBossAchievement(value: string): this { this.bossAchievement = value; return this; }
  public setGraduationCount(value: number): this { this.graduationCount = value; return this; }
  public setMonKingWin(value: number): this { this.monKingWin = value; return this; }
  public setMessWin(value: number): this { this.messWin = value; return this; }
  public setMaxStage(value: number): this { this.maxStage = value; return this; }
  public setMaxArenaWins(value: number): this { this.maxArenaWins = value; return this; }
  public setCurTitle(value: number): this { this.curTitle = value; return this; }


  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.nick = buffer.toString('utf8', offset, offset + 16).replace(/\0/g, ''); offset += 16;
    this.regTime = buffer.readUInt32BE(offset); offset += 4;
    this.petAllNum = buffer.readUInt32BE(offset); offset += 4;
    this.petMaxLev = buffer.readUInt32BE(offset); offset += 4;
    this.bossAchievement = buffer.toString('utf8', offset, offset + 200).replace(/\0/g, ''); offset += 200;
    this.graduationCount = buffer.readUInt32BE(offset); offset += 4;
    this.monKingWin = buffer.readUInt32BE(offset); offset += 4;
    this.messWin = buffer.readUInt32BE(offset); offset += 4;
    this.maxStage = buffer.readUInt32BE(offset); offset += 4;
    this.maxArenaWins = buffer.readUInt32BE(offset); offset += 4;
    this.curTitle = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(260);
    let offset = 0;
    
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    
    const nickBuf = Buffer.alloc(16);
    nickBuf.write(this.nick, 0, 16, 'utf8');
    nickBuf.copy(buffer, offset); offset += 16;
    
    buffer.writeUInt32BE(this.regTime, offset); offset += 4;
    buffer.writeUInt32BE(this.petAllNum, offset); offset += 4;
    buffer.writeUInt32BE(this.petMaxLev, offset); offset += 4;
    
    const bossBuf = Buffer.alloc(200);
    bossBuf.write(this.bossAchievement, 0, 200, 'utf8');
    bossBuf.copy(buffer, offset); offset += 200;
    
    buffer.writeUInt32BE(this.graduationCount, offset); offset += 4;
    buffer.writeUInt32BE(this.monKingWin, offset); offset += 4;
    buffer.writeUInt32BE(this.messWin, offset); offset += 4;
    buffer.writeUInt32BE(this.maxStage, offset); offset += 4;
    buffer.writeUInt32BE(this.maxArenaWins, offset); offset += 4;
    buffer.writeUInt32BE(this.curTitle, offset); offset += 4;
    
    return buffer;
  }
}
