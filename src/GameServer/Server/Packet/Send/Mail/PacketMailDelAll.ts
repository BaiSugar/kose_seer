/**
 * 删除所有已读邮件响应包
 * CMD 2756
 */

import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MailDelAllRspProto } from '../../../../../shared/proto/packets/rsp/mail/MailDelAllRspProto';

export class PacketMailDelAll extends BaseProto {
  private _data: Buffer;

  constructor(count: number) {
    super(CommandID.MAIL_DEL_ALL);
    const proto = new MailDelAllRspProto();
    proto.count = count;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
