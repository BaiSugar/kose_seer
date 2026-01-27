import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetStudySkillReqProto } from '../../../../../shared/proto/packets/req/pet/PetStudySkillReqProto';
import { PetManager } from '../../../../Game/Pet/PetManager';

/**
 * [CMD: 2307] 精灵学习技能
 */
@Opcode(CommandID.PET_STUDY_SKILL, InjectType.PET_MANAGER)
export class PetStudySkillHandler implements IHandler {
  private _petManager: PetManager;

  constructor(petManager: PetManager) {
    this._petManager = petManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const req = PetStudySkillReqProto.fromBuffer(body);
    await this._petManager.HandleStudySkill(head.UserID, req);
  }
}
