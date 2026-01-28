import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FightNpcMonsterRspProto } from '../../../../../shared/proto/packets/rsp/battle/FightNpcMonsterRspProto';

/**
 * 挑战野外精灵响应包
 * CMD 2408
 */
export class PacketFightNpcMonster extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.FIGHT_NPC_MONSTER);
    
    const proto = new FightNpcMonsterRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
