import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoFollowOrHoomReqProto } from '../../../../../shared/proto/packets/req/nono/NoNoFollowOrHoomReqProto';

/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家
 * 简单逻辑：设置 NoNo 的跟随状态（会话级别）
 */
@Opcode(CommandID.NONO_FOLLOW_OR_HOOM, InjectType.NONE)
export class NoNoFollowOrHoomHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = NoNoFollowOrHoomReqProto.fromBuffer(body);
    await player.NoNoManager.HandleNoNoFollowOrHoom(req.action);
  }
}
