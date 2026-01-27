/**
 * [CMD: 2755 MAIL_DELETE] 删除邮件响应
 * 
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

export class MailDeleteRspProto extends BaseProto {
  public success: boolean = false;
  public mailId: number = 0;

  constructor() {
    super(CommandID.MAIL_DELETE);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(this.success ? 1 : 0, 0);
    buffer.writeUInt32BE(this.mailId, 4);
    return buffer;
  }
}
