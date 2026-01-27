import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FightOverRspProto } from '../../../../../shared/proto/packets/rsp/battle/FightOverRspProto';

/**
 * 战斗结束包
 * CMD 2506
 */
export class PacketFightOver extends BaseProto {
  private _data: Buffer;

  constructor(reason: number, winnerId: number) {
    super(CommandID.FIGHT_OVER);
    
    const proto = new FightOverRspProto();
    proto.setReason(reason);
    proto.setWinnerId(winnerId);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
