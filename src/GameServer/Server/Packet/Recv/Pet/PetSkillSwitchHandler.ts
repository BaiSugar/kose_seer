import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSkillSwitchReqProto } from '../../../../../shared/proto/packets/req/pet/PetSkillSwitchReqProto';

/**
 * [CMD: 2312] 精灵技能切换
 */
@Opcode(CommandID.PET_SKILL_SWICTH, InjectType.NONE)
export class PetSkillSwitchHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetSkillSwitchReqProto.fromBuffer(body);
    
    await player.PetManager.HandleSkillSwitch(
      req.catchTime, 
      req.slot1, 
      req.slot2, 
      req.oldSkillId, 
      req.newSkillId
    );
  }
}
