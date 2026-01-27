import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoGetChipReqProto } from '../../../../../shared/proto/packets/req/nono/NoNoGetChipReqProto';

/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 */
@Opcode(CommandID.NONO_GET_CHIP, InjectType.NONE)
export class NoNoGetChipHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = NoNoGetChipReqProto.fromBuffer(body);
    await player.NoNoManager.HandleNoNoGetChip(req.chipType);
  }
}
