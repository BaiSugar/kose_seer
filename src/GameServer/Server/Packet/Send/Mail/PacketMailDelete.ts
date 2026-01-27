/**
 * 删除邮件响应包
 * CMD 2755
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailDeleteRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailDeleteRspProto';

export class PacketMailDelete extends BaseProto {
  private _data: Buffer;

  constructor(success: boolean, mailId: number) {
    super(CommandID.MAIL_DELETE);
    const proto = new MailDeleteRspProto();
    proto.success = success;
    proto.mailId = mailId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
