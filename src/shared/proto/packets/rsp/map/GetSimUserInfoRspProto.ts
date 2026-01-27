import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取简单用户信息响应
 * CMD: 2051 GET_SIM_USERINFO
 */
export class GetSimUserInfoRspProto extends BaseProto {
  public userId: number = 0;
  public nick: string = '';
  public color: number = 0;
  public texture: number = 0;
  public vip: number = 0;
  public status: number = 0;
  public mapType: number = 0;
  public mapId: number = 0;
  public isCanBeTeacher: number = 0;
  public teacherID: number = 0;
  public studentID: number = 0;
  public graduationCount: number = 0;
  public vipLevel: number = 0;
  public teamId: number = 0;
  public teamIsShow: number = 0;
  public clothes: Array<{ id: number; level: number }> = [];

  constructor() {
    super(CommandID.GET_SIM_USERINFO);
  }

  // 链式调用方法
  public setUserId(value: number): this { this.userId = value; return this; }
  public setNick(value: string): this { this.nick = value; return this; }
  public setColor(value: number): this { this.color = value; return this; }
  public setTexture(value: number): this { this.texture = value; return this; }
  public setVip(value: number): this { this.vip = value; return this; }
  public setStatus(value: number): this { this.status = value; return this; }
  public setMapType(value: number): this { this.mapType = value; return this; }
  public setMapId(value: number): this { this.mapId = value; return this; }
  public setIsCanBeTeacher(value: number): this { this.isCanBeTeacher = value; return this; }
  public setTeacherID(value: number): this { this.teacherID = value; return this; }
  public setStudentID(value: number): this { this.studentID = value; return this; }
  public setGraduationCount(value: number): this { this.graduationCount = value; return this; }
  public setVipLevel(value: number): this { this.vipLevel = value; return this; }
  public setTeamId(value: number): this { this.teamId = value; return this; }
  public setTeamIsShow(value: number): this { this.teamIsShow = value; return this; }
  public setClothes(value: Array<{ id: number; level: number }>): this { this.clothes = value; return this; }


  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.nick = buffer.toString('utf8', offset, offset + 16).replace(/\0/g, ''); offset += 16;
    this.color = buffer.readUInt32BE(offset); offset += 4;
    this.texture = buffer.readUInt32BE(offset); offset += 4;
    this.vip = buffer.readUInt32BE(offset); offset += 4;
    this.status = buffer.readUInt32BE(offset); offset += 4;
    this.mapType = buffer.readUInt32BE(offset); offset += 4;
    this.mapId = buffer.readUInt32BE(offset); offset += 4;
    this.isCanBeTeacher = buffer.readUInt32BE(offset); offset += 4;
    this.teacherID = buffer.readUInt32BE(offset); offset += 4;
    this.studentID = buffer.readUInt32BE(offset); offset += 4;
    this.graduationCount = buffer.readUInt32BE(offset); offset += 4;
    this.vipLevel = buffer.readUInt32BE(offset); offset += 4;
    this.teamId = buffer.readUInt32BE(offset); offset += 4;
    this.teamIsShow = buffer.readUInt32BE(offset); offset += 4;
    
    const clothCount = buffer.readUInt32BE(offset); offset += 4;
    this.clothes = [];
    for (let i = 0; i < clothCount; i++) {
      const id = buffer.readUInt32BE(offset); offset += 4;
      const level = buffer.readUInt32BE(offset); offset += 4;
      this.clothes.push({ id, level });
    }
  }

  public serialize(): Buffer {
    const nickBuf = Buffer.alloc(16);
    nickBuf.write(this.nick, 0, 16, 'utf8');
    
    const clothBufSize = 4 + this.clothes.length * 8;
    const buffer = Buffer.alloc(64 + clothBufSize);
    let offset = 0;
    
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    nickBuf.copy(buffer, offset); offset += 16;
    buffer.writeUInt32BE(this.color, offset); offset += 4;
    buffer.writeUInt32BE(this.texture, offset); offset += 4;
    buffer.writeUInt32BE(this.vip, offset); offset += 4;
    buffer.writeUInt32BE(this.status, offset); offset += 4;
    buffer.writeUInt32BE(this.mapType, offset); offset += 4;
    buffer.writeUInt32BE(this.mapId, offset); offset += 4;
    buffer.writeUInt32BE(this.isCanBeTeacher, offset); offset += 4;
    buffer.writeUInt32BE(this.teacherID, offset); offset += 4;
    buffer.writeUInt32BE(this.studentID, offset); offset += 4;
    buffer.writeUInt32BE(this.graduationCount, offset); offset += 4;
    buffer.writeUInt32BE(this.vipLevel, offset); offset += 4;
    buffer.writeUInt32BE(this.teamId, offset); offset += 4;
    buffer.writeUInt32BE(this.teamIsShow, offset); offset += 4;
    
    buffer.writeUInt32BE(this.clothes.length, offset); offset += 4;
    for (const cloth of this.clothes) {
      buffer.writeUInt32BE(cloth.id, offset); offset += 4;
      buffer.writeUInt32BE(cloth.level, offset); offset += 4;
    }
    
    return buffer;
  }
}
