import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BlackRemoveReqProto } from '../../../../../shared/proto/packets/req/friend/BlackRemoveReqProto';

/**
 * 移除黑名单处理器
 * CMD 2155
 */
@Opcode(CommandID.BLACK_REMOVE, InjectType.NONE)
export class BlackRemoveHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new BlackRemoveReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    await player.FriendManager.RemoveFromBlacklist(req.targetId);
  }
}
