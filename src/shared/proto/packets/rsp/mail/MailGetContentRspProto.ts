/**
 * [CMD: 2753 MAIL_GET_CONTENT] 读取邮件内容响应
 * 
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mail: MailInfo (邮件详细信息)
 * 
 * MailInfo:
 * - id: uint32 (邮件ID)
 * - senderId: uint32 (发件人ID)
 * - senderNick: string[16] (发件人昵称)
 * - title: string[32] (邮件标题)
 * - content: string[256] (邮件内容)
 * - isRead: uint32 (是否已读)
 * - hasAttachment: uint32 (是否有附件)
 * - attachmentType: uint32 (附件类型)
 * - attachmentId: uint32 (附件ID)
 * - attachmentCount: uint32 (附件数量)
 * - isClaimed: uint32 (是否已领取)
 * - sendTime: uint32 (发送时间)
 * - expireTime: uint32 (过期时间)
 * - mailType: uint32 (邮件类型)
 */

import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { IMailInfo } from '../../../../models/MailModel';

export class MailGetContentRspProto extends BaseProto {
  public success: boolean = false;
  public mail: IMailInfo | null = null;

  constructor() {
    super(CommandID.MAIL_GET_CONTENT);
  }

  public serialize(): Buffer {
    const buffers: Buffer[] = [];

    // success
    const successBuf = Buffer.alloc(4);
    successBuf.writeUInt32BE(this.success ? 1 : 0, 0);
    buffers.push(successBuf);

    // mail (如果成功)
    if (this.success && this.mail) {
      buffers.push(this.serializeMailInfo(this.mail));
    }

    return Buffer.concat(buffers);
  }

  /**
   * 序列化邮件详细信息
   */
  private serializeMailInfo(mail: IMailInfo): Buffer {
    const buffer = Buffer.alloc(4 + 4 + 16 + 32 + 256 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4);
    let offset = 0;

    // id
    buffer.writeUInt32BE(mail.id, offset);
    offset += 4;

    // senderId
    buffer.writeUInt32BE(mail.senderId, offset);
    offset += 4;

    // senderNick (16 bytes)
    const senderNickBuf = Buffer.alloc(16);
    senderNickBuf.write(mail.senderNick, 0, 16, 'utf8');
    senderNickBuf.copy(buffer, offset);
    offset += 16;

    // title (32 bytes)
    const titleBuf = Buffer.alloc(32);
    titleBuf.write(mail.title, 0, 32, 'utf8');
    titleBuf.copy(buffer, offset);
    offset += 32;

    // content (256 bytes)
    const contentBuf = Buffer.alloc(256);
    contentBuf.write(mail.content, 0, 256, 'utf8');
    contentBuf.copy(buffer, offset);
    offset += 256;

    // isRead
    buffer.writeUInt32BE(mail.isRead ? 1 : 0, offset);
    offset += 4;

    // hasAttachment
    buffer.writeUInt32BE(mail.hasAttachment ? 1 : 0, offset);
    offset += 4;

    // attachmentType
    buffer.writeUInt32BE(mail.attachmentType, offset);
    offset += 4;

    // attachmentId
    buffer.writeUInt32BE(mail.attachmentId, offset);
    offset += 4;

    // attachmentCount
    buffer.writeUInt32BE(mail.attachmentCount, offset);
    offset += 4;

    // isClaimed
    buffer.writeUInt32BE(mail.isClaimed ? 1 : 0, offset);
    offset += 4;

    // sendTime
    buffer.writeUInt32BE(mail.sendTime, offset);
    offset += 4;

    // expireTime
    buffer.writeUInt32BE(mail.expireTime, offset);
    offset += 4;

    // mailType
    buffer.writeUInt32BE(mail.mailType, offset);

    return buffer;
  }
}
