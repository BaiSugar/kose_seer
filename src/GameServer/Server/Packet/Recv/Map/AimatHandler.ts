import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AimatReqProto } from '../../../../../shared/proto/packets/req/map/AimatReqProto';

/**
 * Aimat/interact handler
 * CMD 1010
 */
@Opcode(CommandID.AIMAT, InjectType.NONE)
export class AimatHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new AimatReqProto();
    req.deserialize(body);
    await player.MapActionManager.HandleAimat(req);
  }
}

