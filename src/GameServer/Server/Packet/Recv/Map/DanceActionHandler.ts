import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { DanceActionReqProto } from '../../../../../shared/proto/packets/req/map/DanceActionReqProto';

/**
 * Dance action handler
 * CMD 1009
 */
@Opcode(CommandID.DANCE_ACTION, InjectType.NONE)
export class DanceActionHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new DanceActionReqProto();
    req.deserialize(body);
    await player.MapActionManager.HandleDanceAction(req);
  }
}

