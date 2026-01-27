import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { UsePetItemReqProto } from '../../../../../shared/proto/packets/req/battle/UsePetItemReqProto';

/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具
 */
@Opcode(CommandID.USE_PET_ITEM, InjectType.NONE)
export class UsePetItemHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = UsePetItemReqProto.fromBuffer(body);
    await player.BattleManager.HandleUsePetItem(req.itemId);
  }
}
