import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleTransformReqProto } from '../../../../../shared/proto/packets/req/map/PeopleTransformReqProto';

/**
 * Player transform handler
 * CMD 1011
 */
@Opcode(CommandID.PEOPLE_TRANSFROM, InjectType.NONE)
export class PeopleTransformHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new PeopleTransformReqProto();
    req.deserialize(body);
    await player.MapActionManager.HandlePeopleTransform(req);
  }
}

