/**
 * 邮件数据类
 * 直接映射数据库表，提供静态方法便捷访问
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { IMailInfo } from '../../shared/models/MailModel';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';

/**
 * 邮件数据（对应数据库表 mails）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetMailDataByUid 便捷访问
 */
export class MailData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 邮件列表 */
  public MailList: IMailInfo[] = [];

  constructor(uid: number) {
    // 调用父类构造函数
    super(
      uid,
      [], // 额外的黑名单字段
      ['MailList'] // 需要深度 Proxy 的数组字段
    );
    
    this.Uid = uid;

    // 返回 Proxy 包装的对象，实现自动保存
    return this.createProxy(this);
  }

  /**
   * 立即保存到数据库
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveMailData(this);
      Logger.Debug(`[MailData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[MailData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 MailData
   */
  public static FromRow(row: any): MailData {
    const data = new MailData(row.owner_id);
    data.MailList = row.mail_list ? JSON.parse(row.mail_list) : [];
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    return {
      owner_id: this.Uid,
      mail_list: JSON.stringify(this.MailList)
    };
  }

  /**
   * 静态方法：根据 UID 获取邮件数据
   */
  public static async GetMailDataByUid(uid: number): Promise<MailData | null> {
    const data = await DatabaseHelper.Instance.GetInstance_MailData(uid);
    return data;
  }

  /**
   * 添加邮件
   */
  public AddMail(mail: IMailInfo): void {
    this.MailList.push(mail);
    // 自动触发保存（通过深度 Proxy）
  }

  /**
   * 删除邮件
   */
  public DeleteMail(mailId: number): boolean {
    const index = this.MailList.findIndex(m => m.id === mailId);
    if (index === -1) return false;
    
    this.MailList.splice(index, 1);
    // 自动触发保存（通过深度 Proxy）
    return true;
  }

  /**
   * 获取邮件
   */
  public GetMail(mailId: number): IMailInfo | null {
    return this.MailList.find(m => m.id === mailId) || null;
  }

  /**
   * 获取未读邮件
   */
  public GetUnreadMails(): IMailInfo[] {
    return this.MailList.filter(m => !m.isRead);
  }

  /**
   * 获取未读邮件数量
   */
  public GetUnreadCount(): number {
    return this.MailList.filter(m => !m.isRead).length;
  }

  /**
   * 标记邮件为已读
   */
  public MarkAsRead(mailId: number): boolean {
    const mail = this.GetMail(mailId);
    if (!mail) return false;
    
    mail.isRead = true;
    // 自动触发保存（通过深度 Proxy）
    return true;
  }

  /**
   * 标记所有邮件为已读
   */
  public MarkAllAsRead(): void {
    this.MailList.forEach(m => m.isRead = true);
    // 自动触发保存（通过深度 Proxy）
  }

  /**
   * 领取附件
   */
  public ClaimAttachment(mailId: number): boolean {
    const mail = this.GetMail(mailId);
    if (!mail || !mail.hasAttachment || mail.isClaimed) return false;
    
    mail.isClaimed = true;
    // 自动触发保存（通过深度 Proxy）
    return true;
  }

  /**
   * 删除所有已读邮件
   */
  public DeleteAllRead(): number {
    const beforeCount = this.MailList.length;
    this.MailList = this.MailList.filter(m => !m.isRead || (m.hasAttachment && !m.isClaimed));
    // 自动触发保存（通过深度 Proxy）
    return beforeCount - this.MailList.length;
  }
}
