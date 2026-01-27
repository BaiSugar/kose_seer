import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetCureReqProto } from '../../../../../shared/proto/packets/req/pet/PetCureReqProto';

/**
 * [CMD: 2306 PET_CURE] 治疗精灵
 */
@Opcode(CommandID.PET_CURE, InjectType.NONE)
export class PetCureHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetCureReqProto.fromBuffer(body);
    // HandlePetCure accepts optional petId (catchTime)
    await player.PetManager.HandlePetCure(req.catchTime);
  }
}
