/**
 * 邮件管理器
 * 处理邮件相关的所有逻辑：获取邮件列表、发送邮件、领取附件等
 * 
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */

import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { MailRepository } from '../../../DataBase/repositories/Mail/MailRepository';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IMailInfo, createDefaultMailInfo, MailAttachmentType, MailType } from '../../../shared/models/MailModel';
import { 
  PacketMailGetList, 
  PacketMailGetUnread, 
  PacketMailGetContent, 
  PacketMailSetReaded, 
  PacketMailDelete, 
  PacketMailDelAll 
} from '../../Server/Packet/Send/Mail';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';

/**
 * 邮件管理器
 */
export class MailManager extends BaseManager {
  constructor(player: PlayerInstance) {
    super(player);
  }

  /**
   * 获取邮件列表
   * 
   * @param limit 最大数量
   * @returns 邮件列表
   */
  public async GetMailList(limit: number = 100): Promise<IMailInfo[]> {
    const mails = await this.Player.MailRepo.FindByUserId(limit);
    Logger.Info(`[MailManager] 获取邮件列表: UserId=${this.UserID}, Count=${mails.length}`);
    return mails;
  }

  /**
   * 获取未读邮件列表
   * 
   * @returns 未读邮件列表
   */
  public async GetUnreadMails(): Promise<IMailInfo[]> {
    const mails = await this.Player.MailRepo.FindUnreadByUserId();
    Logger.Info(`[MailManager] 获取未读邮件: UserId=${this.UserID}, Count=${mails.length}`);
    return mails;
  }

  /**
   * 获取未读邮件数量
   * 
   * @returns 未读邮件数量
   */
  public async GetUnreadCount(): Promise<number> {
    const count = await this.Player.MailRepo.CountUnread();
    return count;
  }

  /**
   * 读取邮件
   * 
   * @param mailId 邮件ID
   * @returns 邮件信息
   */
  public async ReadMail(mailId: number): Promise<IMailInfo | null> {
    const mail = await this.Player.MailRepo.FindMailById(mailId);
    
    if (!mail) {
      Logger.Warn(`[MailManager] 邮件不存在: MailId=${mailId}`);
      return null;
    }

    if (mail.userId !== this.UserID) {
      Logger.Warn(`[MailManager] 邮件不属于该玩家: MailId=${mailId}, UserId=${this.UserID}`);
      return null;
    }

    // 标记为已读
    if (!mail.isRead) {
      await this.Player.MailRepo.MarkAsRead(mailId);
      mail.isRead = true;
    }

    return mail;
  }

  /**
   * 标记所有邮件为已读
   * 
   * @returns 是否成功
   */
  public async MarkAllAsRead(): Promise<boolean> {
    const success = await this.Player.MailRepo.MarkAllAsRead();
    if (success) {
      Logger.Info(`[MailManager] 标记所有邮件已读: UserId=${this.UserID}`);
    }
    return success;
  }

  /**
   * 领取邮件附件
   * 
   * @param mailId 邮件ID
   * @returns 是否成功
   */
  public async ClaimAttachment(mailId: number): Promise<{
    success: boolean;
    attachmentType: number;
    attachmentId: number;
    attachmentCount: number;
  }> {
    const mail = await this.Player.MailRepo.FindMailById(mailId);
    
    if (!mail) {
      Logger.Warn(`[MailManager] 邮件不存在: MailId=${mailId}`);
      return { success: false, attachmentType: 0, attachmentId: 0, attachmentCount: 0 };
    }

    if (mail.userId !== this.UserID) {
      Logger.Warn(`[MailManager] 邮件不属于该玩家: MailId=${mailId}, UserId=${this.UserID}`);
      return { success: false, attachmentType: 0, attachmentId: 0, attachmentCount: 0 };
    }

    if (!mail.hasAttachment) {
      Logger.Warn(`[MailManager] 邮件没有附件: MailId=${mailId}`);
      return { success: false, attachmentType: 0, attachmentId: 0, attachmentCount: 0 };
    }

    if (mail.isClaimed) {
      Logger.Warn(`[MailManager] 附件已领取: MailId=${mailId}`);
      return { success: false, attachmentType: 0, attachmentId: 0, attachmentCount: 0 };
    }

    // 根据附件类型发放奖励
    let rewardSuccess = false;
    
    switch (mail.attachmentType) {
      case MailAttachmentType.ITEM:
        // 添加物品到背包
        rewardSuccess = await this.Player.ItemRepo.AddItem(mail.attachmentId, mail.attachmentCount);
        if (rewardSuccess) {
          Logger.Info(`[MailManager] 发放物品奖励: ItemId=${mail.attachmentId}, Count=${mail.attachmentCount}`);
        } else {
          Logger.Warn(`[MailManager] 发放物品奖励失败: ItemId=${mail.attachmentId}`);
        }
        break;
        
      case MailAttachmentType.PET:
        // 添加精灵到背包
        rewardSuccess = await this.Player.PetManager.GivePet(mail.attachmentId);
        if (rewardSuccess) {
          Logger.Info(`[MailManager] 发放精灵奖励: PetId=${mail.attachmentId}`);
        } else {
          Logger.Warn(`[MailManager] 发放精灵奖励失败: PetId=${mail.attachmentId}`);
        }
        break;
        
      case MailAttachmentType.COINS:
        // 添加金币
        rewardSuccess = await this.Player.PlayerRepo.AddCurrency(undefined, mail.attachmentCount);
        if (rewardSuccess) {
          Logger.Info(`[MailManager] 发放金币奖励: Coins=${mail.attachmentCount}`);
        } else {
          Logger.Warn(`[MailManager] 发放金币奖励失败: Coins=${mail.attachmentCount}`);
        }
        break;
        
      default:
        Logger.Warn(`[MailManager] 未知的附件类型: ${mail.attachmentType}`);
        return { success: false, attachmentType: 0, attachmentId: 0, attachmentCount: 0 };
    }
    
    // 如果奖励发放失败，不标记为已领取
    if (!rewardSuccess) {
      Logger.Error(`[MailManager] 附件发放失败，不标记为已领取: MailId=${mailId}`);
      return { success: false, attachmentType: mail.attachmentType, attachmentId: mail.attachmentId, attachmentCount: mail.attachmentCount };
    }

    // 标记为已领取
    await this.Player.MailRepo.ClaimAttachment(mailId);

    Logger.Info(`[MailManager] 领取邮件附件: MailId=${mailId}, Type=${mail.attachmentType}, Id=${mail.attachmentId}, Count=${mail.attachmentCount}`);

    return {
      success: true,
      attachmentType: mail.attachmentType,
      attachmentId: mail.attachmentId,
      attachmentCount: mail.attachmentCount
    };
  }

  /**
   * 删除邮件
   * 
   * @param mailId 邮件ID
   * @returns 是否成功
   */
  public async DeleteMail(mailId: number): Promise<boolean> {
    const mail = await this.Player.MailRepo.FindMailById(mailId);
    
    if (!mail) {
      Logger.Warn(`[MailManager] 邮件不存在: MailId=${mailId}`);
      return false;
    }

    if (mail.userId !== this.UserID) {
      Logger.Warn(`[MailManager] 邮件不属于该玩家: MailId=${mailId}, UserId=${this.UserID}`);
      return false;
    }

    // 如果有未领取的附件，不允许删除
    if (mail.hasAttachment && !mail.isClaimed) {
      Logger.Warn(`[MailManager] 邮件有未领取的附件，不能删除: MailId=${mailId}`);
      return false;
    }

    const success = await this.Player.MailRepo.Delete(mailId);
    if (success) {
      Logger.Info(`[MailManager] 删除邮件: MailId=${mailId}`);
    }

    return success;
  }

  /**
   * 删除所有已读邮件
   * 
   * @returns 删除的数量
   */
  public async DeleteAllRead(): Promise<number> {
    const count = await this.Player.MailRepo.DeleteAllRead();
    Logger.Info(`[MailManager] 删除所有已读邮件: UserId=${this.UserID}, Count=${count}`);
    return count;
  }

  /**
   * 发送邮件
   * 
   * @param targetUserId 收件人ID
   * @param title 标题
   * @param content 内容
   * @param attachmentType 附件类型
   * @param attachmentId 附件ID
   * @param attachmentCount 附件数量
   * @param mailType 邮件类型
   * @param expireDays 过期天数（0=永不过期）
   * @returns 邮件ID
   */
  public async SendMail(
    targetUserId: number,
    title: string,
    content: string,
    attachmentType: MailAttachmentType = MailAttachmentType.NONE,
    attachmentId: number = 0,
    attachmentCount: number = 0,
    mailType: MailType = MailType.NORMAL,
    expireDays: number = 7
  ): Promise<number> {
    const mail = createDefaultMailInfo(targetUserId, this.UserID);
    
    mail.title = title;
    mail.content = content;
    mail.hasAttachment = attachmentType !== MailAttachmentType.NONE;
    mail.attachmentType = attachmentType;
    mail.attachmentId = attachmentId;
    mail.attachmentCount = attachmentCount;
    mail.mailType = mailType;

    // 设置过期时间
    if (expireDays > 0) {
      mail.expireTime = mail.sendTime + (expireDays * 24 * 60 * 60);
    }

    const mailId = await this.Player.MailRepo.Create(mail);
    
    if (mailId > 0) {
      Logger.Info(`[MailManager] 发送邮件: From=${this.UserID}, To=${targetUserId}, MailId=${mailId}`);
    }

    return mailId;
  }

  /**
   * 发送系统邮件（静态方法，不需要玩家实例）
   * 
   * @param targetUserId 收件人ID
   * @param title 标题
   * @param content 内容
   * @param attachmentType 附件类型
   * @param attachmentId 附件ID
   * @param attachmentCount 附件数量
   * @param expireDays 过期天数
   * @returns 邮件ID
   */
  public static async SendSystemMail(
    targetUserId: number,
    title: string,
    content: string,
    attachmentType: MailAttachmentType = MailAttachmentType.NONE,
    attachmentId: number = 0,
    attachmentCount: number = 0,
    expireDays: number = 7
  ): Promise<number> {
    const mailRepo = new MailRepository();
    const mail = createDefaultMailInfo(targetUserId, 0); // senderId=0 表示系统
    
    mail.senderNick = '系统';
    mail.title = title;
    mail.content = content;
    mail.hasAttachment = attachmentType !== MailAttachmentType.NONE;
    mail.attachmentType = attachmentType;
    mail.attachmentId = attachmentId;
    mail.attachmentCount = attachmentCount;
    mail.mailType = MailType.SYSTEM;

    // 设置过期时间
    if (expireDays > 0) {
      mail.expireTime = mail.sendTime + (expireDays * 24 * 60 * 60);
    }

    const mailId = await mailRepo.Create(mail);
    
    if (mailId > 0) {
      Logger.Info(`[MailManager] 发送系统邮件: To=${targetUserId}, MailId=${mailId}`);
    }

    return mailId;
  }

  /**
   * 清理过期邮件（定时任务调用）
   * 
   * @returns 删除的数量
   */
  public static async CleanupExpiredMails(): Promise<number> {
    const mailRepo = new MailRepository();
    const count = await mailRepo.DeleteExpired();
    
    if (count > 0) {
      Logger.Info(`[MailManager] 清理过期邮件: Count=${count}`);
    }

    return count;
  }

  // ============ Handler 方法 ============

  /**
   * 处理获取邮件列表请求
   */
  public async HandleGetMailList(): Promise<void> {
    const mails = await this.GetMailList(100);
    const total = await this.Player.MailRepo.CountByUserId();
    
    await this.Player.SendPacket(new PacketMailGetList(total, mails));
    Logger.Info(`[MailManager] 发送邮件列表: UserId=${this.UserID}, Count=${mails.length}`);
  }

  /**
   * 处理获取未读邮件数量请求
   */
  public async HandleGetUnreadCount(): Promise<void> {
    const count = await this.GetUnreadCount();
    
    await this.Player.SendPacket(new PacketMailGetUnread(count));
    Logger.Info(`[MailManager] 发送未读邮件数量: UserId=${this.UserID}, Count=${count}`);
  }

  /**
   * 处理读取邮件请求
   */
  public async HandleReadMail(mailId: number): Promise<void> {
    const mail = await this.ReadMail(mailId);
    
    await this.Player.SendPacket(new PacketMailGetContent(mail));
    Logger.Info(`[MailManager] 发送邮件内容: UserId=${this.UserID}, MailId=${mailId}, Success=${mail !== null}`);
  }

  /**
   * 处理标记邮件为已读请求
   */
  public async HandleMarkAsRead(mailId: number): Promise<void> {
    let success = false;
    
    if (mailId === 0) {
      // 标记所有邮件为已读
      success = await this.MarkAllAsRead();
    } else {
      // 标记单个邮件为已读
      const mail = await this.Player.MailRepo.FindMailById(mailId);
      if (mail && mail.userId === this.UserID) {
        success = await this.Player.MailRepo.MarkAsRead(mailId);
      }
    }
    
    await this.Player.SendPacket(new PacketMailSetReaded(success, mailId));
    Logger.Info(`[MailManager] 标记邮件已读: UserId=${this.UserID}, MailId=${mailId}, Success=${success}`);
  }

  /**
   * 处理删除邮件请求
   */
  public async HandleDeleteMail(mailId: number): Promise<void> {
    const success = await this.DeleteMail(mailId);
    
    await this.Player.SendPacket(new PacketMailDelete(success, mailId));
    Logger.Info(`[MailManager] 删除邮件: UserId=${this.UserID}, MailId=${mailId}, Success=${success}`);
  }

  /**
   * 处理删除所有已读邮件请求
   */
  public async HandleDeleteAllRead(): Promise<void> {
    const count = await this.DeleteAllRead();
    
    await this.Player.SendPacket(new PacketMailDelAll(count));
    Logger.Info(`[MailManager] 删除所有已读邮件: UserId=${this.UserID}, Count=${count}`);
  }
}
