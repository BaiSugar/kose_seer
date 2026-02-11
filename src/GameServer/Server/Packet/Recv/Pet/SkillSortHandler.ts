import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SkillSortReqProto } from '../../../../../shared/proto/packets/req/pet/SkillSortReqProto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2328 Skill_Sort] 技能排序处理器
 * 
 * 功能：调整精灵技能槽的顺序
 */
@Opcode(CommandID.Skill_Sort, InjectType.NONE)
export class SkillSortHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new SkillSortReqProto();
    req.deserialize(body);
    
    Logger.Debug(
      `[SkillSortHandler] 技能排序: UserID=${player.Data.userID}, ` +
      `CatchTime=${req.catchTime}, Skills=[${req.getSkillArray().join(', ')}]`
    );

    await player.PetManager.HandleSkillSort(
      req.catchTime,
      req.skill1,
      req.skill2,
      req.skill3,
      req.skill4
    );
  }
}
