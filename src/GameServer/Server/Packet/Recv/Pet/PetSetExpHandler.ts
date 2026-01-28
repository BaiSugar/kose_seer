import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSetExpReqProto } from '../../../../../shared/proto/packets/req/pet/PetSetExpReqProto';

/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
@Opcode(CommandID.PET_SET_EXP, InjectType.NONE)
export class PetSetExpHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetSetExpReqProto.fromBuffer(body);
    await player.PetManager.HandlePetSetExp(req.catchTime, req.expAmount);
  }
}
