import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetEvolutionReqProto } from '../../../../../shared/proto/packets/req/pet/PetEvolutionReqProto';

/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化
 * 
 * 请求: catchTime(4) + evolveIndex(4)
 * 响应: status(4)
 */
@Opcode(CommandID.PET_EVOLVTION, InjectType.NONE)
export class PetEvolutionHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetEvolutionReqProto.fromBuffer(body);
    await player.PetManager.HandlePetEvolution(req.catchTime, req.evolveIndex);
  }
}
