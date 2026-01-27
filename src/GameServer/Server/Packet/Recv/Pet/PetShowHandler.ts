import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetShowReqProto } from '../../../../../shared/proto/packets/req/pet/PetShowReqProto';

/**
 * [CMD: 2305 PET_SHOW] 展示精灵
 */
@Opcode(CommandID.PET_SHOW, InjectType.NONE)
export class PetShowHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetShowReqProto.fromBuffer(body);
    // HandlePetShow accepts only petId (catchTime)
    await player.PetManager.HandlePetShow(req.catchTime);
  }
}
