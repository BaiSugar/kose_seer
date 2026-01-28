import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 挑战野外精灵请求
 * CMD 2408
 */
export class FightNpcMonsterReqProto extends BaseProto {
  public monsterIndex: number = 0;  // 怪物索引 (0-8)

  constructor() {
    super(CommandID.FIGHT_NPC_MONSTER);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;

    if (buffer.length >= 4) {
      this.monsterIndex = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);  // Request usually doesn't need serialize
  }
}
