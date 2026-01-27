/**
 * [CMD: 2755 MAIL_DELETE] 删除邮件
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_DELETE, InjectType.NONE)
export class MailDeleteHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailDeleteHandler] 玩家不存在');
      return;
    }

    // 读取邮件ID
    const mailId = body.readUInt32BE(0);

    await player.MailManager.HandleDeleteMail(mailId);
  }
}
