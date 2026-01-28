import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendAddReqProto } from '../../../../../shared/proto/packets/req/friend/FriendAddReqProto';

/**
 * 添加好友处理器
 * CMD 2151
 */
@Opcode(CommandID.FRIEND_ADD, InjectType.NONE)
export class FriendAddHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new FriendAddReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    await player.FriendManager.AddFriend(req.targetId);
  }
}
