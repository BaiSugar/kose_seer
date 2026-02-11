import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { SkillSortRspProto } from '../../../../../shared/proto/packets/rsp/pet/SkillSortRspProto';

/**
 * [CMD: 2328 Skill_Sort] 技能排序响应包
 */
export class PacketSkillSort extends BaseProto {
  private _data: Buffer;

  constructor() {
    const proto = new SkillSortRspProto();
    super(proto.getCmdId());
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
