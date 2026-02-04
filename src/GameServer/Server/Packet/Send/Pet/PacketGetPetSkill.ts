import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetSkillRspProto } from '../../../../../shared/proto/packets/rsp/pet/GetPetSkillRspProto';

/**
 * 获取精灵技能响应包
 * CMD: 2336
 */
export class PacketGetPetSkill extends BaseProto {
  private _data: Buffer;

  constructor(skills: number[]) {
    super(CommandID.GET_PET_SKILL);

    const proto = new GetPetSkillRspProto(CommandID.GET_PET_SKILL);
    proto.skills = skills;

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
