import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * 开启超级NoNo处理器
 * CMD 80001
 * 
 * 请求格式: 无参数
 * 响应格式: success (uint32)
 */
@Opcode(CommandID.OPEN_SUPER_NONO, InjectType.NONE)
export class OpenSuperNonoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 调用 NoNoManager 处理
    await player.NoNoManager.HandleOpenSuperNono();
  }
}
