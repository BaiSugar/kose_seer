import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetSkillReqProto } from '../../../../../shared/proto/packets/req/pet/GetPetSkillReqProto';

/**
 * 获取精灵技能处理器
 * CMD: 2336
 */
@Opcode(CommandID.GET_PET_SKILL, InjectType.NONE)
export class GetPetSkillHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GetPetSkillReqProto(CommandID.GET_PET_SKILL);
    req.deserialize(body);

    await player.PetManager.HandleGetPetSkill(req.catchTime);
  }
}
