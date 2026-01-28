import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FightNpcMonsterReqProto } from '../../../../../shared/proto/packets/req/battle/FightNpcMonsterReqProto';

/**
 * 挑战野外精灵处理器
 * CMD 2408
 */
@Opcode(CommandID.FIGHT_NPC_MONSTER, InjectType.NONE)
export class FightNpcMonsterHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new FightNpcMonsterReqProto();
    req.deserialize(body);

    await player.BattleManager.HandleFightNpcMonster(req.monsterIndex);
  }
}
