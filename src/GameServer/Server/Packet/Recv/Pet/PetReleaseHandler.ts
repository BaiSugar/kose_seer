import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetReleaseReqProto } from '../../../../../shared/proto/packets/req/pet/PetReleaseReqProto';

/**
 * [CMD: 2304 PET_RELEASE] 释放精灵
 */
@Opcode(CommandID.PET_RELEASE, InjectType.NONE)
export class PetReleaseHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetReleaseReqProto.fromBuffer(body);
    // HandlePetRelease accepts only petId (catchId)
    await player.PetManager.HandlePetRelease(req.catchId);
  }
}
