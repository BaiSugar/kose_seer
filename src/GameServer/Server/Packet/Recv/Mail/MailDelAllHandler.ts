/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_DEL_ALL, InjectType.NONE)
export class MailDelAllHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailDelAllHandler] 玩家不存在');
      return;
    }

    await player.MailManager.HandleDeleteAllRead();
  }
}
