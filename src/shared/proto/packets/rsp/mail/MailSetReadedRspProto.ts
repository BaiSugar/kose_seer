/**
 * [CMD: 2754 MAIL_SET_READED] 标记邮件为已读响应
 * 
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID，0表示全部)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

export class MailSetReadedRspProto extends BaseProto {
  public success: boolean = false;
  public mailId: number = 0;

  constructor() {
    super(CommandID.MAIL_SET_READED);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(this.success ? 1 : 0, 0);
    buffer.writeUInt32BE(this.mailId, 4);
    return buffer;
  }
}
