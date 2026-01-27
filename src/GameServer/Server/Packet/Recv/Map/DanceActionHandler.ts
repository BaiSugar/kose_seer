import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { DanceActionReqProto } from '../../../../../shared/proto/packets/req/map/DanceActionReqProto';
import { DanceActionRspProto } from '../../../../../shared/proto/packets/rsp/map/DanceActionRspProto';

/**
 * 舞蹈动作处理器
 * CMD 1009
 */
@Opcode(CommandID.DANCE_ACTION, InjectType.NONE)
export class DanceActionHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new DanceActionReqProto();
    req.deserialize(body);

    await player.SendPacket(new DanceActionRspProto(player.UserID, req.actionId, req.actionType));
  }
}
