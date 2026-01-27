import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetInfoReqProto } from '../../../../../shared/proto/packets/req/pet/GetPetInfoReqProto';

/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息
 */
@Opcode(CommandID.GET_PET_INFO, InjectType.NONE)
export class GetPetInfoHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = GetPetInfoReqProto.fromBuffer(body);
    await player.PetManager.HandleGetPetInfo(req.catchTime);
  }
}
