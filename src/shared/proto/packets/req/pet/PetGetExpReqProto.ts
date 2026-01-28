import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息请求
 * 精灵分配仪功能 - 查询可分配的经验值
 */
export class PetGetExpReqProto extends BaseProto {
  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetGetExpReqProto {
    return new PetGetExpReqProto();
  }
}
