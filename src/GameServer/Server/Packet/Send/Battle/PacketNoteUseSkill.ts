import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteUseSkillRspProto } from '../../../../../shared/proto/packets/rsp/battle/NoteUseSkillRspProto';
import { AttackValueProto } from '../../../../../shared/proto/common/AttackValueProto';

/**
 * 使用技能通知包
 * CMD 2505
 */
export class PacketNoteUseSkill extends BaseProto {
  private _data: Buffer;

  constructor(
    firstAttack: AttackValueProto,
    secondAttack: AttackValueProto
  ) {
    super(CommandID.NOTE_USE_SKILL);
    
    const proto = new NoteUseSkillRspProto();
    proto.setFirstAttack(firstAttack);
    proto.setSecondAttack(secondAttack);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
