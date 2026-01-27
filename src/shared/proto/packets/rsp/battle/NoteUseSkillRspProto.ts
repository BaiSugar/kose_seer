import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';
import { AttackValueProto } from '../../../common/AttackValueProto';

/**
 * [CMD: 2505 NOTE_USE_SKILL] 使用技能通知响应
 * 发送双方的攻击结果
 */
export class NoteUseSkillRspProto extends BaseProto {
  firstAttack: AttackValueProto;   // 先手攻击
  secondAttack: AttackValueProto;  // 后手攻击

  constructor() {
    super(CommandID.NOTE_USE_SKILL);
    this.firstAttack = new AttackValueProto();
    this.secondAttack = new AttackValueProto();
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    writer.WriteBytes(this.firstAttack.serialize());
    writer.WriteBytes(this.secondAttack.serialize());
    
    return writer.ToBuffer();
  }

  // 链式调用
  setFirstAttack(attack: AttackValueProto): this {
    this.firstAttack = attack;
    return this;
  }

  setSecondAttack(attack: AttackValueProto): this {
    this.secondAttack = attack;
    return this;
  }
}
