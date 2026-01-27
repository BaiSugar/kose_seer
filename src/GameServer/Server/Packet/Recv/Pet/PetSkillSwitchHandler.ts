import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSkillSwitchReqProto } from '../../../../../shared/proto/packets/req/pet/PetSkillSwitchReqProto';
import { PetManager } from '../../../../Game/Pet/PetManager';

/**
 * [CMD: 2312] 精灵技能切换
 */
@Opcode(CommandID.PET_SKILL_SWICTH, InjectType.PET_MANAGER)
export class PetSkillSwitchHandler implements IHandler {
  private _petManager: PetManager;

  constructor(petManager: PetManager) {
    this._petManager = petManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const req = PetSkillSwitchReqProto.fromBuffer(body);
    await this._petManager.HandleSkillSwitch(head.UserID, req);
  }
}
