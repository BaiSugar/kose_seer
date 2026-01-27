/**
 * [CMD: 2754 MAIL_SET_READED] 标记邮件为已读
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_SET_READED, InjectType.NONE)
export class MailSetReadedHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailSetReadedHandler] 玩家不存在');
      return;
    }

    // 读取邮件ID (如果为0则标记所有邮件为已读)
    const mailId = body.readUInt32BE(0);

    await player.MailManager.HandleMarkAsRead(mailId);
  }
}
