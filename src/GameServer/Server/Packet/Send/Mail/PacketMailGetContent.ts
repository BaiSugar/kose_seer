/**
 * 读取邮件内容响应包
 * CMD 2753
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailGetContentRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailGetContentRspProto';
import { IMailInfo } from '../../../../../shared/models/MailModel';

export class PacketMailGetContent extends BaseProto {
  private _data: Buffer;

  constructor(mail: IMailInfo | null) {
    super(CommandID.MAIL_GET_CONTENT);
    const proto = new MailGetContentRspProto();
    
    if (mail) {
      proto.success = true;
      proto.mail = mail;
    } else {
      proto.success = false;
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
