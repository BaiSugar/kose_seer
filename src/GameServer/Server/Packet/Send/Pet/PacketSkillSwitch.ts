import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSkillSwitchRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetSkillSwitchRspProto';

/**
 * PET_SKILL_SWICTH 数据包 (2312)
 * 精灵技能切换响应
 */
export class PacketSkillSwitch extends BaseProto {
  private _data: Buffer;

  constructor(petId: number) {
    super(CommandID.PET_SKILL_SWICTH);
    const proto = new PetSkillSwitchRspProto();
    proto.petId = petId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }

  public deserialize(_buffer: Buffer): void {
    // Not needed for response
  }
}
