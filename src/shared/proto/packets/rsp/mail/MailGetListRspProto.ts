/**
 * [CMD: 2751 MAIL_GET_LIST] 获取邮件列表响应
 * 
 * 响应格式:
 * - total: uint32 (总邮件数)
 * - count: uint32 (当前返回的邮件数)
 * - mails: SingleMailInfo[] (邮件列表)
 * 
 * SingleMailInfo:
 * - id: uint32 (邮件ID)
 * - senderId: uint32 (发件人ID)
 * - senderNick: string[16] (发件人昵称)
 * - title: string[32] (邮件标题)
 * - isRead: uint32 (是否已读)
 * - hasAttachment: uint32 (是否有附件)
 * - sendTime: uint32 (发送时间)
 * - mailType: uint32 (邮件类型)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { IMailInfo } from '../../../../models/MailModel';

export class MailGetListRspProto extends BaseProto {
  public total: number = 0;
  public count: number = 0;
  public mails: IMailInfo[] = [];

  constructor() {
    super(CommandID.MAIL_GET_LIST);
  }

  public serialize(): Buffer {
    const buffers: Buffer[] = [];

    // total
    const totalBuf = Buffer.alloc(4);
    totalBuf.writeUInt32BE(this.total, 0);
    buffers.push(totalBuf);

    // count
    const countBuf = Buffer.alloc(4);
    countBuf.writeUInt32BE(this.count, 0);
    buffers.push(countBuf);

    // mails
    for (const mail of this.mails) {
      buffers.push(this.serializeSingleMail(mail));
    }

    return Buffer.concat(buffers);
  }

  /**
   * 序列化单个邮件信息
   * 
   * 客户端期望的格式 (SingleMailInfo.as):
   * - id: uint32 (邮件ID)
   * - template: uint32 (邮件模板ID)
   * - time: uint32 (发送时间)
   * - fromID: uint32 (发件人ID)
   * - fromNick: string[16] (发件人昵称)
   * - flag: uint32 (是否已读: 0=未读, 1=已读)
   */
  private serializeSingleMail(mail: IMailInfo): Buffer {
    const buffer = Buffer.alloc(4 + 4 + 4 + 4 + 16 + 4);
    let offset = 0;

    // id
    buffer.writeUInt32BE(mail.id, offset);
    offset += 4;

    // template (邮件模板ID，使用mailType)
    buffer.writeUInt32BE(mail.mailType, offset);
    offset += 4;

    // time (发送时间)
    buffer.writeUInt32BE(mail.sendTime, offset);
    offset += 4;

    // fromID (发件人ID)
    buffer.writeUInt32BE(mail.senderId, offset);
    offset += 4;

    // fromNick (16 bytes)
    const senderNickBuf = Buffer.alloc(16);
    senderNickBuf.write(mail.senderNick, 0, 16, 'utf8');
    senderNickBuf.copy(buffer, offset);
    offset += 16;

    // flag (是否已读: 0=未读, 1=已读)
    buffer.writeUInt32BE(mail.isRead ? 1 : 0, offset);

    return buffer;
  }
}
