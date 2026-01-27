import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoChangeNameReqProto } from '../../../../../shared/proto/packets/req/nono/NoNoChangeNameReqProto';

/**
 * [CMD: 9002 NONO_CHANGE_NAME] 修改NoNo昵称
 */
@Opcode(CommandID.NONO_CHANGE_NAME, InjectType.NONE)
export class NoNoChangeNameHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = NoNoChangeNameReqProto.fromBuffer(body);
    await player.NoNoManager.HandleNoNoChangeName(req.newName);
  }
}
