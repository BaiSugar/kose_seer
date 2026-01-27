/**
 * [CMD: 2757 MAIL_GET_UNREAD] 获取未读邮件数量
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_GET_UNREAD, InjectType.NONE)
export class MailGetUnreadHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailGetUnreadHandler] 玩家不存在');
      return;
    }

    await player.MailManager.HandleGetUnreadCount();
  }
}
