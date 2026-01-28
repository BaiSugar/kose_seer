import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendAnswerReqProto } from '../../../../../shared/proto/packets/req/friend/FriendAnswerReqProto';

/**
 * 好友请求回复处理器
 * CMD 2152
 */
@Opcode(CommandID.FRIEND_ANSWER, InjectType.NONE)
export class FriendAnswerHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new FriendAnswerReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    if (req.accept) {
      await player.FriendManager.ConfirmAddFriend(req.targetId);
    } else {
      player.FriendManager.RefuseAddFriend(req.targetId);
    }
  }
}
