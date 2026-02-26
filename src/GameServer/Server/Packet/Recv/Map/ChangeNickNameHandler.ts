import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeNickNameReqProto } from '../../../../../shared/proto/packets/req/map/ChangeNickNameReqProto';

/**
 * 修改昵称处理器
 * CMD 1007
 */
@Opcode(CommandID.CHANG_NICK_NAME, InjectType.NONE)
export class ChangeNickNameHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new ChangeNickNameReqProto();
    req.deserialize(body);
    await player.MapActionManager.HandleChangeNickName(req.newNick);
  }
}
