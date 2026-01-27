/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件响应
 * 
 * 响应格式:
 * - count: uint32 (删除的邮件数量)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

export class MailDelAllRspProto extends BaseProto {
  public count: number = 0;

  constructor() {
    super(CommandID.MAIL_DEL_ALL);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.count, 0);
    return buffer;
  }
}
