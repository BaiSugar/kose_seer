import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetStudySkillReqProto } from '../../../../../shared/proto/packets/req/pet/PetStudySkillReqProto';

/**
 * [CMD: 2307] 精灵学习技能
 */
@Opcode(CommandID.PET_STUDY_SKILL, InjectType.NONE)
export class PetStudySkillHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetStudySkillReqProto.fromBuffer(body);
    // TODO: Implement skill learning in PetManager
    // await player.PetManager.LearnPetSkill(req.petId, req.skillId);
  }
}
