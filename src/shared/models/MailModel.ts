/**
 * 邮件信息接口
 */
export interface IMailInfo {
  id: number;                    // 邮件唯一ID（数据库自增ID）
  userId: number;                // 收件人ID
  senderId: number;              // 发件人ID
  senderNick: string;            // 发件人昵称
  title: string;                 // 邮件标题
  content: string;               // 邮件内容
  isRead: boolean;               // 是否已读
  hasAttachment: boolean;        // 是否有附件
  attachmentType: number;        // 附件类型（0=无, 1=物品, 2=精灵, 3=金币）
  attachmentId: number;          // 附件ID（物品ID或精灵ID）
  attachmentCount: number;       // 附件数量
  isClaimed: boolean;            // 附件是否已领取
  sendTime: number;              // 发送时间（Unix时间戳）
  expireTime: number;            // 过期时间（Unix时间戳，0=永不过期）
  mailType: number;              // 邮件类型（0=普通, 1=系统, 2=奖励）
}

/**
 * 创建默认邮件信息
 */
export function createDefaultMailInfo(userId: number, senderId: number): IMailInfo {
  const now = Math.floor(Date.now() / 1000);
  
  return {
    id: 0,
    userId,
    senderId,
    senderNick: '',
    title: '',
    content: '',
    isRead: false,
    hasAttachment: false,
    attachmentType: 0,
    attachmentId: 0,
    attachmentCount: 0,
    isClaimed: false,
    sendTime: now,
    expireTime: 0,
    mailType: 0
  };
}

/**
 * 邮件附件类型枚举
 */
export enum MailAttachmentType {
  NONE = 0,        // 无附件
  ITEM = 1,        // 物品
  PET = 2,         // 精灵
  COINS = 3        // 金币
}

/**
 * 邮件类型枚举
 */
export enum MailType {
  NORMAL = 0,      // 普通邮件
  SYSTEM = 1,      // 系统邮件
  REWARD = 2       // 奖励邮件
}
