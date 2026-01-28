import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 挑战野外精灵响应
 * CMD 2408
 * 
 * 响应格式：空包（成功后直接发送 NOTE_READY_TO_FIGHT 2503）
 */
export class FightNpcMonsterRspProto extends BaseProto {
  constructor() {
    super(CommandID.FIGHT_NPC_MONSTER);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }

  public deserialize(buffer: Buffer): void {
    // Empty response
  }
}
