import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AimatReqProto } from '../../../../../shared/proto/packets/req/map/AimatReqProto';
import { AimatRspProto } from '../../../../../shared/proto/packets/rsp/map/AimatRspProto';

/**
 * 瞄准/交互处理器
 * CMD 1010
 */
@Opcode(CommandID.AIMAT, InjectType.NONE)
export class AimatHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new AimatReqProto();
    req.deserialize(body);

    await player.SendPacket(new AimatRspProto(player.Uid, req.targetType, req.targetId, req.x, req.y));
  }
}
