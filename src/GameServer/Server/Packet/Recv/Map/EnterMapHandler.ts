import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { EnterMapReqProto } from '../../../../../shared/proto/packets/req/map/EnterMapReqProto';

/**
 * 进入地图处理器
 * CMD 1001
 */
@Opcode(CommandID.ENTER_MAP, InjectType.NONE)
export class EnterMapHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = EnterMapReqProto.fromBuffer(body);
    await player.MapManager.HandleEnterMap(req);
  }
}
