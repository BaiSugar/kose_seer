/**
 * [CMD: 2753 MAIL_GET_CONTENT] 读取邮件内容
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_GET_CONTENT, InjectType.NONE)
export class MailGetContentHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailGetContentHandler] 玩家不存在');
      return;
    }

    // 读取邮件ID
    const mailId = body.readUInt32BE(0);

    await player.MailManager.HandleReadMail(mailId);
  }
}
