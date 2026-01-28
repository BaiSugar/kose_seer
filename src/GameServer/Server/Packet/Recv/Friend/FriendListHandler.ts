import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 获取好友列表处理器
 * CMD 2158
 * 
 * 请求格式: 无参数
 */
@Opcode(CommandID.FRIEND_LIST, InjectType.NONE)
export class FriendListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 调用 FriendManager 处理
    await player.FriendManager.GetFriendList();
  }
}
