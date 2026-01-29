import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteUpdateSkillRspProto, IUpdateSkillInfo } from '../../../../../shared/proto/packets/rsp/pet/NoteUpdateSkillRspProto';

/**
 * NOTE_UPDATE_SKILL 数据包 (2507)
 * 推送精灵技能更新信息
 */
export class PacketNoteUpdateSkill extends BaseProto {
  private _data: Buffer;

  constructor(pets: IUpdateSkillInfo[]) {
    super(CommandID.NOTE_UPDATE_SKILL);
    const proto = new NoteUpdateSkillRspProto();
    proto.pets = pets;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
