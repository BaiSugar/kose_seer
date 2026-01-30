import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2307] 精灵学习技能响应
 * 客户端不读取响应数据，只需要知道成功与否
 */
export class PetStudySkillRspProto extends BaseProto {
  constructor() {
    super(CommandID.PET_STUDY_SKILL);
  }

  serialize(): Buffer {
    // 返回空buffer，客户端不需要数据
    return Buffer.alloc(0);
  }
}
