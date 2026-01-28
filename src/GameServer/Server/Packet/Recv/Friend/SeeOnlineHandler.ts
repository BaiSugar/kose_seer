import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SeeOnlineReqProto } from '../../../../../shared/proto/packets/req/friend/SeeOnlineReqProto';

/**
 * 查看在线状态处理器
 * CMD 2157
 */
@Opcode(CommandID.SEE_ONLINE, InjectType.NONE)
export class SeeOnlineHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析请求
    const req = new SeeOnlineReqProto();
    req.deserialize(body);

    // 调用 FriendManager 处理
    await player.FriendManager.SeeOnline();
  }
}
