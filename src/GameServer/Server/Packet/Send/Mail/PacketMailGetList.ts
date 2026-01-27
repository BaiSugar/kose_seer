/**
 * 获取邮件列表响应包
 * CMD 2751
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailGetListRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailGetListRspProto';
import { IMailInfo } from '../../../../../shared/models/MailModel';

export class PacketMailGetList extends BaseProto {
  private _data: Buffer;

  constructor(total: number, mails: IMailInfo[]) {
    super(CommandID.MAIL_GET_LIST);
    const proto = new MailGetListRspProto();
    proto.total = total;
    proto.count = mails.length;
    proto.mails = mails;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
