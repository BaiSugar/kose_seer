import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS请求
 */
export class ChallengeBossReqProto extends BaseProto {
  bossId: number = 0;  // BOSS ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): ChallengeBossReqProto {
    const proto = new ChallengeBossReqProto();
    if (buffer.length >= 4) {
      proto.bossId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
