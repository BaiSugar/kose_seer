import { BaseProto } from '../../../base/BaseProto';

/**
 * 获取精灵技能请求
 * CMD: 2336
 */
export class GetPetSkillReqProto extends BaseProto {
  public catchTime: number = 0;

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.catchTime = buffer.readUInt32BE(offset);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
