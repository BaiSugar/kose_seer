import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoOpenReqProto } from '../../../../../shared/proto/packets/req/nono/NoNoOpenReqProto';

/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo
 */
@Opcode(CommandID.NONO_OPEN, InjectType.NONE)
export class NoNoOpenHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = NoNoOpenReqProto.fromBuffer(body);
    await player.NoNoManager.HandleNoNoOpen();
  }
}
