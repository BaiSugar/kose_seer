import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IMailInfo } from '../../../shared/models/MailModel';
import { PacketMailGetList, PacketMailGetUnread, PacketMailGetContent, PacketMailSetReaded, PacketMailDelete, PacketMailDelAll } from '../../Server/Packet/Send/Mail';
import { MailData } from '../../../DataBase/models/MailData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';

export class MailManager extends BaseManager {
  public MailData!: MailData;

  constructor(player: PlayerInstance) {
    super(player);
  }

  public async Initialize(): Promise<void> {
    this.MailData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_MailData(this.UserID);
    Logger.Debug(`[MailManager] 初始化完�? UserID=${this.UserID}, Mails=${this.MailData.MailList.length}`);
  }

  public async HandleGetMailList(): Promise<void> {
    const mails = this.MailData.MailList.slice(0, 100);
    await this.Player.SendPacket(new PacketMailGetList(this.MailData.MailList.length, mails));
  }

  public async HandleGetUnreadCount(): Promise<void> {
    const count = this.MailData.GetUnreadCount();
    await this.Player.SendPacket(new PacketMailGetUnread(count));
  }

  public async HandleReadMail(mailId: number): Promise<void> {
    const mail = this.MailData.GetMail(mailId);
    if (mail && !mail.isRead) {
      this.MailData.MarkAsRead(mailId);
      await DatabaseHelper.Instance.SaveMailData(this.MailData);
    }
    await this.Player.SendPacket(new PacketMailGetContent(mail));
  }

  public async HandleMarkAsRead(mailId: number): Promise<void> {
    let success = false;
    if (mailId === 0) {
      this.MailData.MarkAllAsRead();
      await DatabaseHelper.Instance.SaveMailData(this.MailData);
      success = true;
    } else {
      success = this.MailData.MarkAsRead(mailId);
      if (success) {
        await DatabaseHelper.Instance.SaveMailData(this.MailData);
      }
    }
    await this.Player.SendPacket(new PacketMailSetReaded(success, mailId));
  }

  public async HandleDeleteMail(mailId: number): Promise<void> {
    const mail = this.MailData.GetMail(mailId);
    const success = mail && !(mail.hasAttachment && !mail.isClaimed) ? this.MailData.DeleteMail(mailId) : false;
    if (success) {
      await DatabaseHelper.Instance.SaveMailData(this.MailData);
    }
    await this.Player.SendPacket(new PacketMailDelete(success, mailId));
  }

  public async HandleDeleteAllRead(): Promise<void> {
    const count = this.MailData.DeleteAllRead();
    await DatabaseHelper.Instance.SaveMailData(this.MailData);
    await this.Player.SendPacket(new PacketMailDelAll(count));
  }
}
