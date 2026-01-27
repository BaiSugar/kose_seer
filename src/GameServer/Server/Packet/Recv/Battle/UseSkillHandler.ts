import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { UseSkillReqProto } from '../../../../../shared/proto/packets/req/battle/UseSkillReqProto';

/**
 * [CMD: 2405 USE_SKILL] 使用技能
 */
@Opcode(CommandID.USE_SKILL, InjectType.NONE)
export class UseSkillHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = UseSkillReqProto.fromBuffer(body);
    await player.BattleManager.HandleUseSkill(req.skillId || 10001); // 默认撞击
  }
}
