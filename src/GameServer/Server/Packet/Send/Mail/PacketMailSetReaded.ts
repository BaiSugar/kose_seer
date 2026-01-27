/**
 * 标记邮件为已读响应包
 * CMD 2754
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailSetReadedRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailSetReadedRspProto';

export class PacketMailSetReaded extends BaseProto {
  private _data: Buffer;

  constructor(success: boolean, mailId: number) {
    super(CommandID.MAIL_SET_READED);
    const proto = new MailSetReadedRspProto();
    proto.success = success;
    proto.mailId = mailId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
