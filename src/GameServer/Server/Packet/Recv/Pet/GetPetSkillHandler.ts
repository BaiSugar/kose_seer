import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetSkillReqProto } from '../../../../../shared/proto/packets/req/pet/GetPetSkillReqProto';

/**
 * [CMD: 2336] 获取精灵技能
 */
@Opcode(CommandID.GET_PET_SKILL, InjectType.NONE)
export class GetPetSkillHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = GetPetSkillReqProto.fromBuffer(body);
    // TODO: Implement skill retrieval in PetManager
    // await player.PetManager.GetPetSkills(req.petId);
  }
}
