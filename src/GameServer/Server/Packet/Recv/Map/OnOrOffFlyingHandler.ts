import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { OnOrOffFlyingReqProto } from '../../../../../shared/proto/packets/req/map/OnOrOffFlyingReqProto';

/**
 * 开关飞行模式处理器
 * CMD 1012
 */
@Opcode(CommandID.ON_OR_OFF_FLYING, InjectType.NONE)
export class OnOrOffFlyingHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new OnOrOffFlyingReqProto();
    req.deserialize(body);
    await player.MapActionManager.HandleOnOrOffFlying(req.flyMode);
  }
}
