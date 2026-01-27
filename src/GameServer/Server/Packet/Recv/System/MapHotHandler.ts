import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 1004 MAP_HOT] 获取地图热度
 */
@Opcode(CommandID.MAP_HOT, InjectType.NONE)
export class MapHotHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.SystemManager.HandleMapHot();
  }
}
