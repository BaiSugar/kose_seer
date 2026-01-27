import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * [CMD: 9003 NONO_INFO] 获取 NoNo 信息
 * 复杂逻辑：需要从数据库读取 NoNo 数据
 */
@Opcode(CommandID.NONO_INFO, InjectType.NONE)
export class NoNoInfoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.NoNoManager.HandleNoNoInfo();
  }
}
