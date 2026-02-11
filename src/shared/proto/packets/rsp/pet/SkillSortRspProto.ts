import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2328 Skill_Sort] 技能排序响应
 * 
 * 响应格式：空包（只有result）
 */
export class SkillSortRspProto extends BaseProto {
  constructor() {
    super(CommandID.Skill_Sort);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
