import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetStudySkillRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetStudySkillRspProto';

/**
 * PET_STUDY_SKILL 数据包 (2307)
 * 精灵学习技能响应
 */
export class PacketStudySkill extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.PET_STUDY_SKILL);
    const proto = new PetStudySkillRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }

  public deserialize(_buffer: Buffer): void {
    // Not needed for response
  }
}
