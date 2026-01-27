import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteStartFightRspProto } from '../../../../../shared/proto/packets/rsp/battle/NoteStartFightRspProto';
import { FightPetInfoProto } from '../../../../../shared/proto/common/FightPetInfoProto';

/**
 * 开始战斗通知包
 * CMD 2504
 */
export class PacketNoteStartFight extends BaseProto {
  private _data: Buffer;

  constructor(
    isCanAuto: number,
    playerPet: FightPetInfoProto,
    enemyPet: FightPetInfoProto
  ) {
    super(CommandID.NOTE_START_FIGHT);
    
    const proto = new NoteStartFightRspProto();
    proto.setIsCanAuto(isCanAuto);
    proto.setPlayerPet(playerPet);
    proto.setEnemyPet(enemyPet);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
