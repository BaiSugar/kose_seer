import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动响应
 */
export class PeopleWalkRspProto extends BaseProto {
  walkType: number = 0;  // 移动类型
  userId: number = 0;    // 用户ID
  x: number = 0;         // X坐标
  y: number = 0;         // Y坐标
  amfData: Buffer = Buffer.alloc(0);  // AMF数据

  constructor(walkType: number = 0, userId: number = 0, x: number = 0, y: number = 0, amfData: Buffer = Buffer.alloc(0)) {
    super(CommandID.PEOPLE_WALK);
    this.walkType = walkType;
    this.userId = userId;
    this.x = x;
    this.y = y;
    this.amfData = amfData;
  }

  serialize(): Buffer {
    const writer = new BufferWriter(256);
    
    writer.WriteUInt32(this.walkType);
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.x);
    writer.WriteUInt32(this.y);
    writer.WriteUInt32(this.amfData.length);
    writer.WriteBytes(this.amfData);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setWalkType(value: number): this {
    this.walkType = value;
    return this;
  }

  setUserId(value: number): this {
    this.userId = value;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setAmfData(data: Buffer): this {
    this.amfData = data;
    return this;
  }
}
