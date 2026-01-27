import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeColorReqProto } from '../../../../../shared/proto/packets/req/map/ChangeColorReqProto';

/**
 * 修改颜色处理器
 * CMD 1008
 */
@Opcode(CommandID.CHANGE_COLOR, InjectType.NONE)
export class ChangeColorHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new ChangeColorReqProto();
    req.deserialize(body);
    await player.MapManager.HandleChangeColor(req.newColor);
  }
}
