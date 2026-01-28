import { PlayerInstance } from '../Player/PlayerInstance';
import { Logger } from '../../../shared/utils';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { FriendData } from '../../../DataBase/models/FriendData';
import { PlayerData } from '../../../DataBase/models/PlayerData';
import { OnlineTracker } from '../Player/OnlineTracker';
import { 
  PacketFriendAdd, 
  PacketFriendAnswer, 
  PacketFriendRemove,
  PacketBlackAdd,
  PacketBlackRemove,
  PacketSeeOnline,
  PacketFriendList,
  PacketBlackList
} from '../../Server/Packet/Send';
import { IOnlineInfo } from '../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto';
import { IFriendInfo } from '../../../shared/proto/packets/rsp/friend/FriendListRspProto';
import { IBlackInfo } from '../../../shared/proto/packets/rsp/friend/BlackListRspProto';

/**
 * 好友管理器
 * 负责处理好友相关的业务逻辑
 * 
 * 架构特点：
 * - 持有 FriendData 对象（直接映射数据库）
 * - 直接操作 FriendData 的属性（Array.push、Array.splice 等）
 * - 使用 DatabaseHelper 实时保存数据
 * - 不使用 Repository，直接操作 Data 对象
 */
export class FriendManager {
  private _player: PlayerInstance;
  
  /** 好友数据*/
  public FriendData!: FriendData;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 初始化（加载好友数据�?
   */
  public async Initialize(): Promise<void> {
    this.FriendData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(this._player.Uid);
    Logger.Debug(`[FriendManager] 好友数据已加�? uid=${this._player.Uid}, friends=${this.FriendData.FriendList.length}`);
  }

  /**
   * 添加好友（发送好友申请）
   */
  public async AddFriend(targetUid: number): Promise<void> {
    // 获取目标玩家�?FriendData
    const target = await DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
    if (!target) return;

    // 已经是好�?
    if (this.FriendData.FriendList.includes(targetUid)) {
      Logger.Warn(`[FriendManager] 已经是好�? ${this._player.Uid} -> ${targetUid}`);
      return;
    }

    // 在黑名单�?
    if (this.FriendData.BlackList.includes(targetUid)) {
      Logger.Warn(`[FriendManager] 对方在黑名单�? ${this._player.Uid} -> ${targetUid}`);
      return;
    }

    // 已经发送过申请
    if (this.FriendData.SendApplyList.includes(targetUid)) {
      Logger.Warn(`[FriendManager] 已经发送过好友申请: ${this._player.Uid} -> ${targetUid}`);
      return;
    }

    // 已经收到对方的申�?
    if (this.FriendData.ReceiveApplyList.includes(targetUid)) {
      Logger.Warn(`[FriendManager] 已经收到对方的好友申�? ${this._player.Uid} -> ${targetUid}`);
      return;
    }

    // 添加到发送申请列表（直接操作数组�?
    this.FriendData.SendApplyList.push(targetUid);
    target.ReceiveApplyList.push(this._player.Uid);

    // 如果目标玩家在线，发送通知
    const targetSession = OnlineTracker.Instance.GetPlayerSession(targetUid);
    if (targetSession && targetSession.Player) {
      // TODO: 发送好友申请通知
      // await targetSession.Player.SendPacket(new PacketSyncApplyFriendScNotify(this._player.Data));
      // 更新目标玩家的内存数�?
      if (targetSession.Player.FriendManager) {
        targetSession.Player.FriendManager.FriendData.ReceiveApplyList.push(this._player.Uid);
      }
    }

    // 立即保存双方的好友数�?
    await DatabaseHelper.Instance.SaveFriendData(this.FriendData);
    await DatabaseHelper.Instance.SaveFriendData(target);

    Logger.Info(`[FriendManager] 发送好友申�? ${this._player.Uid} -> ${targetUid}`);
    
    // 发送响�?
    await this._player.SendPacket(new PacketFriendAdd(0));
  }

  /**
   * 确认添加好友（接受好友申请）
   */
  public async ConfirmAddFriend(targetUid: number): Promise<void> {
    // 获取目标玩家�?FriendData
    const target = await DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
    if (!target) {
      await this._player.SendPacket(new PacketFriendAnswer(1)); // 失败
      return;
    }

    // 已经是好�?
    if (this.FriendData.FriendList.includes(targetUid)) {
      await this._player.SendPacket(new PacketFriendAnswer(1));
      return;
    }

    // 在黑名单�?
    if (this.FriendData.BlackList.includes(targetUid)) {
      await this._player.SendPacket(new PacketFriendAnswer(1));
      return;
    }

    // 没有收到申请
    if (!this.FriendData.ReceiveApplyList.includes(targetUid)) {
      await this._player.SendPacket(new PacketFriendAnswer(1));
      return;
    }

    // 移除申请记录（直接操作数组）
    const receiveIndex = this.FriendData.ReceiveApplyList.indexOf(targetUid);
    if (receiveIndex > -1) {
      this.FriendData.ReceiveApplyList.splice(receiveIndex, 1);
    }

    const sendIndex = target.SendApplyList.indexOf(this._player.Uid);
    if (sendIndex > -1) {
      target.SendApplyList.splice(sendIndex, 1);
    }

    // 添加到好友列表（双向�?
    this.FriendData.FriendList.push(targetUid);
    target.FriendList.push(this._player.Uid);

    // 如果目标玩家在线，发送通知
    const targetSession = OnlineTracker.Instance.GetPlayerSession(targetUid);
    if (targetSession && targetSession.Player) {
      // TODO: 发送好友确认通知
      // await targetSession.Player.SendPacket(new PacketSyncHandleFriendScNotify(this._player.Uid, true, this._player.Data));
    }

    // 标记需要保存
    await DatabaseHelper.Instance.SaveFriendData(this.FriendData);
    await DatabaseHelper.Instance.SaveFriendData(target);

    Logger.Info(`[FriendManager] 接受好友申请: ${this._player.Uid} <- ${targetUid}`);
    
    // 发送响�?
    await this._player.SendPacket(new PacketFriendAnswer(0));
  }

  /**
   * 拒绝好友申请
   */
  public RefuseAddFriend(targetUid: number): void {
    const target = DatabaseHelper.Instance.GetInstance_FriendData(targetUid);
    if (!target) return;

    // 没有收到申请
    if (!this.FriendData.ReceiveApplyList.includes(targetUid)) return;

    // 移除申请记录
    const receiveIndex = this.FriendData.ReceiveApplyList.indexOf(targetUid);
    if (receiveIndex > -1) {
      this.FriendData.ReceiveApplyList.splice(receiveIndex, 1);
    }

    const sendIndex = target.SendApplyList.indexOf(this._player.Uid);
    if (sendIndex > -1) {
      target.SendApplyList.splice(sendIndex, 1);
    }

    // 如果目标玩家在线，更新内存数�?
    const targetSession = OnlineTracker.Instance.GetPlayerSession(targetUid);
    if (targetSession?.Player?.FriendManager) {
      const idx = targetSession.Player.FriendManager.FriendData.SendApplyList.indexOf(this._player.Uid);
      if (idx > -1) {
        targetSession.Player.FriendManager.FriendData.SendApplyList.splice(idx, 1);
      }
    }

    // 标记需要保�?
    DatabaseHelper.Instance.SaveFriendData(this.FriendData);
    DatabaseHelper.Instance.SaveFriendData(target);

    Logger.Info(`[FriendManager] 拒绝好友申请: ${this._player.Uid} <- ${targetUid}`);
  }

  /**
   * 删除好友
   */
  public async RemoveFriend(targetUid: number): Promise<void> {
    // 不是好友
    if (!this.FriendData.FriendList.includes(targetUid)) {
      await this._player.SendPacket(new PacketFriendRemove(1));
      return;
    }

    // 移除好友关系（双向）
    const myIndex = this.FriendData.FriendList.indexOf(targetUid);
    if (myIndex > -1) {
      this.FriendData.FriendList.splice(myIndex, 1);
    }

    const target = await DatabaseHelper.Instance.GetInstanceOrCreateNew_FriendData(targetUid);
    if (target) {
      const targetIndex = target.FriendList.indexOf(this._player.Uid);
      if (targetIndex > -1) {
        target.FriendList.splice(targetIndex, 1);
      }
    await DatabaseHelper.Instance.SaveFriendData(target);
    }

    // 标记需要保�?
    await DatabaseHelper.Instance.SaveFriendData(this.FriendData);

    Logger.Info(`[FriendManager] 删除好友: ${this._player.Uid} -> ${targetUid}`);
    
    // 发送响�?
    await this._player.SendPacket(new PacketFriendRemove(0));
  }

  /**
   * 添加到黑名单
   */
  public async AddToBlacklist(targetUid: number): Promise<void> {
    // 已经在黑名单�?
    if (this.FriendData.BlackList.includes(targetUid)) {
      await this._player.SendPacket(new PacketBlackAdd(1));
      return;
    }

    // 如果是好友，先删除好友关�?
    if (this.FriendData.FriendList.includes(targetUid)) {
      await this.RemoveFriend(targetUid);
    }

    // 添加到黑名单
    this.FriendData.BlackList.push(targetUid);

    // 标记需要保�?
    await DatabaseHelper.Instance.SaveFriendData(this.FriendData);

    Logger.Info(`[FriendManager] 添加到黑名单: ${this._player.Uid} -> ${targetUid}`);
    
    // 发送响�?
    await this._player.SendPacket(new PacketBlackAdd(0));
  }

  /**
   * 从黑名单移除
   */
  public async RemoveFromBlacklist(targetUid: number): Promise<void> {
    // 不在黑名单中
    if (!this.FriendData.BlackList.includes(targetUid)) {
      await this._player.SendPacket(new PacketBlackRemove(1));
      return;
    }

    // 从黑名单移除
    const index = this.FriendData.BlackList.indexOf(targetUid);
    if (index > -1) {
      this.FriendData.BlackList.splice(index, 1);
    }

    // 标记需要保�?
    await DatabaseHelper.Instance.SaveFriendData(this.FriendData);

    Logger.Info(`[FriendManager] 从黑名单移除: ${this._player.Uid} -> ${targetUid}`);
    
    // 发送响�?
    await this._player.SendPacket(new PacketBlackRemove(0));
  }

  /**
   * 获取好友列表
   */
  public async GetFriendList(): Promise<void> {
    const friendInfos: IFriendInfo[] = [];

    for (const friendUid of this.FriendData.FriendList) {
      const friendData = await PlayerData.GetPlayerByUid(friendUid);
      if (!friendData) continue;

      const isOnline = OnlineTracker.Instance.IsOnline(friendUid);
      
      friendInfos.push({
        userId: friendData.userID,
        nickname: friendData.nick,
        color: friendData.color,
        isOnline: isOnline
      });
    }

    await this._player.SendPacket(new PacketFriendList(friendInfos));
  }

  /**
   * 获取黑名单列�?
   */
  public async GetBlacklist(): Promise<void> {
    const blackInfos: IBlackInfo[] = [];

    for (const blackUid of this.FriendData.BlackList) {
      // �?使用静态方�?
      const blackData = await PlayerData.GetPlayerByUid(blackUid);
      if (!blackData) continue;

      blackInfos.push({
        userId: blackData.userID,
        nickname: blackData.nick,
        color: blackData.color
      });
    }

    await this._player.SendPacket(new PacketBlackList(blackInfos));
  }

  /**
   * 查看在线好友
   */
  public async SeeOnline(): Promise<void> {
    const onlineInfos: IOnlineInfo[] = [];

    for (const friendUid of this.FriendData.FriendList) {
      if (OnlineTracker.Instance.IsOnline(friendUid)) {
        // �?使用静态方�?
        const friendData = await PlayerData.GetPlayerByUid(friendUid);
        if (!friendData) continue;

        onlineInfos.push({
          userId: friendData.userID,
          serverId: 1,
          mapType: 0,
          mapId: friendData.mapID
        });
      }
    }

    await this._player.SendPacket(new PacketSeeOnline(onlineInfos));
  }

  /**
   * 登出清理
   */
  public async OnLogout(): Promise<void> {
    // 保存数据
    if (this.FriendData) {
      await DatabaseHelper.Instance.SaveFriendData(this.FriendData);
    }
  }
}
