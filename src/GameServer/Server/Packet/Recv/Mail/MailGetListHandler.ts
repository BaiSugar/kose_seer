/**
 * [CMD: 2751 MAIL_GET_LIST] 获取邮件列表
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MAIL_GET_LIST, InjectType.NONE)
export class MailGetListHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) {
      Logger.Warn('[MailGetListHandler] 玩家不存在');
      return;
    }

    await player.MailManager.HandleGetMailList();
  }
}
