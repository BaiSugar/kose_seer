import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetDefaultReqProto } from '../../../../../shared/proto/packets/req/pet/PetDefaultReqProto';

/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵
 */
@Opcode(CommandID.PET_DEFAULT, InjectType.NONE)
export class PetDefaultHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetDefaultReqProto.fromBuffer(body);
    await player.PetManager.HandlePetDefault(req.catchTime);
  }
}
