/**
 * 获取未读邮件数量响应包
 * CMD 2757
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailGetUnreadRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailGetUnreadRspProto';

export class PacketMailGetUnread extends BaseProto {
  private _data: Buffer;

  constructor(count: number) {
    super(CommandID.MAIL_GET_UNREAD);
    const proto = new MailGetUnreadRspProto();
    proto.count = count;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
