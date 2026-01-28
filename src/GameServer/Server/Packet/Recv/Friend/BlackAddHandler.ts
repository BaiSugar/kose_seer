import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BlackAddReqProto } from '../../../../../shared/proto/packets/req/friend/BlackAddReqProto';

/**
 * 添加黑名单处理器
 * CMD 2154
 */
@Opcode(CommandID.BLACK_ADD, InjectType.NONE)
export class BlackAddHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new BlackAddReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    await player.FriendManager.AddToBlacklist(req.targetId);
  }
}
