import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { CatchMonsterRspProto } from '../../../../../shared/proto/packets/rsp/battle/CatchMonsterRspProto';

/**
 * 捕捉精灵包
 * CMD 2409
 */
export class PacketCatchMonster extends BaseProto {
  private _data: Buffer;

  constructor(catchTime: number, petId: number) {
    super(CommandID.CATCH_MONSTER);
    
    const proto = new CatchMonsterRspProto();
    proto.setCatchTime(catchTime);
    proto.setPetId(petId);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
