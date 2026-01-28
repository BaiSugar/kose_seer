import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取魂珠列表响应
 * CMD 2354: GET_SOUL_BEAD_List
 * 
 * 响应格式：
 * - count (4 bytes): 魂珠数量
 * - 魂珠列表 (每个魂珠的数据)
 */
export class GetSoulBeadListRspProto extends BaseProto {
  private soulBeadList: any[];

  constructor(soulBeadList: any[] = []) {
    super(CommandID.GET_SOUL_BEAD_List);
    this.soulBeadList = soulBeadList;
  }

  public serialize(): Buffer {
    // 暂时返回空列表：count = 0
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(0, 0); // count = 0
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    // 不需要实现
  }
}
