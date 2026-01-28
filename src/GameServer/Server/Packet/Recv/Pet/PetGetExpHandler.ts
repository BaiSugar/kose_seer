import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetGetExpReqProto } from '../../../../../shared/proto/packets/req/pet/PetGetExpReqProto';

/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息
 * 精灵分配仪功能 - 查询可分配的经验值
 */
@Opcode(CommandID.PET_GET_EXP, InjectType.NONE)
export class PetGetExpHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    PetGetExpReqProto.fromBuffer(body);
    await player.PetManager.HandlePetGetExp();
  }
}
