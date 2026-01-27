import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表请求
 */
export class GetPetListReqProto extends BaseProto {
  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): GetPetListReqProto {
    return new GetPetListReqProto();
  }
}
