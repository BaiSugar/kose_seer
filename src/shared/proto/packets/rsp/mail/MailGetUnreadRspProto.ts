/**
 * [CMD: 2757 MAIL_GET_UNREAD] 获取未读邮件数量响应
 * 
 * 响应格式:
 * - count: uint32 (未读邮件数量)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

export class MailGetUnreadRspProto extends BaseProto {
  public count: number = 0;

  constructor() {
    super(CommandID.MAIL_GET_UNREAD);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.count, 0);
    return buffer;
  }
}
