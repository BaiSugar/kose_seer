import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetListReqProto } from '../../../../../shared/proto/packets/req/pet/GetPetListReqProto';

/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表
 */
@Opcode(CommandID.GET_PET_LIST, InjectType.NONE)
export class GetPetListHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.PetManager.HandleGetPetList();
  }
}
