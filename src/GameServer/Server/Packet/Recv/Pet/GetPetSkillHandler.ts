import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetSkillReqProto } from '../../../../../shared/proto/packets/req/pet/GetPetSkillReqProto';
import { PetManager } from '../../../../Game/Pet/PetManager';

/**
 * [CMD: 2336] 获取精灵技能
 */
@Opcode(CommandID.GET_PET_SKILL, InjectType.PET_MANAGER)
export class GetPetSkillHandler implements IHandler {
  private _petManager: PetManager;

  constructor(petManager: PetManager) {
    this._petManager = petManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const req = GetPetSkillReqProto.fromBuffer(body);
    await this._petManager.HandleGetSkills(head.UserID, req);
  }
}
