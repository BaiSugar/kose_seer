import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 地图怪物列表处理器
 * CMD 1004
 */
@Opcode(CommandID.MAP_OGRE_LIST, InjectType.NONE)
export class MapOgreListHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.MapManager.HandleMapOgreList();
  }
}
