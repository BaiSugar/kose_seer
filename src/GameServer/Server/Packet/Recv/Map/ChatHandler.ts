import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChatReqProto } from '../../../../../shared/proto/packets/req/map/ChatReqProto';

/**
 * 聊天处理器
 * CMD 1014
 */
@Opcode(CommandID.CHAT, InjectType.NONE)
export class ChatHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = ChatReqProto.fromBuffer(body);
    await player.MapActionManager.HandleMapChat(req);
  }
}
