import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 地图玩家列表处理器
 * CMD 1003
 */
@Opcode(CommandID.LIST_MAP_PLAYER, InjectType.NONE)
export class ListMapPlayerHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.MapManager.HandleListMapPlayer();
  }
}
