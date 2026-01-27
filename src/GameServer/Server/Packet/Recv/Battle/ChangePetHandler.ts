import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangePetReqProto } from '../../../../../shared/proto/packets/req/battle/ChangePetReqProto';

/**
 * [CMD: 2407 CHANGE_PET] 更换精灵
 */
@Opcode(CommandID.CHANGE_PET, InjectType.NONE)
export class ChangePetHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = ChangePetReqProto.fromBuffer(body);
    await player.BattleManager.HandleChangePet(req.catchTime);
  }
}
