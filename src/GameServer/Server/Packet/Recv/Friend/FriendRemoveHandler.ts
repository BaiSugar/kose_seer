import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendRemoveReqProto } from '../../../../../shared/proto/packets/req/friend/FriendRemoveReqProto';

/**
 * 删除好友处理器
 * CMD 2153
 */
@Opcode(CommandID.FRIEND_REMOVE, InjectType.NONE)
export class FriendRemoveHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new FriendRemoveReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    await player.FriendManager.RemoveFriend(req.targetId);
  }
}
