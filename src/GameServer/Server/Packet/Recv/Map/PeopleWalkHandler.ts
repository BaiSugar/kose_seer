import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleWalkReqProto } from '../../../../../shared/proto/packets/req/map/PeopleWalkReqProto';

/**
 * Player move handler
 * CMD 2101
 */
@Opcode(CommandID.PEOPLE_WALK, InjectType.NONE)
export class PeopleWalkHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PeopleWalkReqProto.fromBuffer(body);
    await player.MapActionManager.HandlePeopleWalk(req);
  }
}

